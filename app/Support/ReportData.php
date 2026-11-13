<?php

namespace App\Support;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookLoan;
use App\Models\CafeteriaInventoryItem;
use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\MealLog;
use App\Models\School;
use App\Models\Student;
use App\Models\TransportPassenger;
use App\Models\TransportRoute;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Builds the cross-module report payload shared by the web page and the CSV/PDF exports.
 */
class ReportData
{
    public static function build(User $user, ?string $schoolId): array
    {
        $schools = School::query()
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('id', $user->school_id))
            ->orderBy('name')->get(['id', 'name', 'code']);

        // Every metric below is confined to the user's school and the selected filter.
        $scoped = fn ($query) => $query->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));

        $students = $scoped(Student::query());
        $employees = $scoped(Employee::query());
        $assets = $scoped(Asset::query());
        $visits = $scoped(ClinicVisit::query());
        $meals = $scoped(MealLog::query());

        $schoolRows = $schools->map(fn (School $school) => [
            'id' => $school->id,
            'name' => $school->name,
            'code' => $school->code,
            'students' => Student::where('school_id', $school->id)->where('status', 'active')->count(),
            'employees' => Employee::where('school_id', $school->id)->where('is_active', true)->count(),
            'assets' => (int) Asset::where('school_id', $school->id)->sum('quantity'),
            'routes' => TransportRoute::where('school_id', $school->id)->where('is_active', true)->count(),
            'books' => (int) Book::where('school_id', $school->id)->sum('total_copies'),
        ]);

        $byGrade = $scoped(Student::query())
            ->selectRaw('grade_level, count(*) as total')->groupBy('grade_level')->orderBy('grade_level')->get()
            ->map(fn ($row) => ['label' => 'Grade '.($row->grade_level ?: '—'), 'value' => (int) $row->total]);

        $studentsBySchool = Student::query()->visibleTo($user)
            ->selectRaw('school_id, count(*) as total, sum(case when gender = ? then 1 else 0 end) as male, sum(case when gender = ? then 1 else 0 end) as female', ['male', 'female'])
            ->groupBy('school_id')->get()
            ->map(fn ($row) => [
                'school' => $schools->firstWhere('id', $row->school_id)?->name ?? 'Unknown',
                'total' => (int) $row->total,
                'male' => (int) $row->male,
                'female' => (int) $row->female,
            ]);

        $employeesByType = $scoped(Employee::query())
            ->selectRaw('type, count(*) as total')->groupBy('type')->get()
            ->map(fn ($row) => ['label' => ucfirst($row->type), 'value' => (int) $row->total]);

        $assetsByCondition = $scoped(Asset::query())
            ->selectRaw('condition, count(*) as total, sum(quantity) as units')->groupBy('condition')->get()
            ->map(fn ($row) => ['label' => str_replace('_', ' ', ucfirst($row->condition)), 'value' => (int) $row->total, 'units' => (int) $row->units]);

        $assetsByCategory = AssetCategory::query()
            ->withCount(['assets' => fn ($q) => $scoped($q)])
            ->orderByDesc('assets_count')->limit(8)->get()
            ->map(fn ($category) => ['label' => $category->name, 'value' => $category->assets_count]);

        $routeUtilization = $scoped(TransportRoute::query())
            ->with('vehicle:id,capacity,plate_number')
            ->withCount(['passengers' => fn ($q) => $q->where('is_active', true)])
            ->orderByDesc('passengers_count')->limit(8)->get()
            ->map(fn (TransportRoute $route) => [
                'route' => $route->name,
                'code' => $route->code,
                'passengers' => $route->passengers_count,
                'capacity' => $route->vehicle?->capacity ?? 0,
                'utilization' => $route->vehicle?->capacity
                    ? round(($route->passengers_count / $route->vehicle->capacity) * 100)
                    : 0,
            ]);

        $libraryByCategory = BookCategory::query()
            ->withCount(['books' => fn ($q) => $scoped($q)])
            ->orderByDesc('books_count')->limit(8)->get()
            ->map(fn ($category) => ['label' => $category->name, 'value' => $category->books_count]);

        $clinicByDisposition = $scoped(ClinicVisit::query())
            ->selectRaw('disposition, count(*) as total')->groupBy('disposition')->get()
            ->map(fn ($row) => ['label' => str_replace('_', ' ', ucfirst($row->disposition)), 'value' => (int) $row->total]);

        $topComplaints = $scoped(ClinicVisit::query())
            ->selectRaw('complaint, count(*) as total')->groupBy('complaint')->orderByDesc('total')->limit(6)->get()
            ->map(fn ($row) => ['label' => $row->complaint, 'value' => (int) $row->total]);

        $mealTrend = collect(range(6, 0))->map(function (int $daysAgo) use ($meals) {
            $day = Carbon::today()->subDays($daysAgo);

            return [
                'label' => $day->format('D'),
                'date' => $day->toDateString(),
                'students' => (int) (clone $meals)->whereDate('meal_date', $day)->sum('students_served'),
                'staff' => (int) (clone $meals)->whereDate('meal_date', $day)->sum('staff_served'),
            ];
        });

        $libraryByCategorySummary = LibraryMember::query()->visibleTo($user)->count();
        $lowStockItems = CafeteriaInventoryItem::query()->visibleTo($user)
            ->whereColumn('quantity', '<=', 'min_quantity')->count();

        return [
            'schools' => $schools,
            'filters' => ['school_id' => $schoolId],
            'summary' => [
                'students' => (clone $students)->where('status', 'active')->count(),
                'employees' => (clone $employees)->where('is_active', true)->count(),
                'asset_units' => (int) (clone $assets)->sum('quantity'),
                'active_routes' => $scoped(TransportRoute::query())->where('is_active', true)->count(),
                'passengers' => TransportPassenger::query()->whereHas('route', fn ($q) => $scoped($q))->where('is_active', true)->count(),
                'book_copies' => (int) $scoped(Book::query())->sum('total_copies'),
                'active_loans' => $scoped(BookLoan::query())->whereIn('status', ['borrowed', 'overdue'])->count(),
                'clinic_visits_30d' => (clone $visits)->where('visit_date', '>=', Carbon::today()->subDays(30))->count(),
                'meals_served_30d' => (int) (clone $meals)->where('meal_date', '>=', Carbon::today()->subDays(30))
                    ->selectRaw('coalesce(sum(students_served + staff_served + guests_served), 0) as total')->value('total'),
            ],
            'schoolRows' => $schoolRows,
            'byGrade' => $byGrade,
            'studentsBySchool' => $studentsBySchool,
            'employeesByType' => $employeesByType,
            'assetsByCondition' => $assetsByCondition,
            'assetsByCategory' => $assetsByCategory,
            'routeUtilization' => $routeUtilization,
            'libraryByCategory' => $libraryByCategory,
            'clinicByDisposition' => $clinicByDisposition,
            'topComplaints' => $topComplaints,
            'mealTrend' => $mealTrend,
            'generatedAt' => now()->toIso8601String(),
            'context' => [
                'school' => $schoolId ? $schools->firstWhere('id', $schoolId)?->name : null,
                'library_members' => $libraryByCategorySummary,
                'low_stock_items' => $lowStockItems,
            ],
        ];
    }
}

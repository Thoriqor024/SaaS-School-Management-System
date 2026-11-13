<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Book;
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
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $schoolId = $request->input('school_id');
        $schoolFilter = fn ($query) => $query->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));

        $schools = School::query()
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('id', $user->school_id))
            ->orderBy('name')->get(['id', 'name', 'code']);

        $students = Student::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));
        $employees = Employee::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));
        $assets = Asset::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));
        $visits = ClinicVisit::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));
        $meals = MealLog::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v));

        $schoolRows = $schools->map(function (School $school) {
            return [
                'id' => $school->id,
                'name' => $school->name,
                'code' => $school->code,
                'students' => Student::where('school_id', $school->id)->where('status', 'active')->count(),
                'employees' => Employee::where('school_id', $school->id)->where('is_active', true)->count(),
                'assets' => (int) Asset::where('school_id', $school->id)->sum('quantity'),
                'routes' => TransportRoute::where('school_id', $school->id)->where('is_active', true)->count(),
                'books' => (int) Book::where('school_id', $school->id)->sum('total_copies'),
            ];
        });

        $byGrade = Student::query()->visibleTo($user)
            ->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))
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

        $employeesByType = Employee::query()->visibleTo($user)
            ->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))
            ->selectRaw('type, count(*) as total')->groupBy('type')->get()
            ->map(fn ($row) => ['label' => ucfirst($row->type), 'value' => (int) $row->total]);

        $assetsByCondition = Asset::query()->visibleTo($user)
            ->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))
            ->selectRaw('condition, count(*) as total, sum(quantity) as units')->groupBy('condition')->get()
            ->map(fn ($row) => ['label' => str_replace('_', ' ', ucfirst($row->condition)), 'value' => (int) $row->total, 'units' => (int) $row->units]);

        $assetsByCategory = AssetCategory::query()
            ->withCount(['assets' => fn ($q) => $q->visibleTo($user)->when($schoolId, fn ($inner, $v) => $inner->where('school_id', $v))])
            ->orderByDesc('assets_count')->limit(8)->get()
            ->map(fn ($category) => ['label' => $category->name, 'value' => $category->assets_count]);

        $routeUtilization = TransportRoute::query()->visibleTo($user)
            ->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))
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

        $libraryByCategory = \App\Models\BookCategory::query()
            ->withCount(['books' => fn ($q) => $q->visibleTo($user)->when($schoolId, fn ($inner, $v) => $inner->where('school_id', $v))])
            ->orderByDesc('books_count')->limit(8)->get()
            ->map(fn ($category) => ['label' => $category->name, 'value' => $category->books_count]);

        $clinicByDisposition = ClinicVisit::query()->visibleTo($user)
            ->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))
            ->selectRaw('disposition, count(*) as total')->groupBy('disposition')->get()
            ->map(fn ($row) => ['label' => str_replace('_', ' ', ucfirst($row->disposition)), 'value' => (int) $row->total]);

        $topComplaints = ClinicVisit::query()->visibleTo($user)
            ->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))
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

        return Inertia::render('Reports/Index', [
            'schools' => $schools,
            'filters' => ['school_id' => $schoolId],
            'summary' => [
                'students' => (clone $students)->where('status', 'active')->count(),
                'employees' => (clone $employees)->where('is_active', true)->count(),
                'asset_units' => (int) (clone $assets)->sum('quantity'),
                'active_routes' => TransportRoute::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))->where('is_active', true)->count(),
                'passengers' => TransportPassenger::query()->whereHas('route', fn ($q) => $q->visibleTo($user)->when($schoolId, fn ($inner, $v) => $inner->where('school_id', $v)))->where('is_active', true)->count(),
                'book_copies' => (int) Book::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))->sum('total_copies'),
                'active_loans' => BookLoan::query()->visibleTo($user)->when($schoolId, fn ($q, $v) => $q->where('school_id', $v))->whereIn('status', ['borrowed', 'overdue'])->count(),
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
        ]);
    }
}

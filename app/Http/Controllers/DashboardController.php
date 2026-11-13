<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Book;
use App\Models\BookLoan;
use App\Models\CafeteriaInventoryItem;
use App\Models\CafeteriaMenu;
use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\MealLog;
use App\Models\Medicine;
use App\Models\PassengerLog;
use App\Models\School;
use App\Models\Student;
use App\Models\TransportPassenger;
use App\Models\TransportRoute;
use App\Models\TransportVehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $today = Carbon::today();

        $students = Student::query()->visibleTo($user);
        $employees = Employee::query()->visibleTo($user);
        $assets = Asset::query()->visibleTo($user);
        $routes = TransportRoute::query()->visibleTo($user);
        $vehicles = TransportVehicle::query()->visibleTo($user);
        $passengers = TransportPassenger::query()
            ->whereHas('student', fn ($q) => $q->visibleTo($user))
            ->where('is_active', true);
        $books = Book::query()->visibleTo($user);
        $loans = BookLoan::query()->visibleTo($user);
        $members = LibraryMember::query()->visibleTo($user);
        $visits = ClinicVisit::query()->visibleTo($user);
        $medicines = Medicine::query()->visibleTo($user);
        $menus = CafeteriaMenu::query()->visibleTo($user);
        $inventory = CafeteriaInventoryItem::query()->visibleTo($user);
        $mealLogs = MealLog::query()->visibleTo($user);

        $stats = [
            'students' => [
                'total' => (clone $students)->count(),
                'active' => (clone $students)->where('status', 'active')->count(),
                'new' => (clone $students)->where('enrollment_year', (string) $today->year)->count(),
                'female' => (clone $students)->where('gender', 'female')->count(),
                'male' => (clone $students)->where('gender', 'male')->count(),
            ],
            'employees' => [
                'total' => (clone $employees)->count(),
                'teachers' => (clone $employees)->where('type', 'teacher')->count(),
                'staff' => (clone $employees)->where('type', 'staff')->count(),
                'general' => (clone $employees)->where('type', 'general')->count(),
                'active' => (clone $employees)->where('is_active', true)->count(),
            ],
            'assets' => [
                'items' => (clone $assets)->count(),
                'units' => (int) (clone $assets)->sum('quantity'),
                'broken' => (clone $assets)->whereIn('condition', ['major_damage', 'broken'])->count(),
                'maintenance' => (clone $assets)->where('status', 'maintenance')->count(),
                'needs_attention' => (clone $assets)->whereIn('condition', ['minor_damage', 'major_damage', 'broken'])->count(),
            ],
            'transport' => [
                'routes' => (clone $routes)->count(),
                'active_routes' => (clone $routes)->where('is_active', true)->count(),
                'vehicles' => (clone $vehicles)->count(),
                'passengers' => (clone $passengers)->count(),
                'trips_logged' => PassengerLog::query()->visibleTo($user)->whereDate('log_date', $today)->count(),
            ],
            'library' => [
                'titles' => (clone $books)->count(),
                'copies' => (int) (clone $books)->sum('total_copies'),
                'members' => (clone $members)->where('status', 'active')->count(),
                'active_loans' => (clone $loans)->whereIn('status', ['borrowed', 'overdue'])->count(),
                'overdue' => (clone $loans)->whereIn('status', ['borrowed', 'overdue'])->whereDate('due_at', '<', $today)->count(),
            ],
            'clinic' => [
                'visits_today' => (clone $visits)->whereDate('visit_date', $today)->count(),
                'visits_week' => (clone $visits)->where('visit_date', '>=', $today->copy()->subDays(7))->count(),
                'low_stock' => (clone $medicines)->whereColumn('stock', '<=', 'min_stock')->count(),
                'medicines' => (clone $medicines)->count(),
            ],
            'cafeteria' => [
                'meals_today' => (int) (clone $mealLogs)->whereDate('meal_date', $today)->sum('students_served')
                    + (int) (clone $mealLogs)->whereDate('meal_date', $today)->sum('staff_served'),
                'menus_week' => (clone $menus)->whereBetween('menu_date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()])->count(),
                'low_stock' => (clone $inventory)->whereColumn('quantity', '<=', 'min_quantity')->count(),
                'inventory_items' => (clone $inventory)->count(),
            ],
        ];

        $schools = School::query()
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('id', $user->school_id))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'logo_color']);

        $schoolStudentCounts = Student::query()->visibleTo($user)
            ->selectRaw('school_id, count(*) as total')->groupBy('school_id')->pluck('total', 'school_id');
        $schoolEmployeeCounts = Employee::query()->visibleTo($user)
            ->selectRaw('school_id, count(*) as total')->groupBy('school_id')->pluck('total', 'school_id');
        $schoolBranchCounts = \App\Models\Branch::query()
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('school_id', $user->school_id))
            ->selectRaw('school_id, count(*) as total')->groupBy('school_id')->pluck('total', 'school_id');

        $schoolBreakdown = $schools->map(fn (School $school) => [
            'id' => $school->id,
            'name' => $school->name,
            'code' => $school->code,
            'color' => $school->logo_color,
            'branches' => (int) ($schoolBranchCounts[$school->id] ?? 0),
            'students' => (int) ($schoolStudentCounts[$school->id] ?? 0),
            'employees' => (int) ($schoolEmployeeCounts[$school->id] ?? 0),
        ])->values();

        $recentVisits = ClinicVisit::query()->visibleTo($user)
            ->with(['student:id,full_name', 'employee:id,full_name'])
            ->latest('visit_date')->limit(5)->get()
            ->map(fn (ClinicVisit $visit) => [
                'id' => $visit->id,
                'patient' => $visit->displayName(),
                'complaint' => $visit->complaint,
                'visit_date' => $visit->visit_date?->toIso8601String(),
                'disposition' => $visit->disposition,
            ]);

        $recentLoans = BookLoan::query()->visibleTo($user)
            ->with(['book:id,title', 'member:id,member_code,member_type,student_id,employee_id', 'member.student:id,full_name', 'member.employee:id,full_name'])
            ->latest('borrowed_at')->limit(5)->get()
            ->map(fn (BookLoan $loan) => [
                'id' => $loan->id,
                'book' => $loan->book?->title,
                'member' => $loan->member?->displayName(),
                'borrowed_at' => $loan->borrowed_at?->toDateString(),
                'due_at' => $loan->due_at?->toDateString(),
                'status' => $loan->status,
            ]);

        $lowStock = [
            'medicines' => Medicine::query()->visibleTo($user)
                ->with('school:id,name')
                ->whereColumn('stock', '<=', 'min_stock')
                ->orderBy('stock')->limit(30)->get(['id', 'school_id', 'name', 'stock', 'min_stock', 'unit'])
                ->map(fn (Medicine $m) => ['id' => $m->id, 'name' => $m->name, 'school' => $m->school?->name, 'stock' => $m->stock, 'min' => $m->min_stock, 'unit' => $m->unit])
                ->unique(fn (array $m) => $m['name'].'|'.$m['school'])
                ->take(5)->values(),
            'cafeteria' => CafeteriaInventoryItem::query()->visibleTo($user)
                ->with('school:id,name')
                ->whereColumn('quantity', '<=', 'min_quantity')
                ->orderBy('quantity')->limit(30)->get(['id', 'school_id', 'name', 'quantity', 'min_quantity', 'unit'])
                ->map(fn (CafeteriaInventoryItem $i) => ['id' => $i->id, 'name' => $i->name, 'school' => $i->school?->name, 'stock' => (float) $i->quantity, 'min' => (float) $i->min_quantity, 'unit' => $i->unit])
                ->unique(fn (array $i) => $i['name'].'|'.$i['school'])
                ->take(5)->values(),
        ];

        $upcomingMenus = CafeteriaMenu::query()->visibleTo($user)
            ->with(['items:id,cafeteria_menu_id,name,category', 'school:id,name'])
            ->whereDate('menu_date', '>=', $today)
            ->orderBy('menu_date')->limit(3)->get()
            ->map(fn (CafeteriaMenu $menu) => [
                'id' => $menu->id,
                'title' => $menu->title,
                'school' => $menu->school?->name,
                'date' => $menu->menu_date?->toDateString(),
                'meal_type' => $menu->meal_type,
                'items' => $menu->items->pluck('name'),
            ]);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'schoolBreakdown' => $schoolBreakdown,
            'employeesByType' => [
                ['label' => 'Teachers', 'value' => $stats['employees']['teachers'], 'color' => 'indigo'],
                ['label' => 'Staff', 'value' => $stats['employees']['staff'], 'color' => 'sky'],
                ['label' => 'General employees', 'value' => $stats['employees']['general'], 'color' => 'amber'],
            ],
            'studentGender' => [
                ['label' => 'Male', 'value' => $stats['students']['male']],
                ['label' => 'Female', 'value' => $stats['students']['female']],
            ],
            'recentVisits' => $recentVisits,
            'recentLoans' => $recentLoans,
            'lowStock' => $lowStock,
            'upcomingMenus' => $upcomingMenus,
            'today' => $today->toDateString(),
            'greeting' => $this->greeting(),
        ]);
    }

    protected function greeting(): string
    {
        $hour = (int) now()->format('H');

        return match (true) {
            $hour < 11 => 'Good morning',
            $hour < 15 => 'Good afternoon',
            $hour < 18 => 'Good evening',
            default => 'Good evening',
        };
    }
}

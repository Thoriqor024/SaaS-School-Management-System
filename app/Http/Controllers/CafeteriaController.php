<?php

namespace App\Http\Controllers;

use App\Models\CafeteriaInventoryItem;
use App\Models\CafeteriaMenu;
use App\Models\MealLog;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CafeteriaController extends Controller
{
    public function menus(Request $request): Response
    {
        $user = $request->user();

        $menus = CafeteriaMenu::query()
            ->visibleTo($user)
            ->with(['items:id,cafeteria_menu_id,name,category,calories,allergens', 'branch:id,name'])
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('meal_type'), fn ($q, $v) => $q->where('meal_type', $v))
            ->when($request->input('from'), fn ($q, $v) => $q->whereDate('menu_date', '>=', $v))
            ->orderByDesc('menu_date')
            ->get()
            ->map(fn (CafeteriaMenu $menu) => [
                ...$menu->only(['id', 'school_id', 'branch_id', 'title', 'menu_date', 'meal_type', 'description', 'is_published']),
                'menu_date' => $menu->menu_date?->toDateString(),
                'branch' => $menu->branch?->name,
                'items' => $menu->items,
            ]);

        $base = CafeteriaMenu::query()->visibleTo($user);

        return Inertia::render('Cafeteria/Menus', [
            'menus' => $menus,
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['school_id', 'meal_type', 'from']),
            'mealTypes' => ['breakfast', 'lunch', 'snack', 'dinner'],
            'counts' => [
                'total' => (clone $base)->count(),
                'this_week' => (clone $base)->whereBetween('menu_date', [Carbon::today()->startOfWeek(), Carbon::today()->endOfWeek()])->count(),
                'published' => (clone $base)->where('is_published', true)->count(),
                'items' => \App\Models\MenuItem::query()->whereHas('menu', fn ($q) => $q->visibleTo($user))->count(),
            ],
        ]);
    }

    public function storeMenu(Request $request): RedirectResponse
    {
        $data = $this->validateMenu($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $items = $data['items'] ?? [];
        unset($data['items']);

        DB::transaction(function () use ($data, $items, $request) {
            $menu = CafeteriaMenu::create([...$data, 'created_by' => $request->user()->id]);
            foreach ($items as $item) {
                $menu->items()->create($item);
            }
        });

        return back()->with('success', 'Menu was added to the meal planner.');
    }

    public function updateMenu(Request $request, CafeteriaMenu $menu): RedirectResponse
    {
        $data = $this->validateMenu($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $items = $data['items'] ?? [];
        unset($data['items']);

        DB::transaction(function () use ($menu, $data, $items) {
            $menu->update($data);
            $menu->items()->delete();
            foreach ($items as $item) {
                $menu->items()->create($item);
            }
        });

        return back()->with('success', 'Menu was updated.');
    }

    public function destroyMenu(Request $request, CafeteriaMenu $menu): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $menu->school_id === $request->user()->school_id, 403);

        $menu->delete();

        return back()->with('success', 'Menu was deleted.');
    }

    public function inventory(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $items = CafeteriaInventoryItem::query()
            ->visibleTo($user)
            ->with('branch:id,name')
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->input('category'), fn ($q, $v) => $q->where('category', $v))
            ->when($request->input('low_stock'), fn ($q) => $q->whereColumn('quantity', '<=', 'min_quantity'))
            ->orderBy('name')
            ->get()
            ->map(fn (CafeteriaInventoryItem $item) => [
                ...$item->only(['id', 'school_id', 'branch_id', 'name', 'category', 'unit', 'quantity', 'min_quantity', 'supplier', 'expiry_date', 'last_restocked_at', 'notes']),
                'quantity' => (float) $item->quantity,
                'min_quantity' => (float) $item->min_quantity,
                'branch' => $item->branch?->name,
                'is_low_stock' => $item->isLowStock(),
            ]);

        $base = CafeteriaInventoryItem::query()->visibleTo($user);

        return Inertia::render('Cafeteria/Inventory', [
            'items' => $items,
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['search', 'category', 'low_stock']),
            'categories' => ['dry_goods', 'fresh', 'beverage', 'utensil', 'other'],
            'counts' => [
                'total' => (clone $base)->count(),
                'low_stock' => (clone $base)->whereColumn('quantity', '<=', 'min_quantity')->count(),
                'expiring' => (clone $base)->whereNotNull('expiry_date')->whereDate('expiry_date', '<=', Carbon::today()->addDays(14))->count(),
            ],
        ]);
    }

    public function storeInventory(Request $request): RedirectResponse
    {
        $data = $this->validateInventory($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        CafeteriaInventoryItem::create($data);

        return back()->with('success', 'Inventory item was added.');
    }

    public function updateInventory(Request $request, CafeteriaInventoryItem $item): RedirectResponse
    {
        $data = $this->validateInventory($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $item->update($data);

        return back()->with('success', $item->name.' was updated.');
    }

    public function restockInventory(Request $request, CafeteriaInventoryItem $item): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'numeric', 'min:0.01', 'max:100000'],
        ]);

        $item->increment('quantity', $data['quantity']);
        $item->update(['last_restocked_at' => Carbon::today()]);

        return back()->with('success', $data['quantity'].' '.$item->unit.' was added to '.$item->name.'.');
    }

    public function destroyInventory(Request $request, CafeteriaInventoryItem $item): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $item->school_id === $request->user()->school_id, 403);

        $item->delete();

        return back()->with('success', 'Inventory item was deleted.');
    }

    public function mealLogs(Request $request): Response
    {
        $user = $request->user();

        $logs = MealLog::query()
            ->visibleTo($user)
            ->with(['menu:id,title', 'branch:id,name'])
            ->when($request->input('from'), fn ($q, $v) => $q->whereDate('meal_date', '>=', $v))
            ->when($request->input('meal_type'), fn ($q, $v) => $q->where('meal_type', $v))
            ->orderByDesc('meal_date')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (MealLog $log) => [
                'id' => $log->id,
                'meal_date' => $log->meal_date?->toDateString(),
                'meal_type' => $log->meal_type,
                'menu' => $log->menu?->title,
                'menu_id' => $log->cafeteria_menu_id,
                'branch' => $log->branch?->name,
                'students_served' => $log->students_served,
                'staff_served' => $log->staff_served,
                'guests_served' => $log->guests_served,
                'total_served' => $log->totalServed(),
                'notes' => $log->notes,
            ]);

        $base = MealLog::query()->visibleTo($user);
        $todayBase = (clone $base)->whereDate('meal_date', Carbon::today());

        $last7 = collect(range(6, 0))->map(function (int $daysAgo) use ($base) {
            $day = Carbon::today()->subDays($daysAgo);

            return [
                'date' => $day->toDateString(),
                'label' => $day->format('D'),
                'students' => (int) (clone $base)->whereDate('meal_date', $day)->sum('students_served'),
                'staff' => (int) (clone $base)->whereDate('meal_date', $day)->sum('staff_served'),
            ];
        });

        return Inertia::render('Cafeteria/MealLogs', [
            'logs' => $logs,
            'menus' => CafeteriaMenu::query()->visibleTo($user)->orderByDesc('menu_date')->limit(60)->get(['id', 'title', 'menu_date', 'meal_type']),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['from', 'meal_type']),
            'mealTypes' => ['breakfast', 'lunch', 'snack', 'dinner'],
            'counts' => [
                'students_today' => (int) (clone $todayBase)->sum('students_served'),
                'staff_today' => (int) (clone $todayBase)->sum('staff_served'),
                'week_total' => (int) (clone $base)->where('meal_date', '>=', Carbon::today()->subDays(7))
                    ->selectRaw('coalesce(sum(students_served + staff_served + guests_served), 0) as total')->value('total'),
                'logs' => (clone $base)->count(),
            ],
            'last7' => $last7,
        ]);
    }

    public function storeMealLog(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'cafeteria_menu_id' => ['nullable', 'uuid', 'exists:cafeteria_menus,id'],
            'meal_date' => ['required', 'date'],
            'meal_type' => ['required', Rule::in(['breakfast', 'lunch', 'snack', 'dinner'])],
            'students_served' => ['required', 'integer', 'min:0', 'max:100000'],
            'staff_served' => ['required', 'integer', 'min:0', 'max:100000'],
            'guests_served' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        MealLog::create([...$data, 'guests_served' => $data['guests_served'] ?? 0, 'recorded_by' => $request->user()->id]);

        return back()->with('success', 'Daily meal log was recorded.');
    }

    public function updateMealLog(Request $request, MealLog $log): RedirectResponse
    {
        $data = $request->validate([
            'cafeteria_menu_id' => ['nullable', 'uuid', 'exists:cafeteria_menus,id'],
            'meal_date' => ['required', 'date'],
            'meal_type' => ['required', Rule::in(['breakfast', 'lunch', 'snack', 'dinner'])],
            'students_served' => ['required', 'integer', 'min:0', 'max:100000'],
            'staff_served' => ['required', 'integer', 'min:0', 'max:100000'],
            'guests_served' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $log->school_id);

        $log->update([...$data, 'guests_served' => $data['guests_served'] ?? 0]);

        return back()->with('success', 'Meal log was updated.');
    }

    public function destroyMealLog(Request $request, MealLog $log): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $log->school_id === $request->user()->school_id, 403);

        $log->delete();

        return back()->with('success', 'Meal log was deleted.');
    }

    protected function validateMenu(Request $request): array
    {
        return $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'title' => ['required', 'string', 'max:120'],
            'menu_date' => ['required', 'date'],
            'meal_type' => ['required', Rule::in(['breakfast', 'lunch', 'snack', 'dinner'])],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_published' => ['boolean'],
            'items' => ['array', 'max:20'],
            'items.*.name' => ['required', 'string', 'max:120'],
            'items.*.category' => ['required', Rule::in(['main', 'side', 'fruit', 'drink', 'dessert'])],
            'items.*.calories' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'items.*.allergens' => ['nullable', 'string', 'max:255'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ]);
    }

    protected function validateInventory(Request $request): array
    {
        return $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::in(['dry_goods', 'fresh', 'beverage', 'utensil', 'other'])],
            'unit' => ['required', 'string', 'max:24'],
            'quantity' => ['required', 'numeric', 'min:0', 'max:100000'],
            'min_quantity' => ['required', 'numeric', 'min:0', 'max:100000'],
            'supplier' => ['nullable', 'string', 'max:120'],
            'expiry_date' => ['nullable', 'date'],
            'last_restocked_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
    }
}

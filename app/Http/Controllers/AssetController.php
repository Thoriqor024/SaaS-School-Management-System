<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Student;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $assets = Asset::query()
            ->visibleTo($user)
            ->with(['school:id,name', 'branch:id,name', 'category:id,name', 'assignedTo:id,full_name'])
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$search}%")
                ->orWhere('asset_code', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%")))
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('asset_category_id'), fn ($q, $v) => $q->where('asset_category_id', $v))
            ->when($request->input('condition'), fn ($q, $v) => $q->where('condition', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->input('type'), fn ($q, $v) => $q->where('type', $v))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $base = Asset::query()->visibleTo($user);

        return Inertia::render('Assets/Index', [
            'assets' => $assets,
            'categories' => AssetCategory::orderBy('name')->get(['id', 'name', 'code', 'kind']),
            'schools' => OptionLists::schools($user),
            'filters' => $request->only(['search', 'school_id', 'asset_category_id', 'condition', 'status', 'type']),
            'conditions' => ['good', 'minor_damage', 'major_damage', 'broken'],
            'statuses' => ['in_use', 'in_storage', 'maintenance', 'retired'],
            'counts' => [
                'items' => (clone $base)->count(),
                'units' => (int) (clone $base)->sum('quantity'),
                'good' => (clone $base)->where('condition', 'good')->count(),
                'damaged' => (clone $base)->whereIn('condition', ['minor_damage', 'major_damage', 'broken'])->count(),
                'maintenance' => (clone $base)->where('status', 'maintenance')->count(),
            ],
            'byCategory' => AssetCategory::query()
                ->withCount(['assets' => fn ($q) => $q->visibleTo($user)])
                ->orderBy('name')->get()
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'count' => $category->assets_count,
                    'units' => (int) Asset::query()->visibleTo($user)->where('asset_category_id', $category->id)->sum('quantity'),
                ]),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Assets/Form', [
            'asset' => null,
            ...$this->formOptions($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $asset = Asset::create($data);

        return redirect()->route('assets.index')->with('success', $asset->name.' was added to the inventory.');
    }

    public function edit(Request $request, Asset $asset): Response
    {
        abort_unless($this->canSee($request, $asset), 403);

        return Inertia::render('Assets/Form', [
            'asset' => $asset,
            ...$this->formOptions($request),
        ]);
    }

    public function update(Request $request, Asset $asset): RedirectResponse
    {
        abort_unless($this->canSee($request, $asset), 403);

        $data = $this->validated($request, $asset);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $asset->update($data);

        return redirect()->route('assets.index')->with('success', $asset->name.' was updated.');
    }

    public function destroy(Request $request, Asset $asset): RedirectResponse
    {
        abort_unless($this->canSee($request, $asset), 403);

        $asset->delete();

        return redirect()->route('assets.index')->with('success', 'Asset was removed from the inventory.');
    }

    public function categories(Request $request): Response
    {
        $user = $request->user();

        $categories = AssetCategory::query()
            ->withCount('assets')
            ->orderBy('name')
            ->get()
            ->map(fn (AssetCategory $category) => [
                ...$category->only(['id', 'name', 'code', 'kind', 'description']),
                'assets_count' => $category->assets_count,
            ]);

        return Inertia::render('Assets/Categories', [
            'categories' => $categories,
            'canManage' => $user->hasPermission('assets.manage'),
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'code' => ['required', 'string', 'max:32', 'unique:asset_categories,code'],
            'kind' => ['required', Rule::in(['fixed', 'consumable'])],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        AssetCategory::create($data);

        return back()->with('success', 'Asset category was created.');
    }

    public function updateCategory(Request $request, AssetCategory $category): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'code' => ['required', 'string', 'max:32', Rule::unique('asset_categories', 'code')->ignore($category->id)],
            'kind' => ['required', Rule::in(['fixed', 'consumable'])],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $category->update($data);

        return back()->with('success', 'Asset category was updated.');
    }

    public function destroyCategory(AssetCategory $category): RedirectResponse
    {
        if ($category->assets()->exists()) {
            return back()->with('error', 'Reassign this category\'s assets before deleting it.');
        }

        $category->delete();

        return back()->with('success', 'Asset category was deleted.');
    }

    protected function canSee(Request $request, Asset $asset): bool
    {
        $user = $request->user();

        return $user->isSuperAdmin() || ! $user->school_id || $asset->school_id === $user->school_id;
    }

    protected function formOptions(Request $request): array
    {
        $user = $request->user();

        return [
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'categories' => AssetCategory::orderBy('name')->get(['id', 'name', 'kind']),
            'employees' => OptionLists::employees($user),
            'conditions' => ['good', 'minor_damage', 'major_damage', 'broken'],
            'statuses' => ['in_use', 'in_storage', 'maintenance', 'retired'],
        ];
    }

    protected function validated(Request $request, ?Asset $asset = null): array
    {
        return $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'asset_category_id' => ['nullable', 'uuid', 'exists:asset_categories,id'],
            'asset_code' => ['required', 'string', 'max:48', Rule::unique('assets', 'asset_code')->ignore($asset?->id)],
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(['fixed', 'consumable'])],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'unit' => ['required', 'string', 'max:24'],
            'condition' => ['required', Rule::in(['good', 'minor_damage', 'major_damage', 'broken'])],
            'status' => ['required', Rule::in(['in_use', 'in_storage', 'maintenance', 'retired'])],
            'location' => ['nullable', 'string', 'max:120'],
            'assigned_to_employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'warranty_until' => ['nullable', 'date'],
            'last_checked_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}

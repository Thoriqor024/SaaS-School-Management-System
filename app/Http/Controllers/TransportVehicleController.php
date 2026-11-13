<?php

namespace App\Http\Controllers;

use App\Models\TransportVehicle;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransportVehicleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $vehicles = TransportVehicle::query()
            ->visibleTo($user)
            ->with(['branch:id,name', 'school:id,name', 'driver:id,full_name'])
            ->withCount('routes')
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('plate_number', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%")))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->orderBy('plate_number')
            ->get()
            ->map(fn (TransportVehicle $vehicle) => [
                ...$vehicle->only(['id', 'school_id', 'branch_id', 'plate_number', 'brand', 'model', 'type', 'capacity', 'year', 'condition', 'status', 'driver_employee_id', 'attendant_name', 'tax_expiry', 'insurance_expiry', 'notes']),
                'branch' => $vehicle->branch?->name,
                'school' => $vehicle->school?->name,
                'driver' => $vehicle->driver?->full_name,
                'routes_count' => $vehicle->routes_count,
            ]);

        $base = TransportVehicle::query()->visibleTo($user);

        return Inertia::render('Transport/Vehicles', [
            'vehicles' => $vehicles,
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'drivers' => OptionLists::employees($user),
            'filters' => $request->only(['search', 'status']),
            'counts' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
                'maintenance' => (clone $base)->where('status', 'maintenance')->count(),
                'capacity' => (int) (clone $base)->sum('capacity'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'plate_number' => ['required', 'string', 'max:24', 'unique:transport_vehicles,plate_number'],
            'brand' => ['nullable', 'string', 'max:60'],
            'model' => ['nullable', 'string', 'max:60'],
            'type' => ['required', Rule::in(['bus', 'minibus', 'van', 'car'])],
            'capacity' => ['required', 'integer', 'min:1', 'max:120'],
            'year' => ['nullable', 'integer', 'min:1980', 'max:2100'],
            'condition' => ['required', Rule::in(['good', 'minor_damage', 'major_damage', 'broken'])],
            'status' => ['required', Rule::in(['active', 'maintenance', 'inactive'])],
            'driver_employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'attendant_name' => ['nullable', 'string', 'max:120'],
            'tax_expiry' => ['nullable', 'date'],
            'insurance_expiry' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        TransportVehicle::create($data);

        return back()->with('success', 'Vehicle '.$data['plate_number'].' was added to the fleet.');
    }

    public function update(Request $request, TransportVehicle $vehicle): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'plate_number' => ['required', 'string', 'max:24', Rule::unique('transport_vehicles', 'plate_number')->ignore($vehicle->id)],
            'brand' => ['nullable', 'string', 'max:60'],
            'model' => ['nullable', 'string', 'max:60'],
            'type' => ['required', Rule::in(['bus', 'minibus', 'van', 'car'])],
            'capacity' => ['required', 'integer', 'min:1', 'max:120'],
            'year' => ['nullable', 'integer', 'min:1980', 'max:2100'],
            'condition' => ['required', Rule::in(['good', 'minor_damage', 'major_damage', 'broken'])],
            'status' => ['required', Rule::in(['active', 'maintenance', 'inactive'])],
            'driver_employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'attendant_name' => ['nullable', 'string', 'max:120'],
            'tax_expiry' => ['nullable', 'date'],
            'insurance_expiry' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        $vehicle->update($data);

        return back()->with('success', 'Vehicle '.$vehicle->plate_number.' was updated.');
    }

    public function destroy(Request $request, TransportVehicle $vehicle): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $vehicle->school_id === $request->user()->school_id, 403);

        $vehicle->delete();

        return back()->with('success', 'Vehicle was removed from the fleet.');
    }
}

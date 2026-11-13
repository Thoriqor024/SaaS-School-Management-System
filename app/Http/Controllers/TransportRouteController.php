<?php

namespace App\Http\Controllers;

use App\Models\TransportRoute;
use App\Models\TransportVehicle;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransportRouteController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $routes = TransportRoute::query()
            ->visibleTo($user)
            ->with(['vehicle:id,plate_number,capacity', 'driver:id,full_name', 'branch:id,name', 'stops'])
            ->withCount(['passengers' => fn ($q) => $q->where('is_active', true)])
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('is_active') !== null && $request->input('is_active') !== '', fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->get()
            ->map(fn (TransportRoute $route) => [
                'id' => $route->id,
                'school_id' => $route->school_id,
                'code' => $route->code,
                'name' => $route->name,
                'start_point' => $route->start_point,
                'end_point' => $route->end_point,
                'departure_time' => $route->departure_time,
                'return_time' => $route->return_time,
                'distance_km' => $route->distance_km !== null ? (float) $route->distance_km : null,
                'is_active' => $route->is_active,
                'branch' => $route->branch?->name,
                'vehicle' => $route->vehicle?->plate_number,
                'capacity' => $route->vehicle?->capacity,
                'driver' => $route->driver?->full_name,
                'passengers_count' => $route->passengers_count,
                'stops' => $route->stops->map(fn ($stop) => [
                    'id' => $stop->id,
                    'name' => $stop->name,
                    'sequence' => $stop->sequence,
                    'pickup_time' => $stop->pickup_time,
                ]),
            ]);

        $base = TransportRoute::query()->visibleTo($user);

        return Inertia::render('Transport/Routes', [
            'routes' => $routes,
            'schools' => OptionLists::schools($user),
            'filters' => $request->only(['search', 'school_id', 'is_active']),
            'counts' => [
                'routes' => (clone $base)->count(),
                'active' => (clone $base)->where('is_active', true)->count(),
                'passengers' => \App\Models\TransportPassenger::query()
                    ->whereHas('route', fn ($q) => $q->visibleTo($user))->where('is_active', true)->count(),
                'stops' => \App\Models\RouteStop::query()
                    ->whereHas('route', fn ($q) => $q->visibleTo($user))->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Transport/RouteForm', [
            'route' => null,
            ...$this->formOptions($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $stops = $data['stops'] ?? [];
        unset($data['stops']);

        $route = DB::transaction(function () use ($data, $stops) {
            $route = TransportRoute::create($data);
            foreach ($stops as $index => $stop) {
                $route->stops()->create([...$stop, 'sequence' => $stop['sequence'] ?? $index + 1]);
            }

            return $route;
        });

        return redirect()->route('transport.routes.index')->with('success', 'Route '.$route->name.' was created with '.count($stops).' stops.');
    }

    public function edit(Request $request, TransportRoute $route): Response
    {
        abort_unless($this->canSee($request, $route), 403);

        return Inertia::render('Transport/RouteForm', [
            'route' => [
                ...$route->only(['id', 'school_id', 'branch_id', 'transport_vehicle_id', 'driver_employee_id', 'code', 'name', 'start_point', 'end_point', 'departure_time', 'return_time', 'distance_km', 'is_active', 'notes']),
                'stops' => $route->stops()->orderBy('sequence')->get(),
            ],
            ...$this->formOptions($request),
        ]);
    }

    public function update(Request $request, TransportRoute $route): RedirectResponse
    {
        abort_unless($this->canSee($request, $route), 403);

        $data = $this->validated($request, $route);
        $stops = $data['stops'] ?? [];
        unset($data['stops']);

        DB::transaction(function () use ($route, $data, $stops) {
            $route->update($data);
            $route->stops()->delete();
            foreach ($stops as $index => $stop) {
                $route->stops()->create([...$stop, 'sequence' => $stop['sequence'] ?? $index + 1]);
            }
        });

        return redirect()->route('transport.routes.index')->with('success', $route->name.' was updated.');
    }

    public function destroy(Request $request, TransportRoute $route): RedirectResponse
    {
        abort_unless($this->canSee($request, $route), 403);

        $route->delete();

        return redirect()->route('transport.routes.index')->with('success', 'Route was deleted.');
    }

    protected function canSee(Request $request, TransportRoute $route): bool
    {
        $user = $request->user();

        return $user->isSuperAdmin() || ! $user->school_id || $route->school_id === $user->school_id;
    }

    protected function formOptions(Request $request): array
    {
        $user = $request->user();

        return [
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'vehicles' => TransportVehicle::query()->visibleTo($user)->orderBy('plate_number')->get(['id', 'school_id', 'plate_number', 'capacity']),
            'drivers' => OptionLists::employees($user),
        ];
    }

    protected function validated(Request $request, ?TransportRoute $route = null): array
    {
        return $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'transport_vehicle_id' => ['nullable', 'uuid', 'exists:transport_vehicles,id'],
            'driver_employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'code' => ['required', 'string', 'max:32', Rule::unique('transport_routes', 'code')->where('school_id', $request->input('school_id'))->ignore($route?->id)],
            'name' => ['required', 'string', 'max:120'],
            'start_point' => ['nullable', 'string', 'max:120'],
            'end_point' => ['nullable', 'string', 'max:120'],
            'departure_time' => ['nullable', 'string', 'max:8'],
            'return_time' => ['nullable', 'string', 'max:8'],
            'distance_km' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'stops' => ['array', 'max:30'],
            'stops.*.name' => ['required', 'string', 'max:120'],
            'stops.*.address' => ['nullable', 'string', 'max:255'],
            'stops.*.sequence' => ['nullable', 'integer', 'min:1', 'max:60'],
            'stops.*.pickup_time' => ['nullable', 'string', 'max:8'],
            'stops.*.dropoff_time' => ['nullable', 'string', 'max:8'],
            'stops.*.latitude' => ['nullable', 'numeric'],
            'stops.*.longitude' => ['nullable', 'numeric'],
        ]);
    }
}

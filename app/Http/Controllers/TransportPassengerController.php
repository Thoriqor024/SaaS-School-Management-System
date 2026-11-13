<?php

namespace App\Http\Controllers;

use App\Models\PassengerLog;
use App\Models\Student;
use App\Models\TransportPassenger;
use App\Models\TransportRoute;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TransportPassengerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $passengers = TransportPassenger::query()
            ->whereHas('student', fn ($q) => $q->visibleTo($user))
            ->with(['student:id,full_name,nisn,grade_level,classroom,school_id', 'route:id,code,name,transport_vehicle_id', 'route.vehicle:id,plate_number,capacity', 'stop:id,name,pickup_time'])
            ->when($search !== '', fn ($q) => $q->whereHas('student', fn ($inner) => $inner->where('full_name', 'like', "%{$search}%")))
            ->when($request->input('transport_route_id'), fn ($q, $v) => $q->where('transport_route_id', $v))
            ->when($request->input('is_active') !== null && $request->input('is_active') !== '', fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (TransportPassenger $passenger) => [
                'id' => $passenger->id,
                'student' => $passenger->student?->full_name,
                'student_nisn' => $passenger->student?->nisn,
                'grade_level' => $passenger->student?->grade_level,
                'classroom' => $passenger->student?->classroom,
                'route' => $passenger->route?->name,
                'route_code' => $passenger->route?->code,
                'plate_number' => $passenger->route?->vehicle?->plate_number,
                'stop' => $passenger->stop?->name,
                'pickup_time' => $passenger->stop?->pickup_time,
                'direction' => $passenger->direction,
                'start_date' => $passenger->start_date?->toDateString(),
                'is_active' => $passenger->is_active,
            ]);

        return Inertia::render('Transport/Passengers', [
            'passengers' => $passengers,
            'routes' => TransportRoute::query()->visibleTo($user)->with('stops:id,transport_route_id,name,pickup_time,sequence')->orderBy('name')->get(['id', 'code', 'name', 'school_id', 'transport_vehicle_id']),
            'students' => OptionLists::students($user),
            'filters' => $request->only(['search', 'transport_route_id', 'is_active']),
            'counts' => [
                'assignments' => TransportPassenger::query()->whereHas('route', fn ($q) => $q->visibleTo($user))->count(),
                'active' => TransportPassenger::query()->whereHas('route', fn ($q) => $q->visibleTo($user))->where('is_active', true)->count(),
                'routes_in_use' => TransportPassenger::query()->whereHas('route', fn ($q) => $q->visibleTo($user))->where('is_active', true)->distinct()->count('transport_route_id'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'transport_route_id' => ['required', 'uuid', 'exists:transport_routes,id'],
            'route_stop_id' => ['nullable', 'uuid', 'exists:route_stops,id'],
            'direction' => ['required', 'in:both,pickup,dropoff'],
            'start_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $route = TransportRoute::findOrFail($data['transport_route_id']);
        $this->ensureRecordScope($request, $route->school_id);

        if (TransportPassenger::where('student_id', $data['student_id'])->where('transport_route_id', $data['transport_route_id'])->exists()) {
            return back()->with('error', 'This student is already assigned to that route.');
        }

        TransportPassenger::create($data);

        return back()->with('success', 'Student was assigned to the route.');
    }

    public function update(Request $request, TransportPassenger $passenger): RedirectResponse
    {
        $data = $request->validate([
            'route_stop_id' => ['nullable', 'uuid', 'exists:route_stops,id'],
            'direction' => ['required', 'in:both,pickup,dropoff'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $passenger->route?->school_id);

        $passenger->update($data);

        return back()->with('success', 'Passenger assignment was updated.');
    }

    public function destroy(Request $request, TransportPassenger $passenger): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $passenger->route?->school_id === $request->user()->school_id, 403);

        $passenger->delete();

        return back()->with('success', 'Student was removed from the route.');
    }

    public function logs(Request $request): Response
    {
        $user = $request->user();
        $date = $request->input('date') ?: Carbon::today()->toDateString();

        $logs = PassengerLog::query()
            ->visibleTo($user)
            ->with(['student:id,full_name,classroom', 'route:id,code,name,transport_vehicle_id', 'route.vehicle:id,plate_number'])
            ->when($request->input('transport_route_id'), fn ($q, $v) => $q->where('transport_route_id', $v))
            ->whereDate('log_date', $date)
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (PassengerLog $log) => [
                'id' => $log->id,
                'student' => $log->student?->full_name,
                'classroom' => $log->student?->classroom,
                'route' => $log->route?->name,
                'route_code' => $log->route?->code,
                'plate_number' => $log->route?->vehicle?->plate_number,
                'direction' => $log->direction,
                'status' => $log->status,
                'log_date' => $log->log_date?->toDateString(),
                'notes' => $log->notes,
            ]);

        $routes = TransportRoute::query()->visibleTo($user)->orderBy('name')->get(['id', 'code', 'name']);

        $todayBase = PassengerLog::query()->visibleTo($user)->whereDate('log_date', $date);

        return Inertia::render('Transport/Logs', [
            'logs' => $logs,
            'routes' => $routes,
            'students' => OptionLists::students($user),
            'filters' => [
                'date' => $date,
                'transport_route_id' => $request->input('transport_route_id'),
            ],
            'counts' => [
                'entries' => (clone $todayBase)->count(),
                'picked_up' => (clone $todayBase)->where('status', 'picked_up')->count(),
                'dropped_off' => (clone $todayBase)->where('status', 'dropped_off')->count(),
                'absent' => (clone $todayBase)->where('status', 'absent')->count(),
            ],
        ]);
    }

    public function storeLog(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'transport_route_id' => ['required', 'uuid', 'exists:transport_routes,id'],
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'log_date' => ['required', 'date'],
            'direction' => ['required', 'in:pickup,dropoff'],
            'status' => ['required', 'in:picked_up,dropped_off,absent,late'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $route = TransportRoute::findOrFail($data['transport_route_id']);
        $this->ensureRecordScope($request, $route->school_id);

        PassengerLog::create([
            ...$data,
            'school_id' => $route->school_id,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Passenger log was recorded.');
    }

    public function destroyLog(Request $request, PassengerLog $log): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $log->school_id === $request->user()->school_id, 403);

        $log->delete();

        return back()->with('success', 'Passenger log entry was deleted.');
    }
}

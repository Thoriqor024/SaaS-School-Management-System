import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, GripVertical, Loader2, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../Components/ui';

export default function RouteForm({ route, schools, branches, vehicles, drivers }) {
    const isEdit = Boolean(route);

    const { data, setData, post, put, processing, errors } = useForm({
        school_id: route?.school_id ?? schools[0]?.id ?? '',
        branch_id: route?.branch_id ?? '',
        transport_vehicle_id: route?.transport_vehicle_id ?? '',
        driver_employee_id: route?.driver_employee_id ?? '',
        code: route?.code ?? '',
        name: route?.name ?? '',
        start_point: route?.start_point ?? '',
        end_point: route?.end_point ?? '',
        departure_time: route?.departure_time ?? '06:30',
        return_time: route?.return_time ?? '15:30',
        distance_km: route?.distance_km ?? '',
        is_active: route?.is_active ?? true,
        notes: route?.notes ?? '',
        stops: (route?.stops ?? []).map((stop, index) => ({
            name: stop.name ?? '',
            address: stop.address ?? '',
            sequence: stop.sequence ?? index + 1,
            pickup_time: stop.pickup_time ?? '',
            dropoff_time: stop.dropoff_time ?? '',
        })),
    });

    const visibleBranches = useMemo(() => branches.filter((branch) => branch.school_id === data.school_id), [branches, data.school_id]);
    const visibleVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.school_id === data.school_id), [vehicles, data.school_id]);

    const setStop = (index, key, value) => {
        const stops = [...data.stops];
        stops[index] = { ...stops[index], [key]: value };
        setData('stops', stops);
    };

    const addStop = () => {
        setData('stops', [
            ...data.stops,
            { name: '', address: '', sequence: data.stops.length + 1, pickup_time: '', dropoff_time: '' },
        ]);
    };

    const removeStop = (index) => {
        setData(
            'stops',
            data.stops.filter((_, i) => i !== index).map((stop, i) => ({ ...stop, sequence: i + 1 }))
        );
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/transport/routes/${route.id}`);
        else post('/transport/routes');
    };

    return (
        <AppLayout title={isEdit ? 'Edit route' : 'Add route'}>
            <PageHeader
                title={isEdit ? `Edit ${route.name}` : 'Create a transport route'}
                description="Define the vehicle, driver and ordered stops. Students are assigned to stops on the Passengers page."
            >
                <Link href="/transport/routes" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
            </PageHeader>

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader title="Route details" />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Route name" required error={errors.name} className="sm:col-span-2">
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        </Field>
                        <Field label="Code" required error={errors.code}>
                            <Input value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} placeholder="NGS-R4" required />
                        </Field>
                        <Field label="School" required error={errors.school_id}>
                            <Select
                                value={data.school_id}
                                onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '', transport_vehicle_id: '' }))}
                            >
                                {schools.map((school) => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Branch" error={errors.branch_id}>
                            <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                                <option value="">No specific branch</option>
                                {visibleBranches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Vehicle" error={errors.transport_vehicle_id}>
                            <Select value={data.transport_vehicle_id} onChange={(e) => setData('transport_vehicle_id', e.target.value)}>
                                <option value="">Not assigned</option>
                                {visibleVehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plate_number} · {vehicle.capacity} seats
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Driver" error={errors.driver_employee_id}>
                            <Select value={data.driver_employee_id} onChange={(e) => setData('driver_employee_id', e.target.value)}>
                                <option value="">Not assigned</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Start point" error={errors.start_point}>
                            <Input value={data.start_point} onChange={(e) => setData('start_point', e.target.value)} />
                        </Field>
                        <Field label="End point" error={errors.end_point}>
                            <Input value={data.end_point} onChange={(e) => setData('end_point', e.target.value)} />
                        </Field>
                        <Field label="Departure time" error={errors.departure_time}>
                            <Input type="time" value={data.departure_time} onChange={(e) => setData('departure_time', e.target.value)} />
                        </Field>
                        <Field label="Return time" error={errors.return_time}>
                            <Input type="time" value={data.return_time} onChange={(e) => setData('return_time', e.target.value)} />
                        </Field>
                        <Field label="Distance (km)" error={errors.distance_km}>
                            <Input type="number" step="0.1" value={data.distance_km} onChange={(e) => setData('distance_km', e.target.value)} />
                        </Field>
                        <Field label="Status" error={errors.is_active}>
                            <Select value={data.is_active ? '1' : '0'} onChange={(e) => setData('is_active', e.target.value === '1')}>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </Select>
                        </Field>
                        <Field label="Notes" error={errors.notes} className="sm:col-span-2 lg:col-span-3">
                            <Textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader
                        title="Stops"
                        description="Ordered pickup and drop-off points. Numbers are saved as the stop sequence."
                        action={
                            <button type="button" onClick={addStop} className="btn-secondary btn-sm">
                                <Plus className="h-3.5 w-3.5" /> Add stop
                            </button>
                        }
                    />
                    <div className="space-y-3 p-4 sm:p-5">
                        {data.stops.length === 0 && (
                            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">
                                No stops yet. Add at least one stop so students can be assigned.
                            </p>
                        )}

                        {data.stops.map((stop, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                        <GripVertical className="h-3.5 w-3.5 text-slate-300" /> Stop {index + 1}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => removeStop(index)}
                                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        title="Remove stop"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <Input
                                        value={stop.name}
                                        onChange={(e) => setStop(index, 'name', e.target.value)}
                                        placeholder="Stop name"
                                        className="lg:col-span-2"
                                    />
                                    <Input
                                        type="time"
                                        value={stop.pickup_time}
                                        onChange={(e) => setStop(index, 'pickup_time', e.target.value)}
                                    />
                                    <Input
                                        type="time"
                                        value={stop.dropoff_time}
                                        onChange={(e) => setStop(index, 'dropoff_time', e.target.value)}
                                    />
                                    <Input
                                        value={stop.address}
                                        onChange={(e) => setStop(index, 'address', e.target.value)}
                                        placeholder="Address or landmark"
                                        className="sm:col-span-2 lg:col-span-4"
                                    />
                                </div>
                                {errors[`stops.${index}.name`] && (
                                    <p className="mt-1 text-xs font-medium text-rose-600">{errors[`stops.${index}.name`]}</p>
                                )}
                            </div>
                        ))}

                        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <MapPin className="h-3 w-3" /> Stops are stored separately and exposed through the transport API for GPS mapping.
                        </p>
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-2">
                    <Link href="/transport/routes" className="btn-secondary">Cancel</Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Save route' : 'Create route'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

import { router, useForm } from '@inertiajs/react';
import { Bus, Loader2, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    DataTable,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    Pagination,
    SearchInput,
    Select,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function Passengers({ passengers, routes, students, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [routeFilter, setRouteFilter] = useState(filters.transport_route_id ?? '');
    const [adding, setAdding] = useState(false);

    const apply = (overrides = {}) => {
        router.get(
            '/transport/passengers',
            { ...filters, search, transport_route_id: routeFilter, ...overrides },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const toggleActive = (passenger) => {
        router.put(
            `/transport/passengers/${passenger.id}`,
            { direction: passenger.direction, is_active: !passenger.is_active },
            { preserveScroll: true }
        );
    };

    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (passenger) => (
                <div>
                    <p className="font-medium text-slate-800">{passenger.student}</p>
                    <p className="text-[11px] text-slate-500">
                        {passenger.classroom ? `Class ${passenger.classroom}` : `Grade ${passenger.grade_level ?? '—'}`} · {passenger.student_nisn ?? 'No NISN'}
                    </p>
                </div>
            ),
        },
        {
            key: 'route',
            label: 'Route',
            render: (passenger) => (
                <div>
                    <p className="text-slate-700">{passenger.route}</p>
                    <p className="text-[11px] text-slate-500">{passenger.route_code} · {passenger.plate_number ?? 'No vehicle'}</p>
                </div>
            ),
        },
        {
            key: 'stop',
            label: 'Stop',
            render: (passenger) => (
                <div>
                    <p className="text-slate-700">{passenger.stop ?? '—'}</p>
                    <p className="text-[11px] text-slate-500">{passenger.pickup_time ? `Pickup ${passenger.pickup_time}` : ''}</p>
                </div>
            ),
        },
        { key: 'direction', label: 'Direction', render: (passenger) => <Badge tone="slate">{titleCase(passenger.direction)}</Badge> },
        { key: 'start_date', label: 'Since', render: (passenger) => <span className="text-xs text-slate-500">{formatDate(passenger.start_date)}</span> },
        {
            key: 'is_active',
            label: 'Status',
            render: (passenger) =>
                can('transport.manage') ? (
                    <button
                        type="button"
                        onClick={() => toggleActive(passenger)}
                        className={`chip ${passenger.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {passenger.is_active ? 'Active' : 'Inactive'}
                    </button>
                ) : (
                    <Badge tone={passenger.is_active ? 'emerald' : 'slate'}>{passenger.is_active ? 'Active' : 'Inactive'}</Badge>
                ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (passenger) =>
                can('transport.manage') ? (
                    <button
                        type="button"
                        onClick={() => confirmDelete(`/transport/passengers/${passenger.id}`, `Remove ${passenger.student} from ${passenger.route}?`)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Passengers">
            <PageHeader
                title="Transport passengers"
                description="Assign students to routes and stops. Each student has one active assignment per route."
            >
                <a href="/transport/logs" className="btn-secondary">Daily logs</a>
                {can('transport.manage') && (
                    <button type="button" onClick={() => setAdding(true)} className="btn-primary">
                        <UserPlus className="h-4 w-4" /> Assign student
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-3 gap-3">
                <Tile label="Assignments" value={counts.assignments} icon={Users} />
                <Tile label="Active riders" value={counts.active} icon={Bus} tone="emerald" />
                <Tile label="Routes in use" value={counts.routes_in_use} icon={Bus} tone="sky" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search student…" className="sm:max-w-xs" />
                    <Select
                        value={routeFilter}
                        onChange={(event) => {
                            setRouteFilter(event.target.value);
                            apply({ transport_route_id: event.target.value });
                        }}
                        className="sm:max-w-xs"
                    >
                        <option value="">All routes</option>
                        {routes.map((route) => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={passengers.data}
                    empty={<EmptyState icon={Bus} title="No passengers assigned" description="Assign students to a route to start tracking them." />}
                />

                <Pagination paginator={passengers} />
            </Card>

            {adding && <AssignModal routes={routes} students={students} onClose={() => setAdding(false)} />}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        sky: 'bg-sky-50 text-sky-600',
    };

    return (
        <div className="card flex items-center gap-3 p-3.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-lg font-bold leading-tight text-slate-900">{formatNumber(value)}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function AssignModal({ routes, students, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        transport_route_id: routes[0]?.id ?? '',
        route_stop_id: '',
        direction: 'both',
        start_date: new Date().toISOString().slice(0, 10),
        is_active: true,
    });

    const selectedRoute = useMemo(() => routes.find((route) => route.id === data.transport_route_id), [routes, data.transport_route_id]);
    const stops = selectedRoute?.stops ?? [];

    const submit = (event) => {
        event.preventDefault();
        post('/transport/passengers', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-xl"
            title="Assign a student to a route"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="assign-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Assign
                    </button>
                </div>
            }
        >
            <form id="assign-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Student" required error={errors.student_id} className="sm:col-span-2">
                    <Select value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} required>
                        <option value="">Select a student</option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.full_name} · {student.classroom ?? `Grade ${student.grade_level ?? '—'}`}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Route" required error={errors.transport_route_id} className="sm:col-span-2">
                    <Select
                        value={data.transport_route_id}
                        onChange={(e) => setData((values) => ({ ...values, transport_route_id: e.target.value, route_stop_id: '' }))}
                        required
                    >
                        <option value="">Select a route</option>
                        {routes.map((route) => (
                            <option key={route.id} value={route.id}>{route.name} ({route.code})</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Stop" error={errors.route_stop_id}>
                    <Select value={data.route_stop_id} onChange={(e) => setData('route_stop_id', e.target.value)}>
                        <option value="">Any stop</option>
                        {stops.map((stop) => (
                            <option key={stop.id} value={stop.id}>{stop.sequence}. {stop.name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Direction" error={errors.direction}>
                    <Select value={data.direction} onChange={(e) => setData('direction', e.target.value)}>
                        <option value="both">Pickup & drop-off</option>
                        <option value="pickup">Pickup only</option>
                        <option value="dropoff">Drop-off only</option>
                    </Select>
                </Field>
                <Field label="Start date" error={errors.start_date} className="sm:col-span-2">
                    <Input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

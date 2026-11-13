import { router, useForm } from '@inertiajs/react';
import { CalendarDays, ClipboardList, Loader2, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Card,
    DataTable,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    Pagination,
    Select,
    StatusBadge,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatNumber, titleCase } from '../../lib/format';

export default function Logs({ logs, routes, students, filters, counts }) {
    const can = useCan();
    const [adding, setAdding] = useState(false);
    const [date, setDate] = useState(filters.date ?? '');
    const [routeFilter, setRouteFilter] = useState(filters.transport_route_id ?? '');

    const apply = (overrides = {}) => {
        router.get(
            '/transport/logs',
            { date, transport_route_id: routeFilter, ...overrides },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (log) => (
                <div>
                    <p className="font-medium text-slate-800">{log.student}</p>
                    <p className="text-[11px] text-slate-500">{log.classroom ?? '—'}</p>
                </div>
            ),
        },
        {
            key: 'route',
            label: 'Route',
            render: (log) => (
                <div>
                    <p className="text-slate-700">{log.route}</p>
                    <p className="text-[11px] text-slate-500">{log.plate_number ?? log.route_code}</p>
                </div>
            ),
        },
        { key: 'direction', label: 'Direction', render: (log) => <span className="text-slate-600">{titleCase(log.direction)}</span> },
        { key: 'status', label: 'Status', render: (log) => <StatusBadge value={log.status} /> },
        { key: 'log_date', label: 'Date', render: (log) => <span className="text-xs text-slate-500">{log.log_date}</span> },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (log) =>
                can('transport.manage') ? (
                    <button
                        type="button"
                        onClick={() => confirmDelete(`/transport/logs/${log.id}`, 'Delete this passenger log entry?')}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Passenger logs">
            <PageHeader
                title="Daily passenger logs"
                description="Record who boarded, who was dropped off and who was absent on each route."
            >
                {can('transport.manage') && (
                    <button type="button" onClick={() => setAdding(true)} className="btn-primary">
                        <Plus className="h-4 w-4" /> Record log
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Entries today" value={counts.entries} icon={ClipboardList} />
                <Tile label="Picked up" value={counts.picked_up} icon={UserCheck} tone="emerald" />
                <Tile label="Dropped off" value={counts.dropped_off} icon={UserCheck} tone="sky" />
                <Tile label="Absent" value={counts.absent} icon={UserX} tone="rose" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <div className="relative sm:max-w-xs">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value);
                                apply({ date: event.target.value });
                            }}
                            className="input pl-9"
                        />
                    </div>
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
                    rows={logs.data}
                    empty={<EmptyState icon={ClipboardList} title="No log entries for this day" description="Record a pickup or drop-off to build the daily log." />}
                />

                <Pagination paginator={logs} />
            </Card>

            {adding && <LogModal routes={routes} students={students} onClose={() => setAdding(false)} />}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        sky: 'bg-sky-50 text-sky-600',
        rose: 'bg-rose-50 text-rose-600',
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

function LogModal({ routes, students, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        transport_route_id: routes[0]?.id ?? '',
        student_id: '',
        log_date: new Date().toISOString().slice(0, 10),
        direction: 'pickup',
        status: 'picked_up',
        notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/transport/logs', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-xl"
            title="Record a passenger log"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="log-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save entry
                    </button>
                </div>
            }
        >
            <form id="log-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Route" required error={errors.transport_route_id} className="sm:col-span-2">
                    <Select value={data.transport_route_id} onChange={(e) => setData('transport_route_id', e.target.value)} required>
                        <option value="">Select route</option>
                        {routes.map((route) => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Student" required error={errors.student_id} className="sm:col-span-2">
                    <Select value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} required>
                        <option value="">Select student</option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>{student.full_name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Date" required error={errors.log_date}>
                    <Input type="date" value={data.log_date} onChange={(e) => setData('log_date', e.target.value)} />
                </Field>
                <Field label="Direction" error={errors.direction}>
                    <Select value={data.direction} onChange={(e) => setData('direction', e.target.value)}>
                        <option value="pickup">Pickup</option>
                        <option value="dropoff">Drop-off</option>
                    </Select>
                </Field>
                <Field label="Status" error={errors.status}>
                    <Select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                        {['picked_up', 'dropped_off', 'absent', 'late'].map((status) => (
                            <option key={status} value={status}>{titleCase(status)}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Notes" error={errors.notes} className="sm:col-span-2">
                    <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

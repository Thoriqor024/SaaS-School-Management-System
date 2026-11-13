import { router, useForm } from '@inertiajs/react';
import { ClipboardCheck, Loader2, Plus, Trash2, UtensilsCrossed, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Bar,
    Card,
    CardHeader,
    DataTable,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    Pagination,
    Select,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function MealLogs({ logs, menus, schools, branches, filters, mealTypes, counts, last7 }) {
    const can = useCan();
    const [adding, setAdding] = useState(false);
    const [mealType, setMealType] = useState(filters.meal_type ?? '');

    const maxServed = Math.max(1, ...last7.map((day) => day.students + day.staff));

    const columns = [
        {
            key: 'meal_date',
            label: 'Date',
            render: (log) => (
                <div>
                    <p className="font-medium text-slate-800">{formatDate(log.meal_date)}</p>
                    <p className="text-[11px] text-slate-500">{titleCase(log.meal_type)}</p>
                </div>
            ),
        },
        { key: 'menu', label: 'Menu', render: (log) => <span className="text-slate-700">{log.menu ?? '—'}</span> },
        { key: 'branch', label: 'Branch', render: (log) => <span className="text-xs text-slate-600">{log.branch ?? 'All branches'}</span> },
        {
            key: 'students_served',
            label: 'Students',
            render: (log) => <span className="tabular-nums font-medium text-slate-800">{formatNumber(log.students_served)}</span>,
        },
        {
            key: 'staff_served',
            label: 'Staff',
            render: (log) => <span className="tabular-nums text-slate-700">{formatNumber(log.staff_served)}</span>,
        },
        {
            key: 'total_served',
            label: 'Total served',
            render: (log) => <span className="font-semibold tabular-nums text-brand-700">{formatNumber(log.total_served)}</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (log) =>
                can('cafeteria.manage') ? (
                    <button
                        type="button"
                        onClick={() => confirmDelete(`/cafeteria/meal-logs/${log.id}`, 'Delete this meal log?')}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Meal logs">
            <PageHeader title="Daily meal logs" description="How many students and staff were served each day, per branch.">
                {can('cafeteria.manage') && (
                    <button type="button" onClick={() => setAdding(true)} className="btn-primary">
                        <Plus className="h-4 w-4" /> Record meals
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Students today" value={counts.students_today} icon={Users} />
                <Tile label="Staff today" value={counts.staff_today} icon={Users} tone="sky" />
                <Tile label="Last 7 days" value={counts.week_total} icon={UtensilsCrossed} tone="emerald" />
                <Tile label="Log entries" value={counts.logs} icon={ClipboardCheck} tone="violet" />
            </div>

            <Card className="mb-4">
                <CardHeader title="Meals served · last 7 days" description="Students and staff combined per day." />
                <div className="space-y-3 px-4 py-4 sm:px-5">
                    {last7.map((day) => (
                        <Bar
                            key={day.date}
                            label={`${day.label} · ${formatDate(day.date)}`}
                            value={day.students + day.staff}
                            max={maxServed}
                            tone="bg-emerald-500"
                            suffix=" meals"
                        />
                    ))}
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <Select
                        value={mealType}
                        onChange={(event) => {
                            setMealType(event.target.value);
                            router.get('/cafeteria/meal-logs', { ...filters, meal_type: event.target.value }, { preserveState: true, preserveScroll: true, replace: true });
                        }}
                        className="sm:max-w-[13rem]"
                    >
                        <option value="">All meal types</option>
                        {mealTypes.map((type) => (
                            <option key={type} value={type}>{titleCase(type)}</option>
                        ))}
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={logs.data}
                    empty={<EmptyState icon={ClipboardCheck} title="No meal logs" description="Record today's catering numbers to build the trend." />}
                />

                <Pagination paginator={logs} />
            </Card>

            {adding && (
                <MealLogModal meals={menus} schools={schools} branches={branches} mealTypes={mealTypes} onClose={() => setAdding(false)} />
            )}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        sky: 'bg-sky-50 text-sky-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
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

function MealLogModal({ meals, schools, branches, mealTypes, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        school_id: schools[0]?.id ?? '',
        branch_id: '',
        cafeteria_menu_id: '',
        meal_date: new Date().toISOString().slice(0, 10),
        meal_type: 'lunch',
        students_served: 0,
        staff_served: 0,
        guests_served: 0,
        notes: '',
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);

    const submit = (event) => {
        event.preventDefault();
        post('/cafeteria/meal-logs', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Record meals served"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="meal-log-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Save log
                    </button>
                </div>
            }
        >
            <form id="meal-log-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Date" required error={errors.meal_date}>
                    <Input type="date" value={data.meal_date} onChange={(e) => setData('meal_date', e.target.value)} />
                </Field>
                <Field label="Meal type" required error={errors.meal_type}>
                    <Select value={data.meal_type} onChange={(e) => setData('meal_type', e.target.value)}>
                        {mealTypes.map((type) => (
                            <option key={type} value={type}>{titleCase(type)}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="School" required error={errors.school_id}>
                    <Select value={data.school_id} onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}>
                        {schools.map((school) => (
                            <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Branch" error={errors.branch_id}>
                    <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                        <option value="">All branches</option>
                        {visibleBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Menu served" error={errors.cafeteria_menu_id} className="sm:col-span-2">
                    <Select value={data.cafeteria_menu_id} onChange={(e) => setData('cafeteria_menu_id', e.target.value)}>
                        <option value="">Not linked to a menu</option>
                        {meals.map((menu) => (
                            <option key={menu.id} value={menu.id}>{menu.title} · {menu.menu_date}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Students served" required error={errors.students_served}>
                    <Input type="number" min="0" value={data.students_served} onChange={(e) => setData('students_served', e.target.value)} />
                </Field>
                <Field label="Staff served" required error={errors.staff_served}>
                    <Input type="number" min="0" value={data.staff_served} onChange={(e) => setData('staff_served', e.target.value)} />
                </Field>
                <Field label="Guests served" error={errors.guests_served}>
                    <Input type="number" min="0" value={data.guests_served} onChange={(e) => setData('guests_served', e.target.value)} />
                </Field>
                <Field label="Notes" error={errors.notes}>
                    <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

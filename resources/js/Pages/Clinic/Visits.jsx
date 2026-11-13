import { Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, HeartPulse, Loader2, Pencil, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
    StatusBadge,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDateTime, formatNumber, titleCase } from '../../lib/format';

export default function Visits({ visits, medicines, filters, dispositions, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [date, setDate] = useState(filters.date ?? '');
    const [dispensing, setDispensing] = useState(null);

    const apply = (overrides = {}) => {
        router.get('/clinic/visits', { ...filters, search, date, ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const columns = [
        {
            key: 'patient',
            label: 'Patient',
            render: (visit) => (
                <div>
                    <p className="font-medium text-slate-800">{visit.patient}</p>
                    <p className="text-[11px] text-slate-500">
                        {titleCase(visit.patient_type)} {visit.classroom ? `· ${visit.classroom}` : ''}
                    </p>
                </div>
            ),
        },
        {
            key: 'visit_date',
            label: 'Visit',
            render: (visit) => <span className="text-xs text-slate-600">{formatDateTime(visit.visit_date)}</span>,
        },
        {
            key: 'complaint',
            label: 'Complaint & diagnosis',
            render: (visit) => (
                <div className="max-w-[16rem]">
                    <p className="truncate text-slate-700">{visit.complaint}</p>
                    <p className="truncate text-[11px] text-slate-500">{visit.diagnosis || 'No diagnosis'}</p>
                </div>
            ),
        },
        {
            key: 'temperature',
            label: 'Temp',
            render: (visit) =>
                visit.temperature !== null ? (
                    <span className={`text-xs font-medium ${visit.temperature >= 37.5 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {visit.temperature}°C
                    </span>
                ) : (
                    <span className="text-xs text-slate-400">—</span>
                ),
        },
        { key: 'disposition', label: 'Disposition', render: (visit) => <StatusBadge value={visit.disposition} /> },
        {
            key: 'medicines',
            label: 'Medicines',
            render: (visit) => <Badge tone={visit.medicines > 0 ? 'sky' : 'slate'}>{visit.medicines} issued</Badge>,
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (visit) => (
                <div className="flex items-center justify-end gap-1">
                    {can('clinic.manage') && (
                        <>
                            <button
                                type="button"
                                onClick={() => setDispensing(visit)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                                title="Issue medicine"
                            >
                                <Pill className="h-4 w-4" />
                            </button>
                            <Link
                                href={`/clinic/visits/${visit.id}/edit`}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                                title="Edit visit"
                            >
                                <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => confirmDelete(`/clinic/visits/${visit.id}`, 'Delete this clinic visit? Dispensed stock will be restored.')}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                title="Delete visit"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout title="Clinic visits">
            <PageHeader title="Clinic visits" description="Daily visit log with vitals, diagnosis, treatment and medicine dispensing.">
                {can('clinic.view') && (
                    <Link href="/clinic/records" className="btn-secondary">Medical records</Link>
                )}
                {can('clinic.manage') && (
                    <Link href="/clinic/visits/create" className="btn-primary">
                        <Plus className="h-4 w-4" /> New visit
                    </Link>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Today" value={counts.today} icon={Stethoscope} />
                <Tile label="Last 7 days" value={counts.week} icon={HeartPulse} tone="rose" />
                <Tile label="This month" value={counts.month} icon={CalendarDays} tone="sky" />
                <Tile label="Referred out" value={counts.referred} icon={Pill} tone="amber" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search patient, complaint…" className="sm:max-w-xs" />
                    <div className="relative sm:max-w-[11rem]">
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
                    <Select value={filters.disposition ?? ''} onChange={(event) => apply({ disposition: event.target.value })} className="sm:max-w-[13rem]">
                        <option value="">All dispositions</option>
                        {dispositions.map((disposition) => (
                            <option key={disposition} value={disposition}>{titleCase(disposition)}</option>
                        ))}
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={visits.data}
                    empty={<EmptyState icon={HeartPulse} title="No visits recorded" description="Record a clinic visit when a student or staff member comes in." />}
                />

                <Pagination paginator={visits} />
            </Card>

            {dispensing && <DispenseModal visit={dispensing} medicines={medicines} onClose={() => setDispensing(null)} />}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        rose: 'bg-rose-50 text-rose-600',
        sky: 'bg-sky-50 text-sky-600',
        amber: 'bg-amber-50 text-amber-600',
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

function DispenseModal({ visit, medicines, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        medicine_id: '',
        quantity: 1,
        dosage_instructions: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(`/clinic/visits/${visit.id}/dispense`, { onSuccess: onClose, preserveScroll: true });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-lg"
            title={`Issue medicine to ${visit.patient}`}
            description={visit.complaint}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="dispense-form" disabled={processing || !data.medicine_id} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
                        Dispense
                    </button>
                </div>
            }
        >
            <form id="dispense-form" onSubmit={submit} className="space-y-4">
                <Field label="Medicine" required error={errors.medicine_id}>
                    <Select value={data.medicine_id} onChange={(e) => setData('medicine_id', e.target.value)} required>
                        <option value="">Select medicine</option>
                        {medicines.map((medicine) => (
                            <option key={medicine.id} value={medicine.id}>
                                {medicine.name} · {medicine.stock} {medicine.unit} available
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Quantity" required error={errors.quantity}>
                    <Input type="number" min="1" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                </Field>
                <Field label="Dosage instructions" error={errors.dosage_instructions}>
                    <Input
                        value={data.dosage_instructions}
                        onChange={(e) => setData('dosage_instructions', e.target.value)}
                        placeholder="e.g. 1 tablet after meals, 3 times a day"
                    />
                </Field>
            </form>
        </Modal>
    );
}

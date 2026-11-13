import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, Loader2, Pencil, Pill, Plus, Trash2 } from 'lucide-react';
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
    SearchInput,
    Select,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function Medicines({ medicines, schools, branches, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [lowStockOnly, setLowStockOnly] = useState(Boolean(filters.low_stock));
    const [editing, setEditing] = useState(null);

    const apply = (overrides = {}) => {
        router.get('/clinic/medicines', { ...filters, search, low_stock: lowStockOnly ? 1 : '', ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const filtered = medicines.filter((medicine) => {
        const term = search.trim().toLowerCase();
        const matchesTerm = !term || medicine.name.toLowerCase().includes(term);
        const matchesLow = !lowStockOnly || medicine.is_low_stock;
        return matchesTerm && matchesLow;
    });

    const columns = [
        {
            key: 'name',
            label: 'Medicine',
            render: (medicine) => (
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Pill className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-medium text-slate-800">{medicine.name}</p>
                        <p className="text-[11px] text-slate-500">{titleCase(medicine.category)} · {medicine.batch_number ?? 'No batch'}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'stock',
            label: 'Stock',
            render: (medicine) => (
                <div>
                    <p className={`font-semibold tabular-nums ${medicine.stock <= 0 ? 'text-rose-600' : medicine.is_low_stock ? 'text-amber-600' : 'text-slate-800'}`}>
                        {medicine.stock} {medicine.unit}
                    </p>
                    <p className="text-[11px] text-slate-500">min {medicine.min_stock}</p>
                </div>
            ),
        },
        {
            key: 'expiry_date',
            label: 'Expiry',
            render: (medicine) => (
                <span className={`text-xs ${medicine.is_expired ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>
                    {formatDate(medicine.expiry_date)}
                </span>
            ),
        },
        { key: 'branch', label: 'Branch', render: (medicine) => <span className="text-xs text-slate-600">{medicine.branch ?? '—'}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (medicine) =>
                medicine.stock <= 0 ? (
                    <Badge tone="rose">Out of stock</Badge>
                ) : medicine.is_low_stock ? (
                    <Badge tone="amber">Low stock</Badge>
                ) : (
                    <Badge tone="emerald">Available</Badge>
                ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (medicine) =>
                can('clinic.manage') ? (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setEditing(medicine)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/clinic/medicines/${medicine.id}`, `Delete ${medicine.name} from inventory?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Clinic medicines">
            <PageHeader title="Clinic medicine inventory" description="Stock levels, expiry dates and low-stock alerts for the school clinic.">
                {can('clinic.manage') && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add medicine
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Medicines" value={counts.total} icon={Pill} />
                <Tile label="Low stock" value={counts.low_stock} icon={AlertTriangle} tone="amber" />
                <Tile label="Out of stock" value={counts.out_of_stock} icon={AlertTriangle} tone="rose" />
                <Tile label="Expiring soon" value={counts.expiring} icon={Pill} tone="sky" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search medicine…" className="sm:max-w-xs" />
                    <button
                        type="button"
                        onClick={() => {
                            setLowStockOnly(!lowStockOnly);
                            apply({ low_stock: !lowStockOnly ? 1 : '' });
                        }}
                        className={`btn-sm inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                            lowStockOnly ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-300 bg-white text-slate-600'
                        }`}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" /> Low stock only
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    rows={filtered}
                    empty={<EmptyState icon={Pill} title="No medicines found" description="Add medicines so clinic visits can dispense them." />}
                />
            </Card>

            {editing && (
                <MedicineModal
                    medicine={editing === 'new' ? null : editing}
                    schools={schools}
                    branches={branches}
                    onClose={() => setEditing(null)}
                />
            )}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
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

function MedicineModal({ medicine, schools, branches, onClose }) {
    const isEdit = Boolean(medicine);
    const { data, setData, post, put, processing, errors } = useForm({
        school_id: medicine?.school_id ?? schools[0]?.id ?? '',
        branch_id: medicine?.branch_id ?? '',
        name: medicine?.name ?? '',
        category: medicine?.category ?? 'other',
        unit: medicine?.unit ?? 'tablet',
        stock: medicine?.stock ?? 0,
        min_stock: medicine?.min_stock ?? 10,
        expiry_date: medicine?.expiry_date ? String(medicine.expiry_date).slice(0, 10) : '',
        batch_number: medicine?.batch_number ?? '',
        notes: medicine?.notes ?? '',
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/clinic/medicines/${medicine.id}`, { onSuccess: onClose });
        else post('/clinic/medicines', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${medicine.name}` : 'Add medicine'}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="medicine-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Add medicine'}
                    </button>
                </div>
            }
        >
            <form id="medicine-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required error={errors.name} className="sm:col-span-2">
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label="Category" required error={errors.category}>
                    <Select value={data.category} onChange={(e) => setData('category', e.target.value)}>
                        {['analgesic', 'antibiotic', 'antihistamine', 'vitamin', 'first_aid', 'other'].map((category) => (
                            <option key={category} value={category}>{titleCase(category)}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Unit" required error={errors.unit}>
                    <Input value={data.unit} onChange={(e) => setData('unit', e.target.value)} placeholder="tablet / bottle" />
                </Field>
                <Field label="Stock" required error={errors.stock}>
                    <Input type="number" min="0" value={data.stock} onChange={(e) => setData('stock', e.target.value)} />
                </Field>
                <Field label="Minimum stock" required error={errors.min_stock}>
                    <Input type="number" min="0" value={data.min_stock} onChange={(e) => setData('min_stock', e.target.value)} />
                </Field>
                <Field label="Expiry date" error={errors.expiry_date}>
                    <Input type="date" value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                </Field>
                <Field label="Batch number" error={errors.batch_number}>
                    <Input value={data.batch_number} onChange={(e) => setData('batch_number', e.target.value)} />
                </Field>
                <Field label="School" required error={errors.school_id} className="sm:col-span-2">
                    <Select value={data.school_id} onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}>
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
                <Field label="Notes" error={errors.notes}>
                    <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, Loader2, Package, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
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

export default function Inventory({ items, schools, branches, filters, categories, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [editing, setEditing] = useState(null);
    const [restocking, setRestocking] = useState(null);

    const apply = (overrides = {}) => {
        router.get('/cafeteria/inventory', { ...filters, search, category, ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const filtered = items.filter((item) => {
        const term = search.trim().toLowerCase();
        return (!term || item.name.toLowerCase().includes(term)) && (!category || item.category === category);
    });

    const columns = [
        {
            key: 'name',
            label: 'Item',
            render: (item) => (
                <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{titleCase(item.category)} · {item.supplier ?? 'No supplier'}</p>
                </div>
            ),
        },
        {
            key: 'quantity',
            label: 'On hand',
            render: (item) => (
                <div>
                    <p className={`font-semibold tabular-nums ${item.is_low_stock ? 'text-amber-600' : 'text-slate-800'}`}>
                        {item.quantity} {item.unit}
                    </p>
                    <p className="text-[11px] text-slate-500">min {item.min_quantity}</p>
                </div>
            ),
        },
        { key: 'expiry_date', label: 'Expiry', render: (item) => <span className="text-xs text-slate-600">{formatDate(item.expiry_date)}</span> },
        { key: 'last_restocked_at', label: 'Restocked', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.last_restocked_at)}</span> },
        { key: 'branch', label: 'Branch', render: (item) => <span className="text-xs text-slate-600">{item.branch ?? '—'}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (item) => (item.is_low_stock ? <Badge tone="amber">Low stock</Badge> : <Badge tone="emerald">Sufficient</Badge>),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (item) =>
                can('cafeteria.manage') ? (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setRestocking(item)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Restock"
                        >
                            <PackagePlus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(item)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/cafeteria/inventory/${item.id}`, `Delete ${item.name} from inventory?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Kitchen inventory">
            <PageHeader title="Cafeteria inventory" description="Dry goods, fresh produce, beverages and utensils with expiry tracking.">
                {can('cafeteria.manage') && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add item
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-3 gap-3">
                <Tile label="Items tracked" value={counts.total} icon={Package} />
                <Tile label="Below minimum" value={counts.low_stock} icon={AlertTriangle} tone="amber" />
                <Tile label="Expiring soon" value={counts.expiring} icon={Package} tone="rose" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search supplies…" className="sm:max-w-xs" />
                    <Select
                        value={category}
                        onChange={(event) => {
                            setCategory(event.target.value);
                            apply({ category: event.target.value });
                        }}
                        className="sm:max-w-[13rem]"
                    >
                        <option value="">All categories</option>
                        {categories.map((item) => (
                            <option key={item} value={item}>{titleCase(item)}</option>
                        ))}
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={filtered}
                    empty={<EmptyState icon={Package} title="No inventory items" description="Add kitchen supplies to track stock levels." />}
                />
            </Card>

            {editing && (
                <ItemModal
                    item={editing === 'new' ? null : editing}
                    schools={schools}
                    branches={branches}
                    categories={categories}
                    onClose={() => setEditing(null)}
                />
            )}

            {restocking && <RestockModal item={restocking} onClose={() => setRestocking(null)} />}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        amber: 'bg-amber-50 text-amber-600',
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

function ItemModal({ item, schools, branches, categories, onClose }) {
    const isEdit = Boolean(item);
    const { data, setData, post, put, processing, errors } = useForm({
        school_id: item?.school_id ?? schools[0]?.id ?? '',
        branch_id: item?.branch_id ?? '',
        name: item?.name ?? '',
        category: item?.category ?? 'dry_goods',
        unit: item?.unit ?? 'kg',
        quantity: item?.quantity ?? 0,
        min_quantity: item?.min_quantity ?? 0,
        supplier: item?.supplier ?? '',
        expiry_date: item?.expiry_date ? String(item.expiry_date).slice(0, 10) : '',
        last_restocked_at: item?.last_restocked_at ? String(item.last_restocked_at).slice(0, 10) : '',
        notes: item?.notes ?? '',
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/cafeteria/inventory/${item.id}`, { onSuccess: onClose });
        else post('/cafeteria/inventory', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${item.name}` : 'Add inventory item'}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="item-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Add item'}
                    </button>
                </div>
            }
        >
            <form id="item-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Item name" required error={errors.name} className="sm:col-span-2">
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label="Category" required error={errors.category}>
                    <Select value={data.category} onChange={(e) => setData('category', e.target.value)}>
                        {categories.map((category) => (
                            <option key={category} value={category}>{titleCase(category)}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Unit" required error={errors.unit}>
                    <Input value={data.unit} onChange={(e) => setData('unit', e.target.value)} placeholder="kg / liter / box" />
                </Field>
                <Field label="Quantity" required error={errors.quantity}>
                    <Input type="number" step="0.01" min="0" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                </Field>
                <Field label="Minimum quantity" required error={errors.min_quantity}>
                    <Input type="number" step="0.01" min="0" value={data.min_quantity} onChange={(e) => setData('min_quantity', e.target.value)} />
                </Field>
                <Field label="Supplier" error={errors.supplier}>
                    <Input value={data.supplier} onChange={(e) => setData('supplier', e.target.value)} />
                </Field>
                <Field label="Expiry date" error={errors.expiry_date}>
                    <Input type="date" value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
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
                        <option value="">No specific branch</option>
                        {visibleBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </Select>
                </Field>
            </form>
        </Modal>
    );
}

function RestockModal({ item, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ quantity: 10 });

    const submit = (event) => {
        event.preventDefault();
        post(`/cafeteria/inventory/${item.id}/restock`, { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-md"
            title={`Restock ${item.name}`}
            description={`Current stock: ${item.quantity} ${item.unit}`}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="restock-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                        Add stock
                    </button>
                </div>
            }
        >
            <form id="restock-form" onSubmit={submit} className="space-y-4">
                <Field label={`Quantity received (${item.unit})`} required error={errors.quantity}>
                    <Input type="number" step="0.01" min="0.01" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

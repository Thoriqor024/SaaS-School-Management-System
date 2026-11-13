import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../Components/ui';
import { titleCase } from '../../lib/format';

const toDate = (value) => (value ? String(value).slice(0, 10) : '');

export default function AssetForm({ asset, schools, branches, categories, employees, conditions, statuses }) {
    const isEdit = Boolean(asset);

    const { data, setData, post, put, processing, errors } = useForm({
        school_id: asset?.school_id ?? schools[0]?.id ?? '',
        branch_id: asset?.branch_id ?? '',
        asset_category_id: asset?.asset_category_id ?? '',
        asset_code: asset?.asset_code ?? `AST-${String(Date.now()).slice(-5)}`,
        name: asset?.name ?? '',
        type: asset?.type ?? 'fixed',
        quantity: asset?.quantity ?? 1,
        unit: asset?.unit ?? 'unit',
        condition: asset?.condition ?? 'good',
        status: asset?.status ?? 'in_use',
        location: asset?.location ?? '',
        assigned_to_employee_id: asset?.assigned_to_employee_id ?? '',
        purchase_date: toDate(asset?.purchase_date),
        purchase_price: asset?.purchase_price ?? '',
        warranty_until: toDate(asset?.warranty_until),
        last_checked_at: toDate(asset?.last_checked_at),
        notes: asset?.notes ?? '',
    });

    const visibleBranches = useMemo(() => branches.filter((branch) => branch.school_id === data.school_id), [branches, data.school_id]);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/assets/${asset.id}`);
        else post('/assets');
    };

    return (
        <AppLayout title={isEdit ? 'Edit asset' : 'Add asset'}>
            <PageHeader
                title={isEdit ? `Edit ${asset.name}` : 'Add an asset'}
                description="Every asset belongs to a school and branch so stock reports stay accurate group-wide."
            >
                <Link href="/assets" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
            </PageHeader>

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader title="Asset details" />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Asset name" required error={errors.name} className="sm:col-span-2">
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        </Field>
                        <Field label="Asset code" required error={errors.asset_code} hint="Unique barcode-friendly identifier.">
                            <Input value={data.asset_code} onChange={(e) => setData('asset_code', e.target.value)} required />
                        </Field>
                        <Field label="Category" error={errors.asset_category_id}>
                            <Select value={data.asset_category_id} onChange={(e) => setData('asset_category_id', e.target.value)}>
                                <option value="">Uncategorised</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Type" required error={errors.type}>
                            <Select value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                <option value="fixed">Fixed asset</option>
                                <option value="consumable">Consumable / supplies</option>
                            </Select>
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Quantity" required error={errors.quantity}>
                                <Input type="number" min="1" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                            </Field>
                            <Field label="Unit" required error={errors.unit}>
                                <Input value={data.unit} onChange={(e) => setData('unit', e.target.value)} placeholder="unit / ream" />
                            </Field>
                        </div>
                        <Field label="Condition" required error={errors.condition}>
                            <Select value={data.condition} onChange={(e) => setData('condition', e.target.value)}>
                                {conditions.map((condition) => (
                                    <option key={condition} value={condition}>{titleCase(condition)}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Status" required error={errors.status}>
                            <Select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{titleCase(status)}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Location" error={errors.location} hint="Room, building or warehouse.">
                            <Input value={data.location} onChange={(e) => setData('location', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Placement & ownership" />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="School" required error={errors.school_id}>
                            <Select
                                value={data.school_id}
                                onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}
                            >
                                <option value="">Select a school</option>
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
                        <Field label="Assigned to" error={errors.assigned_to_employee_id}>
                            <Select value={data.assigned_to_employee_id} onChange={(e) => setData('assigned_to_employee_id', e.target.value)}>
                                <option value="">Unassigned</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Procurement & maintenance" description="Optional dates and value used for audit reports." />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                        <Field label="Purchase date" error={errors.purchase_date}>
                            <Input type="date" value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} />
                        </Field>
                        <Field label="Purchase price (IDR)" error={errors.purchase_price}>
                            <Input type="number" min="0" step="1000" value={data.purchase_price} onChange={(e) => setData('purchase_price', e.target.value)} />
                        </Field>
                        <Field label="Warranty until" error={errors.warranty_until}>
                            <Input type="date" value={data.warranty_until} onChange={(e) => setData('warranty_until', e.target.value)} />
                        </Field>
                        <Field label="Last checked" error={errors.last_checked_at}>
                            <Input type="date" value={data.last_checked_at} onChange={(e) => setData('last_checked_at', e.target.value)} />
                        </Field>
                        <Field label="Notes" error={errors.notes} className="sm:col-span-2 lg:col-span-4">
                            <Textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <div className="flex items-center justify-between gap-2">
                    <Badge tone="slate">UUID record · ready for external asset system mapping</Badge>
                    <div className="flex gap-2">
                        <Link href="/assets" className="btn-secondary">Cancel</Link>
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isEdit ? 'Save changes' : 'Create asset'}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}

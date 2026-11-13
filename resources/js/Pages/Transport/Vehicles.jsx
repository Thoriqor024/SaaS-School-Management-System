import { useForm } from '@inertiajs/react';
import { Bus, Gauge, Loader2, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
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
    SearchInput,
    Select,
    StatusBadge,
    Textarea,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function Vehicles({ vehicles, schools, branches, drivers, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [editing, setEditing] = useState(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return vehicles.filter((vehicle) => {
            const matchesTerm =
                !term || [vehicle.plate_number, vehicle.brand, vehicle.model].filter(Boolean).some((value) => value.toLowerCase().includes(term));
            const matchesStatus = !status || vehicle.status === status;
            return matchesTerm && matchesStatus;
        });
    }, [vehicles, search, status]);

    const columns = [
        {
            key: 'plate_number',
            label: 'Vehicle',
            render: (vehicle) => (
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <Bus className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-medium text-slate-800">{vehicle.plate_number}</p>
                        <p className="text-[11px] text-slate-500">
                            {vehicle.brand} {vehicle.model} {vehicle.year ? `· ${vehicle.year}` : ''}
                        </p>
                    </div>
                </div>
            ),
        },
        { key: 'type', label: 'Type', render: (vehicle) => <span className="capitalize text-slate-600">{vehicle.type}</span> },
        {
            key: 'capacity',
            label: 'Capacity',
            render: (vehicle) => <span className="tabular-nums text-slate-700">{vehicle.capacity} seats</span>,
        },
        { key: 'condition', label: 'Condition', render: (vehicle) => <StatusBadge value={vehicle.condition} /> },
        { key: 'status', label: 'Status', render: (vehicle) => <StatusBadge value={vehicle.status} /> },
        {
            key: 'driver',
            label: 'Driver',
            render: (vehicle) => (
                <div>
                    <p className="text-slate-700">{vehicle.driver ?? 'Unassigned'}</p>
                    <p className="text-[11px] text-slate-500">{vehicle.branch ?? 'No branch'}</p>
                </div>
            ),
        },
        {
            key: 'routes_count',
            label: 'Routes',
            render: (vehicle) => <Badge tone="indigo">{vehicle.routes_count}</Badge>,
        },
        {
            key: 'tax_expiry',
            label: 'Tax expiry',
            render: (vehicle) => <span className="text-xs text-slate-500">{formatDate(vehicle.tax_expiry)}</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (vehicle) =>
                can('transport.manage') ? (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setEditing(vehicle)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/transport/vehicles/${vehicle.id}`, `Remove ${vehicle.plate_number} from the fleet?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Fleet">
            <PageHeader title="Transport fleet" description="Vehicles, drivers and compliance dates across every branch.">
                {can('transport.manage') && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add vehicle
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Vehicles" value={counts.total} icon={Bus} />
                <Tile label="Active" value={counts.active} icon={Gauge} tone="emerald" />
                <Tile label="In maintenance" value={counts.maintenance} icon={Wrench} tone="amber" />
                <Tile label="Total seats" value={counts.capacity} icon={Bus} tone="sky" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search plate, brand…" className="sm:max-w-xs" />
                    <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:max-w-[12rem]">
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={filtered}
                    empty={<EmptyState icon={Bus} title="No vehicles found" description="Add the first vehicle to this fleet." />}
                />
            </Card>

            {editing && (
                <VehicleModal
                    vehicle={editing === 'new' ? null : editing}
                    schools={schools}
                    branches={branches}
                    drivers={drivers}
                    onClose={() => setEditing(null)}
                />
            )}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
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

function VehicleModal({ vehicle, schools, branches, drivers, onClose }) {
    const isEdit = Boolean(vehicle);
    const { data, setData, post, put, processing, errors } = useForm({
        school_id: vehicle?.school_id ?? schools[0]?.id ?? '',
        branch_id: vehicle?.branch_id ?? '',
        plate_number: vehicle?.plate_number ?? '',
        brand: vehicle?.brand ?? '',
        model: vehicle?.model ?? '',
        type: vehicle?.type ?? 'bus',
        capacity: vehicle?.capacity ?? 30,
        year: vehicle?.year ?? new Date().getFullYear(),
        condition: vehicle?.condition ?? 'good',
        status: vehicle?.status ?? 'active',
        driver_employee_id: vehicle?.driver_employee_id ?? '',
        attendant_name: vehicle?.attendant_name ?? '',
        tax_expiry: vehicle?.tax_expiry ? String(vehicle.tax_expiry).slice(0, 10) : '',
        insurance_expiry: vehicle?.insurance_expiry ? String(vehicle.insurance_expiry).slice(0, 10) : '',
        notes: vehicle?.notes ?? '',
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/transport/vehicles/${vehicle.id}`, { onSuccess: onClose });
        else post('/transport/vehicles', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${vehicle.plate_number}` : 'Add vehicle'}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="vehicle-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Add vehicle'}
                    </button>
                </div>
            }
        >
            <form id="vehicle-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Plate number" required error={errors.plate_number}>
                    <Input value={data.plate_number} onChange={(e) => setData('plate_number', e.target.value.toUpperCase())} required />
                </Field>
                <Field label="Type" required error={errors.type}>
                    <Select value={data.type} onChange={(e) => setData('type', e.target.value)}>
                        {['bus', 'minibus', 'van', 'car'].map((type) => (
                            <option key={type} value={type} className="capitalize">{type}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Brand" error={errors.brand}>
                    <Input value={data.brand} onChange={(e) => setData('brand', e.target.value)} />
                </Field>
                <Field label="Model" error={errors.model}>
                    <Input value={data.model} onChange={(e) => setData('model', e.target.value)} />
                </Field>
                <Field label="Capacity" required error={errors.capacity}>
                    <Input type="number" min="1" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} />
                </Field>
                <Field label="Year" error={errors.year}>
                    <Input type="number" value={data.year} onChange={(e) => setData('year', e.target.value)} />
                </Field>
                <Field label="School" required error={errors.school_id}>
                    <Select
                        value={data.school_id}
                        onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}
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
                <Field label="Condition" error={errors.condition}>
                    <Select value={data.condition} onChange={(e) => setData('condition', e.target.value)}>
                        {['good', 'minor_damage', 'major_damage', 'broken'].map((condition) => (
                            <option key={condition} value={condition}>{titleCase(condition)}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Status" error={errors.status}>
                    <Select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                        {['active', 'maintenance', 'inactive'].map((status) => (
                            <option key={status} value={status}>{titleCase(status)}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Driver" error={errors.driver_employee_id}>
                    <Select value={data.driver_employee_id} onChange={(e) => setData('driver_employee_id', e.target.value)}>
                        <option value="">Unassigned</option>
                        {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Attendant" error={errors.attendant_name}>
                    <Input value={data.attendant_name} onChange={(e) => setData('attendant_name', e.target.value)} />
                </Field>
                <Field label="Tax expiry" error={errors.tax_expiry}>
                    <Input type="date" value={data.tax_expiry} onChange={(e) => setData('tax_expiry', e.target.value)} />
                </Field>
                <Field label="Insurance expiry" error={errors.insurance_expiry}>
                    <Input type="date" value={data.insurance_expiry} onChange={(e) => setData('insurance_expiry', e.target.value)} />
                </Field>
                <Field label="Notes" error={errors.notes} className="sm:col-span-2">
                    <Textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

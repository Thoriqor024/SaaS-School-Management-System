import { useForm } from '@inertiajs/react';
import {
    Building2,
    GraduationCap,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    Field,
    Input,
    Modal,
    PageHeader,
    Select,
    Textarea,
    confirmDelete,
} from '../../Components/ui';
import { formatNumber } from '../../lib/format';

export default function SchoolsIndex({ schools, canManage, totals }) {
    const [schoolModal, setSchoolModal] = useState(null); // { school } | { school: null }
    const [branchModal, setBranchModal] = useState(null); // { school, branch }

    return (
        <AppLayout title="Schools & branches">
            <PageHeader
                title="Schools & branches"
                description="The organisational backbone. Every student, employee and operational record is scoped to one school and optionally a branch."
            >
                {canManage && (
                    <button type="button" onClick={() => setSchoolModal({ school: null })} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add school
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Total label="Schools" value={totals.schools} icon={Building2} />
                <Total label="Branches" value={totals.branches} icon={MapPin} />
                <Total label="Students" value={totals.students} icon={GraduationCap} />
                <Total label="Employees" value={totals.employees} icon={UsersRound} />
            </div>

            <div className="space-y-4">
                {schools.map((school) => (
                    <Card key={school.id}>
                        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                                    {school.initials}
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base font-bold text-slate-900">{school.name}</h2>
                                        <Badge tone="indigo">{school.code}</Badge>
                                        {!school.is_active && <Badge tone="rose">Inactive</Badge>}
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {school.level} · NPSN {school.npsn ?? '—'} · {school.city ?? 'No city'}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="h-3 w-3" /> {school.address ?? 'No address'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">Headmaster: {school.headmaster_name ?? '—'}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                                <Metric label="Branches" value={school.branches.length} />
                                <Metric label="Students" value={school.students_count} />
                                <Metric label="Employees" value={school.employees_count} />
                                {canManage && (
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setSchoolModal({ school })}
                                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                                            title="Edit school"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => confirmDelete(`/schools/${school.id}`, `Delete ${school.name}? Only possible when no students remain.`)}
                                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete school"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Branches</p>
                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() => setBranchModal({ school, branch: null })}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                                    >
                                        <Plus className="h-3 w-3" /> Add branch
                                    </button>
                                )}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {school.branches.map((branch) => (
                                    <div key={branch.id} className="rounded-xl border border-slate-200 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800">{branch.name}</p>
                                                <p className="text-[11px] text-slate-500">{branch.code} · {branch.city ?? 'No city'}</p>
                                            </div>
                                            {canManage && (
                                                <div className="flex gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBranchModal({ school, branch })}
                                                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                                                        title="Edit branch"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(`/branches/${branch.id}`, `Delete branch ${branch.name}?`)}
                                                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Delete branch"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 text-[11px] text-slate-500">
                                            {formatNumber(branch.students_count)} students · {formatNumber(branch.employees_count)} employees
                                        </p>
                                        <p className="text-[11px] text-slate-400">Head: {branch.head_name ?? '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {schoolModal && <SchoolModal school={schoolModal.school} onClose={() => setSchoolModal(null)} />}
            {branchModal && (
                <BranchModal school={branchModal.school} branch={branchModal.branch} onClose={() => setBranchModal(null)} />
            )}
        </AppLayout>
    );
}

function Total({ label, value, icon: Icon }) {
    return (
        <div className="card flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-lg font-bold leading-tight text-slate-900">{formatNumber(value)}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="text-center">
            <p className="text-lg font-bold tabular-nums text-slate-900">{formatNumber(value)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        </div>
    );
}

function SchoolModal({ school, onClose }) {
    const isEdit = Boolean(school);
    const { data, setData, post, put, processing, errors } = useForm({
        name: school?.name ?? '',
        code: school?.code ?? '',
        npsn: school?.npsn ?? '',
        level: school?.level ?? 'K-12',
        email: school?.email ?? '',
        phone: school?.phone ?? '',
        address: school?.address ?? '',
        city: school?.city ?? '',
        province: school?.province ?? '',
        headmaster_name: school?.headmaster_name ?? '',
        is_active: school?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/schools/${school.id}`, { onSuccess: onClose });
        else post('/schools', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${school.name}` : 'Add a school'}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="school-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Create school'}
                    </button>
                </div>
            }
        >
            <form id="school-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="School name" required error={errors.name} className="sm:col-span-2">
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label="Code" required error={errors.code}>
                    <Input value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} required />
                </Field>
                <Field label="NPSN" error={errors.npsn}>
                    <Input value={data.npsn} onChange={(e) => setData('npsn', e.target.value)} />
                </Field>
                <Field label="Level" error={errors.level}>
                    <Select value={data.level} onChange={(e) => setData('level', e.target.value)}>
                        {['K-12', 'K-9', 'Elementary', 'Secondary', 'Vocational'].map((level) => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Headmaster" error={errors.headmaster_name}>
                    <Input value={data.headmaster_name} onChange={(e) => setData('headmaster_name', e.target.value)} />
                </Field>
                <Field label="Email" error={errors.email}>
                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                </Field>
                <Field label="Phone" error={errors.phone}>
                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </Field>
                <Field label="City" error={errors.city}>
                    <Input value={data.city} onChange={(e) => setData('city', e.target.value)} />
                </Field>
                <Field label="Province" error={errors.province}>
                    <Input value={data.province} onChange={(e) => setData('province', e.target.value)} />
                </Field>
                <Field label="Address" error={errors.address} className="sm:col-span-2">
                    <Textarea rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

function BranchModal({ school, branch, onClose }) {
    const isEdit = Boolean(branch);
    const { data, setData, post, put, processing, errors } = useForm({
        name: branch?.name ?? '',
        code: branch?.code ?? '',
        type: branch?.type ?? 'campus',
        email: branch?.email ?? '',
        phone: branch?.phone ?? '',
        address: branch?.address ?? '',
        city: branch?.city ?? '',
        province: branch?.province ?? '',
        head_name: branch?.head_name ?? '',
        is_active: branch?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/branches/${branch.id}`, { onSuccess: onClose });
        else post(`/schools/${school.id}/branches`, { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${branch.name}` : `Add a branch to ${school.name}`}
            size="max-w-xl"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="branch-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Create branch'}
                    </button>
                </div>
            }
        >
            <form id="branch-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Branch name" required error={errors.name} className="sm:col-span-2">
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label="Code" required error={errors.code}>
                    <Input value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} required />
                </Field>
                <Field label="Type" error={errors.type}>
                    <Select value={data.type} onChange={(e) => setData('type', e.target.value)}>
                        {['main', 'campus', 'wing', 'annex'].map((type) => (
                            <option key={type} value={type} className="capitalize">{type}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Head of branch" error={errors.head_name}>
                    <Input value={data.head_name} onChange={(e) => setData('head_name', e.target.value)} />
                </Field>
                <Field label="Phone" error={errors.phone}>
                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </Field>
                <Field label="City" error={errors.city}>
                    <Input value={data.city} onChange={(e) => setData('city', e.target.value)} />
                </Field>
                <Field label="Province" error={errors.province}>
                    <Input value={data.province} onChange={(e) => setData('province', e.target.value)} />
                </Field>
                <Field label="Address" error={errors.address} className="sm:col-span-2">
                    <Textarea rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

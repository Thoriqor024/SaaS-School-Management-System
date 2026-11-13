import { router, useForm } from '@inertiajs/react';
import { HeartPulse, Loader2, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react';
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
    Textarea,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function Records({ records, students, employees, schools, branches, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.patient_type ?? '');
    const [editing, setEditing] = useState(null);

    const columns = [
        {
            key: 'patient',
            label: 'Patient',
            render: (record) => (
                <div>
                    <p className="font-medium text-slate-800">{record.patient}</p>
                    <p className="text-[11px] text-slate-500">
                        {titleCase(record.patient_type)} {record.classroom ? `· ${record.classroom}` : ''}
                    </p>
                </div>
            ),
        },
        { key: 'blood_type', label: 'Blood', render: (record) => <Badge tone="rose">{record.blood_type ?? '—'}</Badge> },
        {
            key: 'allergies',
            label: 'Allergies',
            render: (record) => (
                <div className="max-w-[14rem]">
                    <p className="truncate text-slate-700">{record.allergies || 'None recorded'}</p>
                    <p className="truncate text-[11px] text-slate-500">{record.chronic_conditions || 'No chronic conditions'}</p>
                </div>
            ),
        },
        {
            key: 'emergency_contact_name',
            label: 'Emergency contact',
            render: (record) => (
                <div>
                    <p className="text-slate-700">{record.emergency_contact_name ?? '—'}</p>
                    <p className="text-[11px] text-slate-500">{record.emergency_contact_phone ?? ''}</p>
                </div>
            ),
        },
        { key: 'last_checkup_at', label: 'Last checkup', render: (record) => <span className="text-xs text-slate-500">{formatDate(record.last_checkup_at)}</span> },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (record) =>
                can('clinic.manage') ? (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setEditing(record)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/clinic/records/${record.id}`, `Delete the medical record for ${record.patient}?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Medical records">
            <PageHeader title="Medical records" description="Allergy and chronic condition profiles for students and employees, used at clinic intake.">
                {can('clinic.manage') && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add record
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Records" value={counts.total} icon={HeartPulse} />
                <Tile label="Students" value={counts.students} icon={HeartPulse} tone="sky" />
                <Tile label="Employees" value={counts.employees} icon={HeartPulse} tone="violet" />
                <Tile label="With allergies" value={counts.with_allergies} icon={ShieldAlert} tone="amber" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput
                        value={search}
                        onChange={(value) => {
                            setSearch(value);
                            router.get('/clinic/records', { ...filters, search: value, patient_type: type }, { preserveState: true, preserveScroll: true, replace: true });
                        }}
                        placeholder="Search patient, allergy…"
                        className="sm:max-w-xs"
                    />
                    <Select
                        value={type}
                        onChange={(event) => {
                            setType(event.target.value);
                            router.get('/clinic/records', { ...filters, search, patient_type: event.target.value }, { preserveState: true, preserveScroll: true, replace: true });
                        }}
                        className="sm:max-w-[13rem]"
                    >
                        <option value="">All patients</option>
                        <option value="student">Students</option>
                        <option value="employee">Employees</option>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={records.data}
                    empty={<EmptyState icon={HeartPulse} title="No medical records" description="Add a record to capture allergies and emergency contacts." />}
                />

                <Pagination paginator={records} />
            </Card>

            {editing && (
                <RecordModal
                    record={editing === 'new' ? null : editing}
                    students={students}
                    employees={employees}
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
        sky: 'bg-sky-50 text-sky-600',
        violet: 'bg-violet-50 text-violet-600',
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

function RecordModal({ record, students, employees, schools, branches, onClose }) {
    const isEdit = Boolean(record);
    const { data, setData, post, put, processing, errors } = useForm({
        school_id: record?.school_id ?? schools[0]?.id ?? '',
        branch_id: record?.branch_id ?? '',
        patient_type: record?.patient_type ?? 'student',
        student_id: record?.student_id ?? '',
        employee_id: record?.employee_id ?? '',
        blood_type: record?.blood_type ?? '',
        allergies: record?.allergies ?? '',
        chronic_conditions: record?.chronic_conditions ?? '',
        current_medications: record?.current_medications ?? '',
        emergency_contact_name: record?.emergency_contact_name ?? '',
        emergency_contact_phone: record?.emergency_contact_phone ?? '',
        insurance_provider: '',
        insurance_number: '',
        last_checkup_at: record?.last_checkup_at ?? '',
        notes: '',
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);
    const patients = data.patient_type === 'student' ? students : employees;

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/clinic/records/${record.id}`, { onSuccess: onClose });
        else post('/clinic/records', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Medical record · ${record.patient}` : 'Add medical record'}
            description="Allergies and chronic conditions are surfaced to clinic staff during visits."
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="record-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Create record'}
                    </button>
                </div>
            }
        >
            <form id="record-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                {!isEdit && (
                    <>
                        <Field label="Patient type" required error={errors.patient_type}>
                            <Select
                                value={data.patient_type}
                                onChange={(e) => setData((values) => ({ ...values, patient_type: e.target.value, student_id: '', employee_id: '' }))}
                            >
                                <option value="student">Student</option>
                                <option value="employee">Employee</option>
                            </Select>
                        </Field>
                        <Field label="School" required error={errors.school_id}>
                            <Select value={data.school_id} onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}>
                                {schools.map((school) => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label={data.patient_type === 'student' ? 'Student' : 'Employee'} required error={errors.student_id ?? errors.employee_id} className="sm:col-span-2">
                            <Select
                                value={data.patient_type === 'student' ? data.student_id : data.employee_id}
                                onChange={(e) => setData(data.patient_type === 'student' ? 'student_id' : 'employee_id', e.target.value)}
                                required
                            >
                                <option value="">Select a person</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>{patient.full_name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Branch" error={errors.branch_id} className="sm:col-span-2">
                            <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                                <option value="">No specific branch</option>
                                {visibleBranches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </Select>
                        </Field>
                    </>
                )}

                <Field label="Blood type" error={errors.blood_type}>
                    <Select value={data.blood_type} onChange={(e) => setData('blood_type', e.target.value)}>
                        <option value="">Unknown</option>
                        {['A', 'B', 'AB', 'O'].map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Last checkup" error={errors.last_checkup_at}>
                    <Input type="date" value={data.last_checkup_at ?? ''} onChange={(e) => setData('last_checkup_at', e.target.value)} />
                </Field>
                <Field label="Allergies" error={errors.allergies} className="sm:col-span-2">
                    <Textarea rows={2} value={data.allergies} onChange={(e) => setData('allergies', e.target.value)} placeholder="e.g. Peanuts, penicillin" />
                </Field>
                <Field label="Chronic conditions" error={errors.chronic_conditions} className="sm:col-span-2">
                    <Textarea rows={2} value={data.chronic_conditions} onChange={(e) => setData('chronic_conditions', e.target.value)} />
                </Field>
                <Field label="Current medications" error={errors.current_medications} className="sm:col-span-2">
                    <Textarea rows={2} value={data.current_medications} onChange={(e) => setData('current_medications', e.target.value)} />
                </Field>
                <Field label="Emergency contact name" error={errors.emergency_contact_name}>
                    <Input value={data.emergency_contact_name} onChange={(e) => setData('emergency_contact_name', e.target.value)} />
                </Field>
                <Field label="Emergency contact phone" error={errors.emergency_contact_phone}>
                    <Input value={data.emergency_contact_phone} onChange={(e) => setData('emergency_contact_phone', e.target.value)} />
                </Field>
                <Field label="Insurance provider" error={errors.insurance_provider}>
                    <Input value={data.insurance_provider} onChange={(e) => setData('insurance_provider', e.target.value)} />
                </Field>
                <Field label="Insurance number" error={errors.insurance_number}>
                    <Input value={data.insurance_number} onChange={(e) => setData('insurance_number', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}

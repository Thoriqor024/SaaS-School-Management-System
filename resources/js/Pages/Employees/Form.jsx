import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, Checkbox, Field, Input, PageHeader, PhotoField, Select, Textarea } from '../../Components/ui';
import { titleCase } from '../../lib/format';

const toDate = (value) => (value ? String(value).slice(0, 10) : '');

export default function EmployeeForm({ employee, schools, branches, types, employmentStatuses }) {
    const isEdit = Boolean(employee);
    const [preview, setPreview] = useState(employee?.photo_url ?? null);

    const { data, setData, post, put, processing, errors, progress } = useForm({
        school_id: employee?.school_id ?? schools[0]?.id ?? '',
        branch_id: employee?.branch_id ?? '',
        employee_number: employee?.employee_number ?? `EMP-${String(Date.now()).slice(-4)}`,
        full_name: employee?.full_name ?? '',
        nickname: employee?.nickname ?? '',
        gender: employee?.gender ?? 'male',
        birth_place: employee?.birth_place ?? '',
        birth_date: toDate(employee?.birth_date),
        religion: employee?.religion ?? '',
        marital_status: employee?.marital_status ?? 'single',
        blood_type: employee?.blood_type ?? '',
        type: employee?.type ?? 'teacher',
        position: employee?.position ?? '',
        department: employee?.department ?? '',
        employment_status: employee?.employment_status ?? 'permanent',
        join_date: toDate(employee?.join_date),
        end_date: toDate(employee?.end_date),
        education_level: employee?.education_level ?? '',
        major: employee?.major ?? '',
        email: employee?.email ?? '',
        phone: employee?.phone ?? '',
        address: employee?.address ?? '',
        notes: employee?.notes ?? '',
        is_active: employee?.is_active ?? true,
        photo: null,
        remove_photo: false,
    });

    const visibleBranches = useMemo(() => branches.filter((branch) => branch.school_id === data.school_id), [branches, data.school_id]);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/employees/${employee.id}`);
        else post('/employees');
    };

    return (
        <AppLayout title={isEdit ? 'Edit employee' : 'Add employee'}>
            <PageHeader
                title={isEdit ? `Edit ${employee.full_name}` : 'Add an employee'}
                description="Teachers, staff and general employees share this master record with a type discriminator."
            >
                <Link href={isEdit ? `/employees/${employee.id}` : '/employees'} className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
            </PageHeader>

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader title="Identity" description="Personal and identity details for HR records." />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Full name" required error={errors.full_name} className="sm:col-span-2">
                            <Input value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} required />
                        </Field>
                        <Field label="Employee number" required error={errors.employee_number}>
                            <Input value={data.employee_number} onChange={(e) => setData('employee_number', e.target.value)} required />
                        </Field>
                        <Field label="Nickname" error={errors.nickname}>
                            <Input value={data.nickname} onChange={(e) => setData('nickname', e.target.value)} />
                        </Field>
                        <Field label="Gender" required error={errors.gender}>
                            <Select value={data.gender} onChange={(e) => setData('gender', e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </Select>
                        </Field>
                        <Field label="Birth place" error={errors.birth_place}>
                            <Input value={data.birth_place} onChange={(e) => setData('birth_place', e.target.value)} />
                        </Field>
                        <Field label="Birth date" error={errors.birth_date}>
                            <Input type="date" value={data.birth_date} onChange={(e) => setData('birth_date', e.target.value)} />
                        </Field>
                        <Field label="Religion" error={errors.religion}>
                            <Input value={data.religion} onChange={(e) => setData('religion', e.target.value)} />
                        </Field>
                        <Field label="Marital status" error={errors.marital_status}>
                            <Select value={data.marital_status} onChange={(e) => setData('marital_status', e.target.value)}>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="divorced">Divorced</option>
                            </Select>
                        </Field>
                        <Field label="Blood type" error={errors.blood_type}>
                            <Select value={data.blood_type} onChange={(e) => setData('blood_type', e.target.value)}>
                                <option value="">Unknown</option>
                                {['A', 'B', 'AB', 'O'].map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Employment" description="Role, placement and contract information." />
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
                        <Field label="Employee type" required error={errors.type}>
                            <Select value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                {types.map((type) => (
                                    <option key={type} value={type}>{titleCase(type)}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Position" error={errors.position}>
                            <Input value={data.position} onChange={(e) => setData('position', e.target.value)} placeholder="e.g. Mathematics Teacher" />
                        </Field>
                        <Field label="Department" error={errors.department}>
                            <Input value={data.department} onChange={(e) => setData('department', e.target.value)} />
                        </Field>
                        <Field label="Employment status" required error={errors.employment_status}>
                            <Select value={data.employment_status} onChange={(e) => setData('employment_status', e.target.value)}>
                                {employmentStatuses.map((status) => (
                                    <option key={status} value={status}>{titleCase(status)}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Join date" error={errors.join_date}>
                            <Input type="date" value={data.join_date} onChange={(e) => setData('join_date', e.target.value)} />
                        </Field>
                        <Field label="End date" error={errors.end_date} hint="Leave blank for active employees.">
                            <Input type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                        </Field>
                        <Field label="Education level" error={errors.education_level}>
                            <Input value={data.education_level} onChange={(e) => setData('education_level', e.target.value)} placeholder="S1 / S2 / D3" />
                        </Field>
                        <Field label="Major" error={errors.major}>
                            <Input value={data.major} onChange={(e) => setData('major', e.target.value)} />
                        </Field>
                        <Field label="Email" error={errors.email}>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        </Field>
                        <Field label="Phone" error={errors.phone}>
                            <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        </Field>
                        <Field label="Address" error={errors.address} className="sm:col-span-2 lg:col-span-3">
                            <Textarea rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                        </Field>
                        <Field label="Notes" error={errors.notes} className="sm:col-span-2 lg:col-span-3">
                            <Textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </Field>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Checkbox
                                label="Active employee"
                                description="Inactive employees keep their records but cannot receive new assignments."
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Photo" description="JPG, PNG or WebP up to 2 MB. Used on the profile and staff directory." />
                    <PhotoField
                        preview={preview}
                        initials={data.full_name ? data.full_name.slice(0, 2).toUpperCase() : 'EM'}
                        currentUrl={employee?.photo_url}
                        error={errors.photo}
                        progress={progress}
                        removePhoto={data.remove_photo}
                        onFile={(file) => {
                            setData((values) => ({ ...values, photo: file, remove_photo: false }));
                            if (file) setPreview(URL.createObjectURL(file));
                        }}
                        onToggleRemove={(checked) => {
                            setData('remove_photo', checked);
                            if (checked) setPreview(null);
                        }}
                    />
                </Card>

                <div className="flex items-center justify-end gap-2">
                    <Link href="/employees" className="btn-secondary">Cancel</Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Save changes' : 'Create employee'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

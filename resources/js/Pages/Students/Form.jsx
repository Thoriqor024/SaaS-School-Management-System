import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, Field, Input, PageHeader, PhotoField, Select, Textarea } from '../../Components/ui';

const toDate = (value) => (value ? String(value).slice(0, 10) : '');

export default function StudentForm({ student, schools, branches, gradeLevels, statuses }) {
    const isEdit = Boolean(student);
    const [preview, setPreview] = useState(student?.photo_url ?? null);

    const { data, setData, post, put, processing, errors, progress } = useForm({
        school_id: student?.school_id ?? schools[0]?.id ?? '',
        branch_id: student?.branch_id ?? '',
        nisn: student?.nisn ?? '',
        nis: student?.nis ?? '',
        full_name: student?.full_name ?? '',
        nickname: student?.nickname ?? '',
        gender: student?.gender ?? 'male',
        birth_place: student?.birth_place ?? '',
        birth_date: toDate(student?.birth_date),
        religion: student?.religion ?? '',
        blood_type: student?.blood_type ?? '',
        grade_level: student?.grade_level ?? '',
        classroom: student?.classroom ?? '',
        enrollment_year: student?.enrollment_year ?? String(new Date().getFullYear()),
        admission_date: toDate(student?.admission_date),
        status: student?.status ?? 'active',
        email: student?.email ?? '',
        phone: student?.phone ?? '',
        address: student?.address ?? '',
        guardian_name: student?.guardian_name ?? '',
        guardian_relation: student?.guardian_relation ?? 'father',
        guardian_phone: student?.guardian_phone ?? '',
        guardian_email: student?.guardian_email ?? '',
        guardian_occupation: student?.guardian_occupation ?? '',
        notes: student?.notes ?? '',
        photo: null,
        remove_photo: false,
    });

    const visibleBranches = useMemo(
        () => branches.filter((branch) => branch.school_id === data.school_id),
        [branches, data.school_id]
    );

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/students/${student.id}`);
        else post('/students');
    };

    return (
        <AppLayout title={isEdit ? 'Edit student' : 'Add student'}>
            <PageHeader
                title={isEdit ? `Edit ${student.full_name}` : 'Add a student'}
                description="This record becomes the central identity used by library, clinic, transport and your legacy systems."
            >
                <Link href={isEdit ? `/students/${student.id}` : '/students'} className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
            </PageHeader>

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader title="Identity" description="Core personal details as they appear on official documents." />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Full name" required error={errors.full_name} className="sm:col-span-2">
                            <Input value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} placeholder="Student's legal name" required />
                        </Field>
                        <Field label="Nickname" error={errors.nickname}>
                            <Input value={data.nickname} onChange={(e) => setData('nickname', e.target.value)} />
                        </Field>
                        <Field label="NISN" error={errors.nisn} hint="National student number, unique across the group.">
                            <Input value={data.nisn} onChange={(e) => setData('nisn', e.target.value)} placeholder="00xxxxxxxx" />
                        </Field>
                        <Field label="Local NIS" error={errors.nis}>
                            <Input value={data.nis} onChange={(e) => setData('nis', e.target.value)} />
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
                    <CardHeader title="School placement" description="Which institution and branch owns this student record." />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="School" required error={errors.school_id}>
                            <Select
                                value={data.school_id}
                                onChange={(e) => {
                                    setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }));
                                }}
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
                        <Field label="Status" required error={errors.status}>
                            <Select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {statuses.map((status) => (
                                    <option key={status} value={status} className="capitalize">{status}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Grade level" error={errors.grade_level}>
                            <Select value={data.grade_level} onChange={(e) => setData('grade_level', e.target.value)}>
                                <option value="">Not assigned</option>
                                {gradeLevels.map((grade) => (
                                    <option key={grade} value={grade}>Grade {grade}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Classroom" error={errors.classroom}>
                            <Input value={data.classroom} onChange={(e) => setData('classroom', e.target.value)} placeholder="e.g. 10A" />
                        </Field>
                        <Field label="Enrollment year" error={errors.enrollment_year}>
                            <Input value={data.enrollment_year} onChange={(e) => setData('enrollment_year', e.target.value)} placeholder="2026" />
                        </Field>
                        <Field label="Admission date" error={errors.admission_date}>
                            <Input type="date" value={data.admission_date} onChange={(e) => setData('admission_date', e.target.value)} />
                        </Field>
                        <Field label="Student email" error={errors.email}>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        </Field>
                        <Field label="Student phone" error={errors.phone}>
                            <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        </Field>
                        <Field label="Address" error={errors.address} className="sm:col-span-2 lg:col-span-3">
                            <Textarea value={data.address} onChange={(e) => setData('address', e.target.value)} rows={2} />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Guardian" description="Primary contact for clinic and transport coordination." />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Guardian name" error={errors.guardian_name}>
                            <Input value={data.guardian_name} onChange={(e) => setData('guardian_name', e.target.value)} />
                        </Field>
                        <Field label="Relation" error={errors.guardian_relation}>
                            <Select value={data.guardian_relation} onChange={(e) => setData('guardian_relation', e.target.value)}>
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="guardian">Guardian</option>
                            </Select>
                        </Field>
                        <Field label="Phone" error={errors.guardian_phone}>
                            <Input value={data.guardian_phone} onChange={(e) => setData('guardian_phone', e.target.value)} />
                        </Field>
                        <Field label="Email" error={errors.guardian_email}>
                            <Input type="email" value={data.guardian_email} onChange={(e) => setData('guardian_email', e.target.value)} />
                        </Field>
                        <Field label="Occupation" error={errors.guardian_occupation}>
                            <Input value={data.guardian_occupation} onChange={(e) => setData('guardian_occupation', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Photo" description="JPG, PNG or WebP up to 2 MB. Used on the profile and printed lists." />
                    <PhotoField
                        preview={preview}
                        initials={data.full_name ? data.full_name.slice(0, 2).toUpperCase() : 'ST'}
                        currentUrl={student?.photo_url}
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

                <Card>
                    <CardHeader title="Notes" description="Internal remarks only visible to staff with student access." />
                    <div className="p-4 sm:p-5">
                        <Field error={errors.notes}>
                            <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} />
                        </Field>
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-2">
                    <Link href="/students" className="btn-secondary">Cancel</Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Save changes' : 'Create student'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

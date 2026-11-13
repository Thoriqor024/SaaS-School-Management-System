import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, HeartPulse, Loader2, Save } from 'lucide-react';
import { useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../Components/ui';
import { nowLocalInput, titleCase } from '../../lib/format';

export default function VisitForm({ visit, students, employees, schools, branches, attendants, dispositions }) {
    const isEdit = Boolean(visit);

    const { data, setData, post, put, processing, errors } = useForm({
        school_id: visit?.school_id ?? schools[0]?.id ?? '',
        branch_id: visit?.branch_id ?? '',
        patient_type: visit?.patient_type ?? 'student',
        student_id: visit?.student_id ?? '',
        employee_id: visit?.employee_id ?? '',
        visit_date: visit?.visit_date ?? nowLocalInput(),
        complaint: visit?.complaint ?? '',
        temperature: visit?.temperature ?? '',
        blood_pressure: visit?.blood_pressure ?? '',
        pulse: visit?.pulse ?? '',
        weight: visit?.weight ?? '',
        height: visit?.height ?? '',
        diagnosis: visit?.diagnosis ?? '',
        treatment: visit?.treatment ?? '',
        disposition: visit?.disposition ?? 'returned_to_class',
        attended_by_employee_id: visit?.attended_by_employee_id ?? '',
        follow_up_date: visit?.follow_up_date ?? '',
        notes: visit?.notes ?? '',
    });

    const visibleBranches = useMemo(() => branches.filter((branch) => branch.school_id === data.school_id), [branches, data.school_id]);
    const patients = data.patient_type === 'student' ? students : employees;

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/clinic/visits/${visit.id}`);
        else post('/clinic/visits');
    };

    return (
        <AppLayout title={isEdit ? 'Edit visit' : 'New clinic visit'}>
            <PageHeader
                title={isEdit ? 'Edit clinic visit' : 'Record a clinic visit'}
                description="Vitals, diagnosis and treatment. Medicines can be dispensed from the visits list afterwards."
            >
                <Link href="/clinic/visits" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
            </PageHeader>

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader title="Patient & visit" />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Patient type" required error={errors.patient_type}>
                            <Select
                                value={data.patient_type}
                                onChange={(e) => setData((values) => ({ ...values, patient_type: e.target.value, student_id: '', employee_id: '' }))}
                            >
                                <option value="student">Student</option>
                                <option value="employee">Teacher / staff</option>
                            </Select>
                        </Field>
                        <Field
                            label={data.patient_type === 'student' ? 'Student' : 'Employee'}
                            required
                            error={errors.student_id ?? errors.employee_id}
                            className="sm:col-span-2"
                        >
                            <Select
                                value={data.patient_type === 'student' ? data.student_id : data.employee_id}
                                onChange={(e) => setData(data.patient_type === 'student' ? 'student_id' : 'employee_id', e.target.value)}
                                required
                            >
                                <option value="">Select patient</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.full_name} {patient.classroom ? `· ${patient.classroom}` : patient.position ? `· ${patient.position}` : ''}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Visit date & time" required error={errors.visit_date}>
                            <Input type="datetime-local" value={data.visit_date} onChange={(e) => setData('visit_date', e.target.value)} />
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
                        <Field label="Attended by" error={errors.attended_by_employee_id}>
                            <Select value={data.attended_by_employee_id} onChange={(e) => setData('attended_by_employee_id', e.target.value)}>
                                <option value="">Not recorded</option>
                                {attendants.map((attendant) => (
                                    <option key={attendant.id} value={attendant.id}>{attendant.full_name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Complaint" required error={errors.complaint} className="sm:col-span-2">
                            <Input value={data.complaint} onChange={(e) => setData('complaint', e.target.value)} placeholder="e.g. Headache and mild fever" required />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Vitals" description="Optional measurements recorded at intake." />
                    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-5">
                        <Field label="Temperature (°C)" error={errors.temperature}>
                            <Input type="number" step="0.1" min="30" max="45" value={data.temperature} onChange={(e) => setData('temperature', e.target.value)} />
                        </Field>
                        <Field label="Blood pressure" error={errors.blood_pressure}>
                            <Input value={data.blood_pressure} onChange={(e) => setData('blood_pressure', e.target.value)} placeholder="120/80" />
                        </Field>
                        <Field label="Pulse" error={errors.pulse}>
                            <Input type="number" value={data.pulse} onChange={(e) => setData('pulse', e.target.value)} />
                        </Field>
                        <Field label="Weight (kg)" error={errors.weight}>
                            <Input type="number" step="0.1" value={data.weight} onChange={(e) => setData('weight', e.target.value)} />
                        </Field>
                        <Field label="Height (cm)" error={errors.height}>
                            <Input type="number" step="0.1" value={data.height} onChange={(e) => setData('height', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Clinical notes" />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                        <Field label="Diagnosis" error={errors.diagnosis}>
                            <Textarea rows={2} value={data.diagnosis} onChange={(e) => setData('diagnosis', e.target.value)} />
                        </Field>
                        <Field label="Treatment given" error={errors.treatment}>
                            <Textarea rows={2} value={data.treatment} onChange={(e) => setData('treatment', e.target.value)} />
                        </Field>
                        <Field label="Disposition" required error={errors.disposition}>
                            <Select value={data.disposition} onChange={(e) => setData('disposition', e.target.value)}>
                                {dispositions.map((disposition) => (
                                    <option key={disposition} value={disposition}>{titleCase(disposition)}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Follow-up date" error={errors.follow_up_date}>
                            <Input type="date" value={data.follow_up_date ?? ''} onChange={(e) => setData('follow_up_date', e.target.value)} />
                        </Field>
                        <Field label="Internal notes" error={errors.notes} className="sm:col-span-2">
                            <Textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                {isEdit && visit.dispenses?.length > 0 && (
                    <Card>
                        <CardHeader title="Medicines already issued" description="Stock was deducted when each item was dispensed." />
                        <ul className="divide-y divide-slate-100">
                            {visit.dispenses.map((dispense) => (
                                <li key={dispense.id} className="flex items-center justify-between px-4 py-2.5 text-sm sm:px-5">
                                    <div className="flex items-center gap-2">
                                        <HeartPulse className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-700">{dispense.medicine}</span>
                                        <span className="text-xs text-slate-500">{dispense.quantity} {dispense.unit}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">{dispense.dosage}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                <div className="flex items-center justify-end gap-2">
                    <Link href="/clinic/visits" className="btn-secondary">Cancel</Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Save changes' : 'Record visit'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

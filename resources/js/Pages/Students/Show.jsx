import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookMarked,
    Bus,
    CalendarDays,
    HeartPulse,
    Mail,
    MapPin,
    Pencil,
    Phone,
    ShieldAlert,
    UserRound,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatDateTime, titleCase } from '../../lib/format';

export default function StudentShow({ student, visits, loans }) {
    const can = useCan();
    const record = student.medical_record;

    return (
        <AppLayout title={student.full_name}>
            <PageHeader title="Student profile" description="Central identity, guardians, transport and health summary.">
                <Link href="/students" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Students
                </Link>
                {can('students.manage') && (
                    <Link href={`/students/${student.id}/edit`} className="btn-primary">
                        <Pencil className="h-4 w-4" /> Edit
                    </Link>
                )}
            </PageHeader>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
                            {student.full_name?.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">{student.full_name}</h2>
                                <StatusBadge value={student.status} />
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {student.school?.name} · {student.branch?.name ?? 'No branch'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>NISN {student.nisn ?? '—'}</span>
                                <span>NIS {student.nis ?? '—'}</span>
                                <span>{student.grade_level ? `Grade ${student.grade_level}` : 'Grade —'} {student.classroom}</span>
                                <span>{student.age ? `${student.age} years old` : 'Age —'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 p-5 sm:grid-cols-2">
                        <Detail icon={UserRound} label="Gender" value={titleCase(student.gender)} />
                        <Detail icon={CalendarDays} label="Birth" value={`${student.birth_place ?? '—'}, ${formatDate(student.birth_date)}`} />
                        <Detail icon={ShieldAlert} label="Blood type" value={student.blood_type ?? '—'} />
                        <Detail icon={CalendarDays} label="Enrolled" value={`${student.enrollment_year ?? '—'} · admitted ${formatDate(student.admission_date)}`} />
                        <Detail icon={Phone} label="Phone" value={student.phone ?? '—'} />
                        <Detail icon={Mail} label="Email" value={student.email ?? '—'} />
                        <Detail icon={MapPin} label="Address" value={student.address ?? '—'} className="sm:col-span-2" />
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader title="Guardian" />
                        <div className="space-y-2.5 px-4 py-4 text-sm sm:px-5">
                            <p className="font-medium text-slate-800">{student.guardian_name ?? 'Not recorded'}</p>
                            <p className="text-xs text-slate-500">{titleCase(student.guardian_relation)}</p>
                            <p className="flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" />{student.guardian_phone ?? '—'}</p>
                            <p className="flex items-center gap-2 text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-400" />{student.guardian_email ?? '—'}</p>
                            <p className="text-xs text-slate-500">{student.guardian_occupation ?? ''}</p>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Transport" />
                        <div className="px-4 py-4 text-sm sm:px-5">
                            {student.route ? (
                                <div className="flex items-start gap-2.5">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                                        <Bus className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="font-medium text-slate-800">{student.route.name}</p>
                                        <p className="text-xs text-slate-500">{student.route.code}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">Not assigned to a school transport route.</p>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Medical alert" />
                        <div className="space-y-2 px-4 py-4 text-sm sm:px-5">
                            {record ? (
                                <>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Allergies</p>
                                    <p className="text-slate-700">{record.allergies || 'None recorded'}</p>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chronic conditions</p>
                                    <p className="text-slate-700">{record.chronic_conditions || 'None recorded'}</p>
                                    <p className="mt-2 text-[11px] text-slate-400">Last checkup {formatDate(record.last_checkup_at)}</p>
                                </>
                            ) : (
                                <p className="text-xs text-slate-500">No medical record yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader title="Recent clinic visits" description="Latest five visits across branches." />
                    {visits.length === 0 ? (
                        <EmptyState icon={HeartPulse} title="No clinic visits" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {visits.map((visit) => (
                                <li key={visit.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800">{visit.complaint}</p>
                                        <p className="text-xs text-slate-500">{visit.diagnosis || 'No diagnosis'}</p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(visit.visit_date)}</p>
                                    </div>
                                    <StatusBadge value={visit.disposition} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Library history" description="Borrowing records linked to this student." />
                    {loans.length === 0 ? (
                        <EmptyState icon={BookMarked} title="No loans recorded" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {loans.map((loan) => (
                                <li key={loan.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{loan.book}</p>
                                        <p className="text-xs text-slate-500">Borrowed {formatDate(loan.borrowed_at)} · due {formatDate(loan.due_at)}</p>
                                    </div>
                                    <StatusBadge value={loan.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {student.notes && (
                <Card className="mt-4">
                    <CardHeader title="Internal notes" />
                    <p className="whitespace-pre-line px-4 py-4 text-sm text-slate-600 sm:px-5">{student.notes}</p>
                </Card>
            )}
        </AppLayout>
    );
}

function Detail({ icon: Icon, label, value, className = '' }) {
    return (
        <div className={className}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Icon className="h-3 w-3" /> {label}
            </p>
            <p className="mt-1 text-sm text-slate-700">{value}</p>
        </div>
    );
}

import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Bus,
    CalendarDays,
    GraduationCap,
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

export default function EmployeeShow({ employee, visits, routes }) {
    const can = useCan();
    const record = employee.medical_record;

    return (
        <AppLayout title={employee.full_name}>
            <PageHeader title="Employee profile" description="HR master record, driving assignments and clinic history.">
                <Link href="/employees" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Employees
                </Link>
                {can('employees.manage') && (
                    <Link href={`/employees/${employee.id}/edit`} className="btn-primary">
                        <Pencil className="h-4 w-4" /> Edit
                    </Link>
                )}
            </PageHeader>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-brand-700 text-xl font-bold text-white">
                            {employee.full_name?.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">{employee.full_name}</h2>
                                <StatusBadge value={employee.type} />
                                <StatusBadge value={employee.employment_status} />
                                {!employee.is_active && <StatusBadge value="inactive" />}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {employee.position || 'No position'} · {employee.department || 'No department'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {employee.school?.name} · {employee.branch?.name ?? 'No branch'} · {employee.employee_number}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 p-5 sm:grid-cols-2">
                        <Detail icon={UserRound} label="Gender" value={titleCase(employee.gender)} />
                        <Detail icon={CalendarDays} label="Birth" value={`${employee.birth_place ?? '—'}, ${formatDate(employee.birth_date)}`} />
                        <Detail icon={ShieldAlert} label="Blood type" value={employee.blood_type ?? '—'} />
                        <Detail icon={GraduationCap} label="Education" value={`${employee.education_level ?? '—'} ${employee.major ? `· ${employee.major}` : ''}`} />
                        <Detail icon={Phone} label="Phone" value={employee.phone ?? '—'} />
                        <Detail icon={Mail} label="Email" value={employee.email ?? '—'} />
                        <Detail icon={CalendarDays} label="Joined" value={formatDate(employee.join_date)} />
                        <Detail icon={CalendarDays} label="Contract ends" value={formatDate(employee.end_date)} />
                        <Detail icon={MapPin} label="Address" value={employee.address ?? '—'} className="sm:col-span-2" />
                    </div>
                </Card>

                <div className="space-y-4">
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

                    <Card>
                        <CardHeader title="Driving assignments" />
                        <div className="px-4 py-4 text-sm sm:px-5">
                            {routes.length === 0 ? (
                                <p className="text-xs text-slate-500">Not assigned as a driver on any route.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {routes.map((route) => (
                                        <li key={route.id} className="flex items-center gap-2">
                                            <Bus className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="font-medium text-slate-800">{route.name}</p>
                                                <p className="text-[11px] text-slate-500">{route.code}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Card>

                    {employee.login_account && (
                        <Card>
                            <CardHeader title="Login account" />
                            <div className="px-4 py-4 text-sm sm:px-5">
                                <p className="font-medium text-slate-800">{employee.login_account.name}</p>
                                <p className="text-xs text-slate-500">{employee.login_account.email}</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <Card className="mt-4">
                <CardHeader title="Recent clinic visits" description="Latest five visits for this employee." />
                {visits.length === 0 ? (
                    <EmptyState icon={HeartPulse} title="No clinic visits" />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {visits.map((visit) => (
                            <li key={visit.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                                <div>

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

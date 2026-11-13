import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookMarked,
    Boxes,
    Bus,
    CalendarDays,
    ClipboardList,
    GraduationCap,
    HeartPulse,
    Package,
    Plus,
    Stethoscope,
    UsersRound,
    UtensilsCrossed,
} from 'lucide-react';
import AppLayout from '../Layouts/AppLayout';
import { Badge, Bar, Card, CardHeader, EmptyState, StatCard, StatusBadge } from '../Components/ui';
import { useCan } from '../lib/auth';
import { formatDate, formatDateTime, formatNumber } from '../lib/format';

export default function Dashboard({
    stats,
    schoolBreakdown,
    employeesByType,
    studentGender,
    recentVisits,
    recentLoans,
    lowStock,
    upcomingMenus,
    today,
    greeting,
}) {
    const can = useCan();
    const userName = usePage().props.auth?.user?.name?.split(' ')[0] ?? 'there';
    const maxStudents = Math.max(1, ...schoolBreakdown.map((school) => school.students));
    const totalEmployees = Math.max(1, stats.employees.total);
    const genderTotal = Math.max(1, studentGender.reduce((sum, item) => sum + item.value, 0));

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-5">
                <section className="card relative overflow-hidden p-5 sm:p-6">
                    <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-brand-100/70 blur-2xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(today)}
                            </p>
                            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                {greeting}, {userName}
                            </h1>
                            <p className="mt-1 max-w-xl text-sm text-slate-500">
                                Here is the consolidated picture of your schools, people and operations today.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {can('students.manage') && (
                                <Link href="/students/create" className="btn-primary">
                                    <Plus className="h-4 w-4" /> Student
                                </Link>
                            )}
                            {can('clinic.manage') && (
                                <Link href="/clinic/visits/create" className="btn-secondary">
                                    <Stethoscope className="h-4 w-4" /> Clinic visit
                                </Link>
                            )}
                            {can('library.manage') && (
                                <Link href="/library/loans" className="btn-secondary">
                                    <BookMarked className="h-4 w-4" /> Issue book
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        label="Students"
                        value={formatNumber(stats.students.total)}
                        hint={`${formatNumber(stats.students.active)} active · ${stats.students.new} new this year`}
                        icon={GraduationCap}
                        tone="indigo"
                        href={can('students.view') ? '/students' : undefined}
                    />
                    <StatCard
                        label="Employees"
                        value={formatNumber(stats.employees.total)}
                        hint={`${stats.employees.teachers} teachers · ${stats.employees.staff} staff · ${stats.employees.general} general`}
                        icon={UsersRound}
                        tone="sky"
                        href={can('employees.view') ? '/employees' : undefined}
                    />
                    <StatCard
                        label="Asset units"
                        value={formatNumber(stats.assets.units)}
                        hint={`${stats.assets.needs_attention} need attention · ${stats.assets.maintenance} in repair`}
                        icon={Boxes}
                        tone="amber"
                        href={can('assets.view') ? '/assets' : undefined}
                    />
                    <StatCard
                        label="Transport"
                        value={`${stats.transport.active_routes}/${stats.transport.routes}`}
                        hint={`${stats.transport.passengers} passengers · ${stats.transport.vehicles} vehicles`}
                        icon={Bus}
                        tone="teal"
                        href={can('transport.view') ? '/transport/routes' : undefined}
                    />
                    <StatCard
                        label="Clinic today"
                        value={formatNumber(stats.clinic.visits_today)}
                        hint={`${stats.clinic.visits_week} visits this week · ${stats.clinic.low_stock} low stock`}
                        icon={HeartPulse}
                        tone="rose"
                        href={can('clinic.view') ? '/clinic/visits' : undefined}
                    />
                    <StatCard
                        label="Library loans"
                        value={formatNumber(stats.library.active_loans)}
                        hint={`${stats.library.overdue} overdue · ${formatNumber(stats.library.copies)} copies`}
                        icon={BookMarked}
                        tone="violet"
                        href={can('library.view') ? '/library/loans' : undefined}
                    />
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader
                            title="Headcount by school"
                            description="Active global student and employee records, grouped by institution."
                            action={
                                can('reports.view') ? (
                                    <Link href="/reports" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                                        Full report
                                    </Link>
                                ) : null
                            }
                        />
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50/80">
                                    <tr>
                                        <th className="th">School</th>
                                        <th className="th">Branches</th>
                                        <th className="th">Students</th>
                                        <th className="th">Employees</th>
                                        <th className="th hidden sm:table-cell">Distribution</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {schoolBreakdown.map((school) => (
                                        <tr key={school.id} className="hover:bg-slate-50/60">
                                            <td className="td">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-bold text-brand-700">
                                                        {school.code}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-800">{school.name}</p>
                                                        <p className="text-[11px] text-slate-500">{school.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="td">{school.branches}</td>
                                            <td className="td font-semibold tabular-nums">{formatNumber(school.students)}</td>
                                            <td className="td tabular-nums">{formatNumber(school.employees)}</td>
                                            <td className="td hidden w-40 sm:table-cell">
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-brand-500"
                                                        style={{ width: `${Math.max(4, (school.students / maxStudents) * 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/70">
                                    <tr>
                                        <td className="td font-semibold text-slate-700">Group total</td>
                                        <td className="td">{schoolBreakdown.reduce((sum, s) => sum + s.branches, 0)}</td>
                                        <td className="td font-bold text-slate-900">{formatNumber(stats.students.total)}</td>
                                        <td className="td font-bold text-slate-900">{formatNumber(stats.employees.total)}</td>
                                        <td className="hidden sm:table-cell" />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader title="Workforce composition" />
                            <div className="space-y-3 px-4 py-4 sm:px-5">
                                {employeesByType.map((item) => (
                                    <Bar
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                        max={totalEmployees}
                                        tone={
                                            item.label === 'Teachers'
                                                ? 'bg-brand-500'
                                                : item.label === 'Staff'
                                                  ? 'bg-sky-500'
                                                  : 'bg-amber-500'
                                        }
                                    />
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <CardHeader title="Student gender split" />
                            <div className="px-4 py-4 sm:px-5">
                                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full bg-brand-500"
                                        style={{ width: `${(studentGender[0].value / genderTotal) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-rose-400"
                                        style={{ width: `${(studentGender[1].value / genderTotal) * 100}%` }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <span className="h-2 w-2 rounded-full bg-brand-500" /> Male{' '}
                                        <span className="font-semibold text-slate-800">{formatNumber(studentGender[0].value)}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <span className="h-2 w-2 rounded-full bg-rose-400" /> Female{' '}
                                        <span className="font-semibold text-slate-800">{formatNumber(studentGender[1].value)}</span>
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader
                            title="Recent clinic visits"
                            action={
                                can('clinic.view') ? (
                                    <Link href="/clinic/visits" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                                        All visits
                                    </Link>
                                ) : null
                            }
                        />
                        {recentVisits.length === 0 ? (
                            <EmptyState icon={HeartPulse} title="No visits recorded" />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {recentVisits.map((visit) => (
                                    <li key={visit.id} className="px-4 py-3 sm:px-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800">{visit.patient}</p>
                                                <p className="truncate text-xs text-slate-500">{visit.complaint}</p>
                                            </div>
                                            <StatusBadge value={visit.disposition} />
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(visit.visit_date)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <CardHeader
                            title="Library circulation"
                            action={
                                can('library.view') ? (
                                    <Link href="/library/loans" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                                        All loans
                                    </Link>
                                ) : null
                            }
                        />
                        {recentLoans.length === 0 ? (
                            <EmptyState icon={BookMarked} title="No loans yet" />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {recentLoans.map((loan) => (
                                    <li key={loan.id} className="px-4 py-3 sm:px-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800">{loan.book}</p>
                                                <p className="truncate text-xs text-slate-500">{loan.member}</p>
                                            </div>
                                            <StatusBadge value={loan.status} />
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">Due {formatDate(loan.due_at)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <CardHeader title="Stock alerts" description="Medicines and kitchen supplies at or below minimum." />
                        <div className="space-y-3 px-4 py-4 sm:px-5">
                            {lowStock.medicines.length === 0 && lowStock.cafeteria.length === 0 && (
                                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                    All inventory levels are healthy.
                                </p>
                            )}
                            {lowStock.medicines.map((medicine) => (
                                <div key={medicine.id} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{medicine.name}</p>
                                                                                <p className="text-[11px] text-slate-500">{medicine.stock} / min {medicine.min} {medicine.unit}</p>
                                        <p className="text-[10px] text-slate-400">{medicine.school}</p>
                                    </div>
                                    <Badge tone={medicine.stock <= 0 ? 'rose' : 'amber'}>
                                        {medicine.stock <= 0 ? 'Out' : 'Low'}
                                    </Badge>
                                </div>
                            ))}
                            {lowStock.cafeteria.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {item.stock} / min {item.min} {item.unit}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{item.school}</p>
                                    </div>
                                    <Badge tone="amber">Low</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader
                            title="Upcoming cafeteria menus"
                            description={`Today's meals served: ${formatNumber(stats.cafeteria.meals_today)} · ${stats.cafeteria.menus_week} menus planned this week`}
                            action={
                                can('cafeteria.view') ? (
                                    <Link href="/cafeteria/menus" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                                        Menu planner
                                    </Link>
                                ) : null
                            }
                        />
                        {upcomingMenus.length === 0 ? (
                            <EmptyState icon={UtensilsCrossed} title="No upcoming menus" />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {upcomingMenus.map((menu) => (
                                    <li key={menu.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800">{menu.title}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatDate(menu.date)} · {menu.meal_type} · {menu.school}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {menu.items.slice(0, 4).map((item) => (
                                                <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <CardHeader title="Today at a glance" />
                        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:px-5">
                            <MiniMetric
                                icon={UtensilsCrossed}
                                label="Meals served"
                                value={formatNumber(stats.cafeteria.meals_today)}
                            />
                            <MiniMetric icon={ClipboardList} label="Bus trips logged" value={formatNumber(stats.transport.trips_logged)} />
                            <MiniMetric icon={Package} label="Low kitchen stock" value={formatNumber(stats.cafeteria.low_stock)} />
                            <MiniMetric icon={HeartPulse} label="Clinic visits (7d)" value={formatNumber(stats.clinic.visits_week)} />
                        </div>
                        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                            <Link
                                href="/reports"
                                className="flex items-center justify-between text-xs font-semibold text-brand-700 hover:text-brand-800"
                            >
                                Open cross-module reports
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

function MiniMetric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-3">
            <Icon className="h-4 w-4 text-slate-400" />
            <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">{value}</p>
            <p className="text-[11px] leading-tight text-slate-500">{label}</p>
        </div>
    );
}

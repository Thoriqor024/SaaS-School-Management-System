import { router } from '@inertiajs/react';
import { BarChart3, BookOpen, Boxes, Bus, FileDown, FileText, GraduationCap, HeartPulse, Printer, UsersRound, UtensilsCrossed } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Bar, Card, CardHeader, PageHeader, Select } from '../../Components/ui';
import { formatDate, formatDateTime, formatNumber } from '../../lib/format';

export default function Reports({
    schools,
    filters,
    summary,
    schoolRows,
    byGrade,
    studentsBySchool,
    employeesByType,
    assetsByCondition,
    assetsByCategory,
    routeUtilization,
    libraryByCategory,
    clinicByDisposition,
    topComplaints,
    mealTrend,
    generatedAt,
}) {
    const maxGrade = Math.max(1, ...byGrade.map((item) => item.value));
    const maxMeal = Math.max(1, ...mealTrend.map((day) => Math.max(day.students, day.staff)));

    const changeSchool = (value) => {
        router.get('/reports', value ? { school_id: value } : {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout title="Reports">
            <PageHeader
                title="Cross-module reports"
                description="Headcount, inventory health, transport utilisation and service activity in one place."
            >
                <Select value={filters.school_id ?? ''} onChange={(event) => changeSchool(event.target.value)} className="no-print w-full sm:w-56">
                    <option value="">All schools</option>
                    {schools.map((school) => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                </Select>
                <a href={`/reports/export?format=csv${filters.school_id ? `&school_id=${filters.school_id}` : ''}`} className="btn-secondary no-print">
                    <FileDown className="h-4 w-4" /> CSV
                </a>
                <a href={`/reports/export?format=pdf${filters.school_id ? `&school_id=${filters.school_id}` : ''}`} className="btn-secondary no-print">
                    <FileText className="h-4 w-4" /> PDF
                </a>
                <button type="button" onClick={() => window.print()} className="btn-secondary no-print">
                    <Printer className="h-4 w-4" /> Print
                </button>
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Metric icon={GraduationCap} label="Active students" value={summary.students} tone="brand" />
                <Metric icon={UsersRound} label="Active employees" value={summary.employees} tone="sky" />
                <Metric icon={Boxes} label="Asset units" value={summary.asset_units} tone="amber" />
                <Metric icon={Bus} label="Active routes" value={summary.active_routes} hint={`${formatNumber(summary.passengers)} passengers`} tone="teal" />
                <Metric icon={BookOpen} label="Book copies" value={summary.book_copies} hint={`${summary.active_loans} on loan`} tone="violet" />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Clinic visits · 30 days</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.clinic_visits_30d)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Meals served · 30 days</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.meals_served_30d)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Report generated</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(generatedAt)}</p>
                    <p className="text-[11px] text-slate-500">Snapshot, refresh to update</p>
                </div>
            </div>

            <Card className="mb-4 overflow-hidden">
                <CardHeader title="School overview" description="Active headcount and operational footprint per institution." />
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="th">School</th>
                                <th className="th">Students</th>
                                <th className="th">Employees</th>
                                <th className="th">Asset units</th>
                                <th className="th">Active routes</th>
                                <th className="th">Book copies</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schoolRows.map((school) => (
                                <tr key={school.id} className="hover:bg-slate-50/60">
                                    <td className="td">
                                        <p className="font-medium text-slate-800">{school.name}</p>
                                        <p className="text-[11px] text-slate-500">{school.code}</p>
                                    </td>
                                    <td className="td tabular-nums">{formatNumber(school.students)}</td>
                                    <td className="td tabular-nums">{formatNumber(school.employees)}</td>
                                    <td className="td tabular-nums">{formatNumber(school.assets)}</td>
                                    <td className="td tabular-nums">{school.routes}</td>
                                    <td className="td tabular-nums">{formatNumber(school.books)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader title="Students by grade" />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {byGrade.map((item) => (
                            <Bar key={item.label} label={item.label} value={item.value} max={maxGrade} tone="bg-brand-500" />
                        ))}
                        {byGrade.length === 0 && <p className="text-xs text-slate-500">No student data.</p>}
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Students by school & gender" />
                    <div className="divide-y divide-slate-100">
                        {studentsBySchool.map((row) => (
                            <div key={row.school} className="px-4 py-3 sm:px-5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700">{row.school}</span>
                                    <span className="tabular-nums text-slate-500">{formatNumber(row.total)}</span>
                                </div>
                                <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full bg-brand-500" style={{ width: `${(row.male / Math.max(1, row.total)) * 100}%` }} />
                                    <div className="h-full bg-rose-400" style={{ width: `${(row.female / Math.max(1, row.total)) * 100}%` }} />
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {formatNumber(row.male)} male · {formatNumber(row.female)} female
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Workforce composition" />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {employeesByType.map((item) => (
                            <Bar
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                max={Math.max(1, ...employeesByType.map((entry) => entry.value))}
                                tone="bg-sky-500"
                            />
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Asset condition" description="Records and physical units by condition." />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {assetsByCondition.map((item) => (
                            <Bar
                                key={item.label}
                                label={`${item.label} · ${item.units} units`}
                                value={item.value}
                                max={Math.max(1, ...assetsByCondition.map((entry) => entry.value))}
                                tone={item.label === 'Broken' ? 'bg-rose-500' : item.label === 'Good' ? 'bg-emerald-500' : 'bg-amber-500'}
                            />
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Transport utilisation" description="Active passengers against vehicle capacity." />
                    <div className="divide-y divide-slate-100">
                        {routeUtilization.map((route) => (
                            <div key={route.code} className="px-4 py-3 sm:px-5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700">{route.route}</span>
                                    <span className="text-xs text-slate-500">{route.passengers}/{route.capacity || '—'}</span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full rounded-full ${route.utilization > 90 ? 'bg-rose-500' : 'bg-teal-500'}`}
                                        style={{ width: `${Math.min(100, route.utilization)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {routeUtilization.length === 0 && <p className="px-4 py-4 text-xs text-slate-500">No routes yet.</p>}
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Clinic dispositions & top complaints" />
                    <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                        <div className="space-y-2.5">
                            {clinicByDisposition.map((item) => (
                                <div key={item.label} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">{item.label}</span>
                                    <span className="font-semibold tabular-nums text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2.5">
                            {topComplaints.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-slate-600">{item.label}</span>
                                    <span className="font-semibold tabular-nums text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Cafeteria · meals last 7 days" />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {mealTrend.map((day) => (
                            <div key={day.date} className="grid grid-cols-[2.5rem_1fr] items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">{day.label}</span>
                                <div className="space-y-1">
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(day.students / maxMeal) * 100}%` }} />
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-sky-400" style={{ width: `${(day.staff / maxMeal) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <p className="text-[11px] text-slate-400">Green: students · blue: staff</p>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Library collection by category" />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {libraryByCategory.map((item) => (
                            <Bar
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                max={Math.max(1, ...libraryByCategory.map((entry) => entry.value))}
                                tone="bg-violet-500"
                            />
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Assets by category" />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {assetsByCategory.map((item) => (
                            <Bar
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                max={Math.max(1, ...assetsByCategory.map((entry) => entry.value))}
                                tone="bg-amber-500"
                            />
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader title="Module activity summary" />
                    <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
                        <Activity icon={HeartPulse} label="Clinic visits (30 days)" value={formatNumber(summary.clinic_visits_30d)} />
                        <Activity icon={BookOpen} label="Active library loans" value={formatNumber(summary.active_loans)} />
                        <Activity icon={Bus} label="Passengers on routes" value={formatNumber(summary.passengers)} />
                        <Activity icon={UtensilsCrossed} label="Meals (30 days)" value={formatNumber(summary.meals_served_30d)} />
                    </div>
                    <p className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400 sm:px-5">
                        Generated {formatDate(generatedAt)}. Fee collection and dormitory modules are intentionally excluded and
                        supplied by the legacy systems through the integration API.
                    </p>
                </Card>
            </div>
        </AppLayout>
    );
}

function Metric({ icon: Icon, label, value, hint, tone = 'brand' }) {
    const tones = {
        brand: 'bg-brand-50 text-brand-600',
        sky: 'bg-sky-50 text-sky-600',
        amber: 'bg-amber-50 text-amber-600',
        teal: 'bg-teal-50 text-teal-600',
        violet: 'bg-violet-50 text-violet-600',
    };

    return (
        <div className="card flex items-start gap-3 p-3.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-slate-900">{formatNumber(value)}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
                {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
            </div>
        </div>
    );
}

function Activity({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 text-slate-400" />
            <div>
                <p className="text-sm font-bold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}

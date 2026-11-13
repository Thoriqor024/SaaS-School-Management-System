import { Link } from '@inertiajs/react';
import { Bus, Clock, MapPin, Pencil, Plus, Route as RouteIcon, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Badge, Card, EmptyState, PageHeader, SearchInput, Select, confirmDelete } from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatNumber } from '../../lib/format';

export default function Routes({ routes, schools, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [schoolFilter, setSchoolFilter] = useState(filters.school_id ?? '');

    const filtered = routes.filter((route) => {
        const term = search.trim().toLowerCase();
        const matchesTerm = !term || route.name.toLowerCase().includes(term) || route.code.toLowerCase().includes(term);
        const matchesSchool = !schoolFilter || route.school_id === schoolFilter;
        return matchesTerm && matchesSchool;
    });

    return (
        <AppLayout title="Routes">
            <PageHeader
                title="Transport routes"
                description="Route plans with stops, assigned vehicle and driver. Passenger logs roll up per route."
            >
                {can('transport.view') && (
                    <Link href="/transport/logs" className="btn-secondary">
                        Daily logs
                    </Link>
                )}
                {can('transport.manage') && (
                    <Link href="/transport/routes/create" className="btn-primary">
                        <Plus className="h-4 w-4" /> Add route
                    </Link>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Routes" value={counts.routes} icon={RouteIcon} />
                <Tile label="Active routes" value={counts.active} icon={Bus} tone="emerald" />
                <Tile label="Passengers" value={counts.passengers} icon={Users} tone="sky" />
                <Tile label="Stops mapped" value={counts.stops} icon={MapPin} tone="amber" />
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <SearchInput value={search} onChange={setSearch} placeholder="Search route or code…" className="sm:max-w-xs" />
                <Select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className="sm:max-w-[14rem]">
                    <option value="">All schools</option>
                    {schools.map((school) => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                </Select>
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <EmptyState icon={RouteIcon} title="No routes found" description="Create a route with its stops to start assigning passengers." />
                </Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filtered.map((route) => {
                        const utilization = route.capacity ? Math.round((route.passengers_count / route.capacity) * 100) : 0;

                        return (
                            <Card key={route.id} className="flex flex-col">
                                <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-sm font-bold text-slate-900">{route.name}</h2>
                                            <Badge tone="indigo">{route.code}</Badge>
                                            {!route.is_active && <Badge tone="rose">Inactive</Badge>}
                                        </div>
                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                            <MapPin className="h-3 w-3" /> {route.start_point ?? '—'} → {route.end_point ?? '—'}
                                        </p>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {route.departure_time ?? '—'} / {route.return_time ?? '—'}
                                            </span>
                                            <span>{route.branch ?? 'No branch'}</span>
                                        </p>
                                    </div>
                                    {can('transport.manage') && (
                                        <div className="flex gap-1">
                                            <Link
                                                href={`/transport/routes/${route.id}/edit`}
                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => confirmDelete(`/transport/routes/${route.id}`, `Delete route ${route.name}?`)}
                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 border-y border-slate-100 bg-slate-50/60 px-4 py-3 text-xs sm:px-5">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Vehicle</p>
                                        <p className="font-medium text-slate-700">{route.vehicle ?? 'Not assigned'}</p>
                                        <p className="text-[11px] text-slate-500">{route.capacity ? `${route.capacity} seats` : ''}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Driver</p>
                                        <p className="font-medium text-slate-700">{route.driver ?? 'Not assigned'}</p>
                                        <p className="text-[11px] text-slate-500">{route.distance_km ? `${route.distance_km} km` : ''}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>{formatNumber(route.passengers_count)} passengers</span>
                                            <span>{utilization}% of capacity</span>
                                        </div>
                                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className={`h-full rounded-full ${utilization > 90 ? 'bg-rose-500' : 'bg-teal-500'}`}
                                                style={{ width: `${Math.min(100, utilization)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 px-4 py-3 sm:px-5">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Stops</p>
                                    <ol className="space-y-1.5">
                                        {route.stops.map((stop) => (
                                            <li key={stop.id} className="flex items-center gap-2 text-xs text-slate-600">
                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">
                                                    {stop.sequence}
                                                </span>
                                                <span className="flex-1 truncate">{stop.name}</span>
                                                <span className="text-[11px] text-slate-400">{stop.pickup_time ?? ''}</span>
                                            </li>
                                        ))}
                                        {route.stops.length === 0 && <li className="text-xs text-slate-400">No stops yet.</li>}
                                    </ol>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        sky: 'bg-sky-50 text-sky-600',
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

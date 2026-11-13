import { Link, router } from '@inertiajs/react';
import { Boxes, PackageSearch, Pencil, Plus, Tags, Trash2, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    DataTable,
    EmptyState,
    PageHeader,
    Pagination,
    SearchInput,
    Select,
    StatusBadge,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function AssetsIndex({ assets, categories, schools, filters, conditions, statuses, counts, byCategory }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (overrides = {}) => {
        router.get('/assets', { ...filters, search, ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((filters.search ?? '') !== search) apply({ search });
        }, 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const columns = [
        {
            key: 'name',
            label: 'Asset',
            render: (asset) => (
                <div>
                    <p className="font-medium text-slate-800">{asset.name}</p>
                    <p className="text-[11px] text-slate-500">{asset.asset_code} · {asset.category?.name ?? 'Uncategorised'}</p>
                </div>
            ),
        },
        {
            key: 'quantity',
            label: 'Quantity',
            render: (asset) => (
                <span className="font-semibold tabular-nums text-slate-800">
                    {formatNumber(asset.quantity)} <span className="text-[11px] font-normal text-slate-500">{asset.unit}</span>
                </span>
            ),
        },
        { key: 'condition', label: 'Condition', render: (asset) => <StatusBadge value={asset.condition} /> },
        { key: 'status', label: 'Status', render: (asset) => <StatusBadge value={asset.status} /> },
        {
            key: 'location',
            label: 'Location',
            render: (asset) => (
                <div>
                    <p className="text-slate-700">{asset.location ?? '—'}</p>
                    <p className="text-[11px] text-slate-500">{asset.branch?.name ?? 'No branch'}</p>
                </div>
            ),
        },
        { key: 'type', label: 'Type', render: (asset) => <Badge tone={asset.type === 'consumable' ? 'amber' : 'slate'}>{titleCase(asset.type)}</Badge> },
        {
            key: 'last_checked_at',
            label: 'Checked',
            render: (asset) => <span className="text-xs text-slate-500">{formatDate(asset.last_checked_at)}</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (asset) =>
                can('assets.manage') ? (
                    <div className="flex items-center justify-end gap-1">
                        <Link href={`/assets/${asset.id}/edit`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700" title="Edit">
                            <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/assets/${asset.id}`, `Delete ${asset.name}?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Assets">
            <PageHeader
                title="Asset & physical inventory"
                description="Track equipment, furniture and office supplies by branch, location and condition."
            >
                {can('assets.view') && (
                    <Link href="/assets/categories" className="btn-secondary">
                        <Tags className="h-4 w-4" /> Categories
                    </Link>
                )}
                {can('assets.manage') && (
                    <Link href="/assets/create" className="btn-primary">
                        <Plus className="h-4 w-4" /> Add asset
                    </Link>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile icon={Boxes} label="Asset records" value={formatNumber(counts.items)} hint={`${formatNumber(counts.units)} total units`} />
                <Tile icon={Wrench} label="Need attention" value={formatNumber(counts.damaged)} hint={`${counts.maintenance} in maintenance`} tone="rose" />
                <Tile icon={PackageSearch} label="Good condition" value={formatNumber(counts.good)} hint="Ready to use" tone="emerald" />
                <Tile icon={Tags} label="Categories" value={formatNumber(byCategory.length)} hint="Fixed and consumable" tone="sky" />
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <SearchInput value={search} onChange={setSearch} placeholder="Search name, code, location…" className="lg:col-span-2" />
                        <Select value={filters.asset_category_id ?? ''} onChange={(event) => apply({ asset_category_id: event.target.value })}>
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </Select>
                        <Select value={filters.condition ?? ''} onChange={(event) => apply({ condition: event.target.value })}>
                            <option value="">All conditions</option>
                            {conditions.map((condition) => (
                                <option key={condition} value={condition}>{titleCase(condition)}</option>
                            ))}
                        </Select>
                        <Select value={filters.status ?? ''} onChange={(event) => apply({ status: event.target.value })}>
                            <option value="">All statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>{titleCase(status)}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    rows={assets.data}
                    empty={<EmptyState icon={Boxes} title="No assets found" description="Add your first asset or adjust the filters." />}
                />

                <Pagination paginator={assets} />
            </Card>

            <Card className="mt-4">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Distribution by category</h2>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {byCategory.filter((category) => category.count > 0).map((category) => (
                        <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
                                <p className="text-[11px] text-slate-500">{formatNumber(category.units)} units</p>
                            </div>
                            <Badge tone="indigo">{category.count} records</Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </AppLayout>
    );
}

function Tile({ icon: Icon, label, value, hint, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        rose: 'bg-rose-50 text-rose-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        sky: 'bg-sky-50 text-sky-600',
    };

    return (
        <div className="card flex items-start gap-3 p-3.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-lg font-bold leading-tight text-slate-900">{value}</p>
                <p className="text-[11px] font-medium text-slate-600">{label}</p>
                <p className="text-[10px] text-slate-400">{hint}</p>
            </div>
        </div>
    );
}

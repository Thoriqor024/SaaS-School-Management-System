import { Link, router } from '@inertiajs/react';
import { BookOpen, Library, Pencil, Plus, ScanLine, Tags, Trash2 } from 'lucide-react';
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
import { formatNumber } from '../../lib/format';

export default function Books({ books, categories, schools, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (overrides = {}) => {
        router.get('/library/books', { ...filters, search, ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
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
            key: 'title',
            label: 'Title',
            render: (book) => (
                <div className="flex items-start gap-2.5">
                    <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded bg-gradient-to-b from-violet-100 to-violet-50 text-violet-500">
                        <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{book.title}</p>
                        <p className="truncate text-[11px] text-slate-500">{book.author ?? 'Unknown author'} · {book.published_year ?? '—'}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Category',
            render: (book) => (
                <div>
                    <p className="text-slate-700">{book.category?.name ?? 'Uncategorised'}</p>
                    <p className="text-[11px] text-slate-500">{book.language}</p>
                </div>
            ),
        },
        {
            key: 'barcode',
            label: 'Barcode',
            render: (book) => (
                <div className="flex items-center gap-1.5">
                    <ScanLine className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono text-[11px] text-slate-600">{book.barcode}</span>
                </div>
            ),
        },
        {
            key: 'shelf_location',
            label: 'Shelf',
            render: (book) => <span className="text-xs text-slate-600">{book.shelf_location ?? '—'}</span>,
        },
        {
            key: 'available_copies',
            label: 'Copies',
            render: (book) => (
                <div>
                    <p className="font-semibold tabular-nums text-slate-800">
                        {book.available_copies} <span className="text-[11px] font-normal text-slate-500">of {book.total_copies}</span>
                    </p>
                    <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${book.total_copies ? (book.available_copies / book.total_copies) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            ),
        },
        { key: 'active_loans_count', label: 'On loan', render: (book) => <Badge tone={book.active_loans_count > 0 ? 'amber' : 'slate'}>{book.active_loans_count}</Badge> },
        { key: 'branch', label: 'Branch', render: (book) => <span className="text-xs text-slate-600">{book.branch?.name ?? '—'}</span> },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (book) =>
                can('library.manage') ? (
                    <div className="flex items-center justify-end gap-1">
                        <Link href={`/library/books/${book.id}/edit`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700">
                            <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/library/books/${book.id}`, `Remove "${book.title}" from the catalog?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Library books">
            <PageHeader title="Book catalog" description="Every copy has a barcode so scanners and QR labels can be added without schema changes.">
                <Link href="/library/categories" className="btn-secondary">
                    <Tags className="h-4 w-4" /> Categories
                </Link>
                {can('library.manage') && (
                    <Link href="/library/books/create" className="btn-primary">
                        <Plus className="h-4 w-4" /> Add book
                    </Link>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Titles" value={counts.titles} icon={BookOpen} />
                <Tile label="Total copies" value={counts.copies} icon={Library} tone="violet" />
                <Tile label="Available now" value={counts.available} icon={BookOpen} tone="emerald" />
                <Tile label="On loan" value={counts.on_loan} icon={ScanLine} tone="amber" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search title, author, ISBN, barcode…" className="sm:max-w-sm" />
                    <Select value={filters.book_category_id ?? ''} onChange={(event) => apply({ book_category_id: event.target.value })} className="sm:max-w-xs">
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={books.data}
                    empty={<EmptyState icon={BookOpen} title="No books in the catalog" description="Add the first title to start lending." />}
                />

                <Pagination paginator={books} />
            </Card>
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        violet: 'bg-violet-50 text-violet-600',
        emerald: 'bg-emerald-50 text-emerald-600',
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

import { Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Boxes, ScanLine, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatusBadge } from '../../Components/ui';
import { formatNumber } from '../../lib/format';

export default function Scan({ code, books, assets, canManageBooks, canManageAssets }) {
    const [value, setValue] = useState(code ?? '');
    const input = useRef(null);

    useEffect(() => {
        input.current?.focus();
    }, []);

    const submit = (event) => {
        event.preventDefault();
        router.get('/library/scan', value ? { code: value.trim() } : {}, { preserveState: true, preserveScroll: true });
    };

    const hasResults = books.length > 0 || assets.length > 0;

    return (
        <AppLayout title="Scan & lookup">
            <PageHeader
                title="Scan &amp; lookup"
                description="Point a barcode scanner at the field, or type a book barcode / ISBN / asset code."
            >
                <Link href="/library/books" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Catalog
                </Link>
            </PageHeader>

            <Card>
                <form onSubmit={submit} className="flex flex-col gap-2 p-4 sm:flex-row sm:p-5">
                    <div className="relative flex-1">
                        <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={input}
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder="Scan or type a code, e.g. BK-3F9A2C1D"
                            className="input pl-9 font-mono text-sm"
                            autoComplete="off"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        <Search className="h-4 w-4" /> Look up
                    </button>
                </form>
            </Card>

            {code !== '' && !hasResults && (
                <Card className="mt-4">
                    <EmptyState
                        icon={ScanLine}
                        title={`No record matches “${code}”`}
                        description="Check the code, or search the catalog for the title."
                    />
                </Card>
            )}

            {books.length > 0 && (
                <Card className="mt-4 overflow-hidden">
                    <CardHeader title="Library books" description={`${books.length} match${books.length === 1 ? '' : 'es'} for ${code}`} />
                    <ul className="divide-y divide-slate-100">
                        {books.map((book) => (
                            <li key={book.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded bg-violet-50 text-violet-500">
                                        <BookOpen className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{book.title}</p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {book.author ?? 'Unknown author'} · {book.category ?? 'Uncategorised'} · {book.branch ?? 'No branch'}
                                        </p>
                                        <p className="font-mono text-[10px] text-slate-400">{book.barcode}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-11 sm:pl-0">
                                    <Badge tone={book.available_copies > 0 ? 'emerald' : 'rose'}>
                                        {formatNumber(book.available_copies)} / {formatNumber(book.total_copies)} available
                                    </Badge>
                                    <Link href={`/library/books/${book.id}/label`} className="btn-secondary btn-sm">
                                        Label
                                    </Link>
                                    {canManageBooks && (
                                        <Link href={`/library/books/${book.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {assets.length > 0 && (
                <Card className="mt-4 overflow-hidden">
                    <CardHeader title="Assets" description={`${assets.length} match${assets.length === 1 ? '' : 'es'} for ${code}`} />
                    <ul className="divide-y divide-slate-100">
                        {assets.map((asset) => (
                            <li key={asset.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded bg-amber-50 text-amber-600">
                                        <Boxes className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{asset.name}</p>
                                        <p className="truncate text-[11px] text-slate-500">
                                            {asset.category ?? 'Uncategorised'} · {asset.branch ?? 'No branch'} · {formatNumber(asset.quantity)} {asset.unit}
                                        </p>
                                        <p className="font-mono text-[10px] text-slate-400">{asset.asset_code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-11 sm:pl-0">
                                    <StatusBadge value={asset.condition} />
                                    <StatusBadge value={asset.status} />
                                    <Link href={`/assets/${asset.id}/label`} className="btn-secondary btn-sm">Label</Link>
                                    {canManageAssets && (
                                        <Link href={`/assets/${asset.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {code === '' && (
                <Card className="mt-4 p-5 text-xs leading-relaxed text-slate-500">
                    Tip: scanners usually append Enter, so the field submits automatically. Books use their barcode or ISBN;
                    assets use their asset code.
                </Card>
            )}
        </AppLayout>
    );
}

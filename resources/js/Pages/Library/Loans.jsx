import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, BookMarked, CheckCircle2, Loader2, Plus, ScanLine, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    DataTable,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    Pagination,
    SearchInput,
    Select,
    StatusBadge,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function Loans({ loans, books, members, filters, statuses, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [overdueOnly, setOverdueOnly] = useState(Boolean(filters.overdue));
    const [issuing, setIssuing] = useState(false);

    const apply = (overrides = {}) => {
        router.get(
            '/library/loans',
            { ...filters, search, status, overdue: overdueOnly ? 1 : '', ...overrides },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const columns = [
        {
            key: 'book',
            label: 'Book',
            render: (loan) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{loan.book}</p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                        <ScanLine className="h-3 w-3" /> {loan.barcode}
                    </p>
                </div>
            ),
        },
        {
            key: 'member',
            label: 'Member',
            render: (loan) => (
                <div>
                    <p className="text-slate-700">{loan.member}</p>
                    <p className="text-[11px] text-slate-500">{loan.member_code} · {loan.member_type}</p>
                </div>
            ),
        },
        { key: 'borrowed_at', label: 'Borrowed', render: (loan) => <span className="text-xs text-slate-600">{formatDate(loan.borrowed_at)}</span> },
        {
            key: 'due_at',
            label: 'Due',
            render: (loan) => (
                <span className={`text-xs ${loan.status === 'overdue' ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>
                    {formatDate(loan.due_at)}
                </span>
            ),
        },
        {
            key: 'returned_at',
            label: 'Returned',
            render: (loan) => <span className="text-xs text-slate-500">{loan.returned_at ? formatDate(loan.returned_at) : '—'}</span>,
        },
        { key: 'status', label: 'Status', render: (loan) => <StatusBadge value={loan.status} /> },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (loan) => (
                <div className="flex items-center justify-end gap-1">
                    {can('library.manage') && loan.status !== 'returned' && (
                        <button
                            type="button"
                            onClick={() => router.post(`/library/loans/${loan.id}/return`, {}, { preserveScroll: true })}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Return
                        </button>
                    )}
                    {can('library.manage') && (
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/library/loans/${loan.id}`, 'Delete this loan record?')}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout title="Loans">
            <PageHeader title="Borrowing & returns" description="Issue books, monitor due dates and return copies back to the shelf.">
                {can('library.manage') && (
                    <button type="button" onClick={() => setIssuing(true)} className="btn-primary">
                        <Plus className="h-4 w-4" /> Issue book
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Active loans" value={counts.active} icon={BookMarked} />
                <Tile label="Overdue" value={counts.overdue} icon={AlertTriangle} tone="rose" />
                <Tile label="Returned this month" value={counts.returned_this_month} icon={CheckCircle2} tone="emerald" />
                <Tile label="Total records" value={counts.total} icon={BookMarked} tone="violet" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search book, member, code…" className="sm:max-w-xs" />
                    <Select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            apply({ status: event.target.value });
                        }}
                        className="sm:max-w-[12rem]"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((item) => (
                            <option key={item} value={item}>{titleCase(item)}</option>
                        ))}
                    </Select>
                    <button
                        type="button"
                        onClick={() => {
                            setOverdueOnly(!overdueOnly);
                            apply({ overdue: !overdueOnly ? 1 : '' });
                        }}
                        className={`btn-sm inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                            overdueOnly ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-600'
                        }`}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" /> Overdue only
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    rows={loans.data}
                    empty={<EmptyState icon={BookMarked} title="No loans found" description="Issue a book to a member to start circulation." />}
                />

                <Pagination paginator={loans} />
            </Card>

            {issuing && <IssueModal books={books} members={members} onClose={() => setIssuing(false)} />}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        rose: 'bg-rose-50 text-rose-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
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

function IssueModal({ books, members, onClose }) {
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    const { data, setData, post, processing, errors } = useForm({
        book_id: '',
        library_member_id: '',
        borrowed_at: today,
        due_at: due,
        notes: '',
    });

    const selectedMember = useMemo(() => members.find((member) => member.id === data.library_member_id), [members, data.library_member_id]);

    const submit = (event) => {
        event.preventDefault();
        post('/library/loans', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Issue a book"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="issue-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookMarked className="h-4 w-4" />}
                        Issue book
                    </button>
                </div>
            }
        >
            <form id="issue-form" onSubmit={submit} className="space-y-4">
                <Field label="Book" required error={errors.book_id}>
                    <Select value={data.book_id} onChange={(e) => setData('book_id', e.target.value)} required>
                        <option value="">Select an available book</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.title} · {book.available_copies} available
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field
                    label="Member"
                    required
                    error={errors.library_member_id}
                    hint={selectedMember ? `${selectedMember.active_loans} of ${selectedMember.max_loans} concurrent loans used.` : undefined}
                >
                    <Select value={data.library_member_id} onChange={(e) => setData('library_member_id', e.target.value)} required>
                        <option value="">Select a member</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>{member.label}</option>
                        ))}
                    </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Borrowed" required error={errors.borrowed_at}>
                        <Input type="date" value={data.borrowed_at} onChange={(e) => setData('borrowed_at', e.target.value)} />
                    </Field>
                    <Field label="Due" required error={errors.due_at}>
                        <Input type="date" value={data.due_at} onChange={(e) => setData('due_at', e.target.value)} />
                    </Field>
                </div>
                <Field label="Notes" error={errors.notes}>
                    <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </Field>
                <Badge tone="violet">Tip: scan the book barcode at the circulation desk to pick the title quickly.</Badge>
            </form>
        </Modal>
    );
}

import { Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Inbox,
    Search,
    X,
} from 'lucide-react';
import { useEffect } from 'react';
import { cx, titleCase } from '../lib/format';

/* ------------------------------------------------------------------ layout */

export function Card({ className = '', children }) {
    return <div className={cx('card', className)}>{children}</div>;
}

export function CardHeader({ title, description, action }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export function PageHeader({ title, description, children }) {
    return (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
                {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

/* ------------------------------------------------------------------ badges */

const BADGE_TONES = {
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
};

const STAT_TONES = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    teal: 'bg-teal-50 text-teal-600 ring-teal-100',
};

export function Badge({ tone = 'slate', children, className = '' }) {
    return (
        <span className={cx('chip', BADGE_TONES[tone] ?? BADGE_TONES.slate, className)}>
            {children}
        </span>
    );
}

export function StatusBadge({ value }) {
    const tones = {
        active: 'emerald',
        inactive: 'slate',
        graduated: 'sky',
        transferred: 'amber',
        good: 'emerald',
        minor_damage: 'amber',
        major_damage: 'rose',
        broken: 'rose',
        in_use: 'emerald',
        in_storage: 'sky',
        maintenance: 'amber',
        retired: 'slate',
        borrowed: 'sky',
        returned: 'emerald',
        overdue: 'rose',
        lost: 'rose',
        picked_up: 'emerald',
        dropped_off: 'sky',
        absent: 'rose',
        late: 'amber',
        returned_to_class: 'emerald',
        sent_home: 'amber',
        referred_to_hospital: 'rose',
        observation: 'sky',
        suspended: 'rose',
        expired: 'rose',
        permanent: 'emerald',
        contract: 'sky',
        part_time: 'amber',
        intern: 'slate',
        teacher: 'indigo',
        staff: 'sky',
        general: 'amber',
    };

    return <Badge tone={tones[value] ?? 'slate'}>{titleCase(value)}</Badge>;
}

/* --------------------------------------------------------------- stat card */

export function StatCard({ label, value, hint, icon: Icon, tone = 'indigo', href }) {
    const body = (
        <div className="card h-full p-4 transition hover:shadow-lift">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                </div>
                {Icon && (
                    <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1', STAT_TONES[tone])}>
                        <Icon className="h-[18px] w-[18px]" />
                    </span>
                )}
            </div>
            {hint && <p className="mt-2 truncate text-xs text-slate-500">{hint}</p>}
        </div>
    );

    return href ? (
        <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
            {body}
        </Link>
    ) : (
        body
    );
}

/* -------------------------------------------------------------- data table */

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Icon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function DataTable({ columns, rows, empty, rowKey = 'id' }) {
    if (!rows || rows.length === 0) {
        return empty ?? <EmptyState />;
    }

    return (
        <div>
            <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                    <thead className="bg-slate-50/80">
                        <tr>
                            {columns.map((column, index) => (
                                <th key={column.key ?? index} scope="col" className={cx('th', column.headerClassName)}>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                            <tr key={row[rowKey]} className="transition hover:bg-slate-50/70">
                                {columns.map((column, index) => (
                                    <td key={column.key ?? index} className={cx('td', column.className)}>
                                        {column.render ? column.render(row) : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
                {rows.map((row) => (
                    <li key={row[rowKey]} className="px-4 py-3">
                        <dl className="space-y-1.5">
                            {columns
                                .filter((column) => !column.hideOnMobile)
                                .map((column, index) => (
                                    <div key={column.key ?? index} className="flex items-start justify-between gap-3">
                                        <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            {column.label}
                                        </dt>
                                        <dd className="min-w-0 text-right text-sm text-slate-700">
                                            {column.render ? column.render(row) : row[column.key]}
                                        </dd>
                                    </div>
                                ))}
                        </dl>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* -------------------------------------------------------------- pagination */

export function Pagination({ paginator }) {
    if (!paginator?.links || paginator.last_page <= 1) return null;

    const clean = (label) => label.replace('&laquo;', '«').replace('&raquo;', '»');

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{paginator.from ?? 0}</span>–
                <span className="font-semibold text-slate-700">{paginator.to ?? 0}</span> of{' '}
                <span className="font-semibold text-slate-700">{paginator.total}</span>
            </p>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
                {paginator.links.map((link, index) => {
                    const isPrevious = index === 0;
                    const isNext = index === paginator.links.length - 1;
                    const label = clean(link.label);

                    if (!link.url) {
                        return (
                            <span
                                key={index}
                                className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs text-slate-300"
                            >
                                {isPrevious ? <ChevronLeft className="h-4 w-4" /> : isNext ? <ChevronRight className="h-4 w-4" /> : label}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            className={cx(
                                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition',
                                link.active
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            )}
                        >
                            {isPrevious ? <ChevronLeft className="h-4 w-4" /> : isNext ? <ChevronRight className="h-4 w-4" /> : label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

/* ------------------------------------------------------------------- forms */

export function Field({ label, error, hint, required, children, className = '' }) {
    return (
        <div className={className}>
            {label && (
                <label className="label">
                    {label}
                    {required && <span className="ml-0.5 text-rose-500">*</span>}
                </label>
            )}
            {children}
            {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
            {!error && hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

export function Input({ className = '', ...props }) {
    return <input className={cx('input', className)} {...props} />;
}

export function Select({ className = '', children, ...props }) {
    return (
        <select className={cx('input pr-8', className)} {...props}>
            {children}
        </select>
    );
}

export function Textarea({ className = '', rows = 3, ...props }) {
    return <textarea rows={rows} className={cx('input', className)} {...props} />;
}

export function Checkbox({ label, description, className = '', ...props }) {
    return (
        <label className={cx('flex cursor-pointer items-start gap-2.5', className)}>
            <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...props}
            />
            <span>
                <span className="text-sm font-medium text-slate-700">{label}</span>
                {description && <span className="block text-xs text-slate-500">{description}</span>}
            </span>
        </label>
    );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
    return (
        <div className={cx('relative', className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="input pl-9"
            />
        </div>
    );
}

/* ------------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, description, children, footer, size = 'max-w-2xl' }) {
    useEffect(() => {
        if (!open) return undefined;

        const handler = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handler);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = previous;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                className={cx(
                    'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
                    size
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close dialog"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ misc */

export function Bar({ label, value, max, tone = 'bg-brand-500', suffix = '' }) {
    const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;

    return (
        <div>
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{label}</span>
                <span className="tabular-nums text-slate-500">
                    {value}
                    {suffix}
                </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={cx('h-full rounded-full transition-all', tone)} style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

export function Alert({ tone = 'amber', children }) {
    const tones = {
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        rose: 'border-rose-200 bg-rose-50 text-rose-900',
        brand: 'border-brand-200 bg-brand-50 text-brand-900',
    };

    return (
        <div className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', tones[tone])}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{children}</div>
        </div>
    );
}

export function confirmDelete(url, message = 'Delete this record? This action cannot be undone.') {
    if (typeof window !== 'undefined' && window.confirm(message)) {
        router.delete(url, { preserveScroll: true });
    }
}

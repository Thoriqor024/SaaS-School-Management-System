import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookMarked,
    BookOpen,
    Boxes,
    Building2,
    Bus,
    ChevronDown,
    ClipboardCheck,
    ClipboardList,
    Contact,
    GraduationCap,
    HeartPulse,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Pill,
    Plug,
    Route as RouteIcon,
    ShieldCheck,
    Stethoscope,
    Tags,
    Users,
    UsersRound,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cx, initials } from '../lib/format';

const NAV = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard.view', exact: true },
        ],
    },
    {
        label: 'Core database',
        items: [
            { label: 'Students', href: '/students', icon: GraduationCap, permission: 'students.view' },
            { label: 'Employees', href: '/employees', icon: UsersRound, permission: 'employees.view' },
            { label: 'Schools & branches', href: '/schools', icon: Building2, permission: 'schools.manage' },
            { label: 'Login accounts', href: '/access/users', icon: ShieldCheck, permission: 'users.manage' },
            { label: 'Roles & permissions', href: '/access/roles', icon: KeyRound, permission: 'users.manage' },
        ],
    },
    {
        label: 'Operations',
        items: [
            { label: 'Assets', href: '/assets', icon: Boxes, permission: 'assets.view' },
            { label: 'Fleet', href: '/transport/vehicles', icon: Bus, permission: 'transport.view' },
            { label: 'Routes', href: '/transport/routes', icon: RouteIcon, permission: 'transport.view' },
            { label: 'Passengers', href: '/transport/passengers', icon: Users, permission: 'transport.view' },
            { label: 'Passenger logs', href: '/transport/logs', icon: ClipboardList, permission: 'transport.view' },
            { label: 'Library books', href: '/library/books', icon: BookOpen, permission: 'library.view' },
            { label: 'Library members', href: '/library/members', icon: Contact, permission: 'library.view' },
            { label: 'Loans', href: '/library/loans', icon: BookMarked, permission: 'library.view' },
            { label: 'Book categories', href: '/library/categories', icon: Tags, permission: 'library.view' },
            { label: 'Clinic visits', href: '/clinic/visits', icon: Stethoscope, permission: 'clinic.view' },
            { label: 'Medical records', href: '/clinic/records', icon: HeartPulse, permission: 'clinic.view' },
            { label: 'Medicines', href: '/clinic/medicines', icon: Pill, permission: 'clinic.view' },
            { label: 'Cafeteria menus', href: '/cafeteria/menus', icon: UtensilsCrossed, permission: 'cafeteria.view' },
            { label: 'Kitchen inventory', href: '/cafeteria/inventory', icon: Package, permission: 'cafeteria.view' },
            { label: 'Meal logs', href: '/cafeteria/meal-logs', icon: ClipboardCheck, permission: 'cafeteria.view' },
        ],
    },
    {
        label: 'Insights',
        items: [
            { label: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
            { label: 'Integration', href: '/settings/integration', icon: Plug, permission: 'integrations.view' },
        ],
    },
];

export default function AppLayout({ title, children }) {
    const page = usePage();
    const { auth, flash, appName } = page.props;
    const user = auth?.user;
    const currentUrl = page.url.split('?')[0];

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const permissions = user?.permissions ?? [];
    const can = (permission) => permissions.includes(permission);

    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
    }, [page.url]);

    useEffect(() => {
        if (flash?.success) setToast({ type: 'success', message: flash.success });
        else if (flash?.error) setToast({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    const navGroups = NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => can(item.permission)),
    })).filter((group) => group.items.length > 0);

    const activeItem = navGroups.flatMap((group) => group.items).find((item) =>
        item.exact ? currentUrl === item.href : currentUrl === item.href || currentUrl.startsWith(item.href + '/')
    );

    const sidebar = (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-5 py-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/20">
                    <GraduationCap className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight text-slate-900">{appName ?? 'SiswaHub'}</p>
                    <p className="truncate text-[11px] text-slate-500">Core school database</p>
                </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            {group.label}
                        </p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = item.exact
                                    ? currentUrl === item.href
                                    : currentUrl === item.href || currentUrl.startsWith(item.href + '/');

                                return (
                                    <li key={item.href}>
                                        <Link href={item.href} className={cx('nav-link', active && 'nav-link-active')}>
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="border-t border-slate-200 p-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                        {user?.initials ?? 'U'}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">{user?.name}</p>
                        <p className="truncate text-[11px] text-slate-500">
                            {user?.roles?.[0]?.name ?? 'No role'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={title} />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
                {sidebar}
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative h-full w-72 max-w-[85%] bg-white shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {sidebar}
                    </aside>
                </div>
            )}

            <div className="flex min-h-screen flex-col lg:pl-64">
                <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                    <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{activeItem?.label ?? 'Dashboard'}</p>
                            <p className="hidden truncate text-[11px] text-slate-500 sm:block">
                                {user?.school?.name ?? 'All schools'} {user?.branch ? `· ${user.branch.name}` : ''}
                            </p>
                        </div>

                        {user?.is_super_admin && (
                            <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 sm:inline-flex">
                                Super admin
                            </span>
                        )}

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen((open) => !open)}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:bg-slate-50"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white">
                                    {user?.initials ?? 'U'}
                                </span>
                                <span className="hidden text-xs font-semibold text-slate-700 sm:block">{user?.name}</span>
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                    <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                        <div className="border-b border-slate-100 px-4 py-3">
                                            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                                            <p className="truncate text-xs text-slate-500">{user?.email}</p>
                                            <p className="mt-2 text-[11px] font-medium text-brand-700">
                                                {(user?.roles ?? []).map((role) => role.name).join(', ')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.post('/logout')}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <LogOut className="h-4 w-4 text-slate-400" />
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

                <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
                    <p className="text-center text-[11px] text-slate-400">
                        {appName ?? 'SiswaHub'} · Core student, staff &amp; operations database · Financial and dormitory
                        modules stay in your legacy systems.
                    </p>
                </footer>
            </div>

            {toast && (
                <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0">
                    <div
                        className={cx(
                            'flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg',
                            toast.type === 'error'
                                ? 'border-rose-200 bg-rose-50 text-rose-800'
                                : 'border-emerald-200 bg-white text-slate-800'
                        )}
                    >
                        <span
                            className={cx(
                                'mt-1 h-2 w-2 shrink-0 rounded-full',
                                toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
                            )}
                        />
                        <p className="flex-1 text-sm">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                            aria-label="Dismiss"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

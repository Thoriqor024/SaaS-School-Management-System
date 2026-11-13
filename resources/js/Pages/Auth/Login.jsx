import { Head, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    Bus,
    GraduationCap,
    HeartPulse,
    Library,
    Loader2,
    LockKeyhole,
    Mail,
    UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';

const DEMO_ACCOUNTS = [
    { label: 'Super admin', email: 'admin@siswahub.test', tone: 'bg-brand-600' },
    { label: 'School admin', email: 'principal@siswahub.test', tone: 'bg-emerald-600' },
    { label: 'HR manager', email: 'hr@siswahub.test', tone: 'bg-amber-500' },
    { label: 'Librarian', email: 'library@siswahub.test', tone: 'bg-sky-600' },
];

const MODULES = [
    { icon: GraduationCap, label: 'Global student & staff database' },
    { icon: Boxes, label: 'Assets across every branch' },
    { icon: Bus, label: 'Routes, fleet & passenger logs' },
    { icon: Library, label: 'Library circulation' },
    { icon: HeartPulse, label: 'Clinic visits & medicines' },
    { icon: UtensilsCrossed, label: 'Menus & meal logs' },
];

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: 'admin@siswahub.test',
        password: 'password',
        remember: true,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (event) => {
        event.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    const useDemo = (email) => {
        setData({ email, password: 'password', remember: true });
    };

    return (
        <>
            <Head title="Sign in" />
            <div className="flex min-h-screen bg-slate-50">
                <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 p-10 text-white lg:flex xl:p-14">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                                <GraduationCap className="h-6 w-6" />
                            </span>
                            <div>
                                <p className="text-lg font-bold tracking-tight">SiswaHub</p>
                                <p className="text-xs text-brand-100">Multi-school management platform</p>
                            </div>
                        </div>

                        <h1 className="mt-14 max-w-md text-4xl font-bold leading-tight tracking-tight">
                            One clean source of truth for every school and branch.
                        </h1>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100">
                            Centralise students, teachers, staff and employees, then run the operational modules your
                            legacy systems do not cover.
                        </p>

                        <ul className="mt-10 grid max-w-md grid-cols-1 gap-3 text-sm text-brand-50 sm:grid-cols-2">
                            {MODULES.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-2.5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-[13px] leading-tight">{label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-xs text-brand-200">
                        UUID-based records · Read-only API for finance &amp; dormitory integration
                    </p>
                </div>

                <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-1/2 xl:px-20">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                                <GraduationCap className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-base font-bold tracking-tight text-slate-900">SiswaHub</p>
                                <p className="text-xs text-slate-500">Core school database</p>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                        <p className="mt-1.5 text-sm text-slate-500">Sign in to manage your schools and branches.</p>

                        <form onSubmit={submit} className="mt-8 space-y-4">
                            <div>
                                <label htmlFor="email" className="label">Email address</label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="username"
                                        value={data.email}
                                        onChange={(event) => setData('email', event.target.value)}
                                        className="input pl-9"
                                        placeholder="you@school.sch.id"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="label">Password</label>
                                <div className="relative">
                                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(event) => setData('password', event.target.value)}
                                        className="input pl-9 pr-16"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((shown) => !shown)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs font-medium text-rose-600">{errors.password}</p>}
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(event) => setData('remember', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                                Keep me signed in
                            </label>

                            <button type="submit" disabled={processing} className="btn-primary w-full py-2.5">
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Sign in
                                {!processing && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </form>

                        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Every account uses the password <span className="font-mono font-semibold text-slate-700">password</span>.
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {DEMO_ACCOUNTS.map((account) => (
                                    <button
                                        key={account.email}
                                        type="button"
                                        onClick={() => useDemo(account.email)}
                                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
                                    >
                                        <span className={`h-2 w-2 rounded-full ${account.tone}`} />
                                        <span className="min-w-0">
                                            <span className="block text-[11px] font-semibold text-slate-700">{account.label}</span>
                                            <span className="block truncate text-[10px] text-slate-500">{account.email}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="mt-6 text-center text-[11px] text-slate-400">
                            Need another role? Try <span className="font-medium">clinic@</span>,{' '}
                            <span className="font-medium">transport@</span>, <span className="font-medium">cafeteria@</span>,{' '}
                            <span className="font-medium">assets@</span> or <span className="font-medium">teacher@</span>
                            siswahub.test
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

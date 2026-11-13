import { Plug, KeyRound, Braces, ShieldCheck, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, Badge, Card, CardHeader, PageHeader } from '../../Components/ui';

export default function Integration({ baseUrl, apiKeyConfigured, endpoints, sampleStudent, sampleEmployee }) {
    const [copied, setCopied] = useState(false);

    const curl = `curl -H "X-API-Key: $INTEGRATION_API_KEY" \\\n  ${baseUrl}/api/v1/students?per_page=25`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(curl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <AppLayout title="Integration">
            <PageHeader
                title="Integration readiness"
                description="This platform owns the core identity records. Finance and dormitory modules stay in your legacy systems and read this data through a read-only API."
            >
                <Badge tone={apiKeyConfigured ? 'emerald' : 'amber'}>
                    {apiKeyConfigured ? 'API key configured' : 'API key not set'}
                </Badge>
            </PageHeader>

            {!apiKeyConfigured && (
                <div className="mb-4">
                    <Alert tone="amber">
                        Set <span className="font-mono font-semibold">INTEGRATION_API_KEY</span> in the server environment (never in
                        source control) to activate the endpoints below. Until then they answer with HTTP 503.
                    </Alert>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader title="Read-only API endpoints" description={`Base URL: ${baseUrl}/api/v1`} />
                    <ul className="divide-y divide-slate-100">
                        {endpoints.map((endpoint) => (
                            <li key={endpoint.path} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <span className="mt-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                        {endpoint.method}
                                    </span>
                                    <span className="truncate font-mono text-xs text-slate-700">{endpoint.path}</span>
                                </div>
                                <span className="pl-10 text-[11px] text-slate-500 sm:max-w-[16rem] sm:pl-0 sm:text-right">
                                    {endpoint.description}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader title="Authentication" />
                        <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
                            <p className="flex items-center gap-2 text-slate-700">
                                <KeyRound className="h-4 w-4 text-slate-400" /> Header <span className="font-mono text-xs">X-API-Key</span>
                            </p>
                            <p className="text-xs text-slate-500">
                                Requests are validated with a constant-time comparison. Rotate the key in your secret manager and
                                redeploy.
                            </p>
                            <p className="flex items-center gap-2 text-xs text-slate-500">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Read-only: no write endpoints are exposed.
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Example request" />
                        <div className="px-4 py-4 sm:px-5">
                            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
{curl}
                            </pre>
                            <button type="button" onClick={copy} className="btn-secondary btn-sm mt-2">
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copied' : 'Copy command'}
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader
                        title="Student mapping contract"
                        description="UUID primary keys are stable across branches and safe to store in legacy tables."
                    />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
{JSON.stringify(sampleStudent ?? { message: 'Seed the database to see a sample student.' }, null, 2)}
                        </pre>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                            <Braces className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Store <span className="font-mono">students.id</span> as your foreign key. NISN is unique when present;
                            legacy numeric IDs can live in a future <span className="font-mono">external_id</span> column without
                            changing this contract.
                        </p>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Employee mapping contract" description="Teachers, staff and general employees share one table with a type discriminator." />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
{JSON.stringify(sampleEmployee ?? { message: 'Seed the database to see a sample employee.' }, null, 2)}
                        </pre>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                            <Plug className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Employee numbers are unique per group. Use <span className="font-mono">type</span> to distinguish
                            teachers from administrative and general staff.
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="mt-4">
                <CardHeader title="Data ownership boundary" description="What lives here and what stays in the legacy systems." />
                <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Owned by this platform</p>
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                            <li>• Student and guardian master data</li>
                            <li>• Teacher, staff and general employee records</li>
                            <li>• Assets, transport, library, clinic, cafeteria operations</li>
                            <li>• Login accounts and role-based access</li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Supplied by legacy systems</p>
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                            <li>• Fee collection, invoices and payments</li>
                            <li>• Accounting journals and payroll</li>
                            <li>• Dormitory room allocation</li>
                            <li>• Any financial reporting</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </AppLayout>
    );
}

import { Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { PageHeader } from '../../Components/ui';

export default function Label({ title, subtitle, lines, code, barcode, qr, backUrl, backLabel }) {
    return (
        <AppLayout title="Print label">
            <PageHeader title="Barcode & QR label" description="Print on a sticker sheet or scan the code with the lookup page.">
                <Link href={backUrl} className="btn-secondary no-print">
                    <ArrowLeft className="h-4 w-4" /> {backLabel}
                </Link>
                <button type="button" onClick={() => window.print()} className="btn-primary no-print">
                    <Printer className="h-4 w-4" /> Print
                </button>
            </PageHeader>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
                <div className="card bg-white p-5 text-center print:border-0 print:shadow-none">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">SiswaHub</p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-900">{title}</p>
                    <p className="truncate text-[11px] text-slate-500">{subtitle}</p>

                    <div className="mt-4 flex justify-center [&>svg]:h-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: barcode }} />

                    <p className="mt-1 font-mono text-[11px] tracking-wider text-slate-700">{code}</p>

                    {lines.length > 0 && (
                        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{lines.join(' · ')}</p>
                    )}

                    <div className="mt-4 flex items-center justify-center gap-3 border-t border-dashed border-slate-200 pt-4">
                        <div className="h-[110px] w-[110px] shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
                        <p className="max-w-[8rem] text-left text-[10px] leading-relaxed text-slate-500">
                            Scan with the library or asset scanner, or type the code into the lookup page.
                        </p>
                    </div>
                </div>

                <div className="card p-5 text-sm text-slate-600 no-print">
                    <h2 className="text-sm font-semibold text-slate-900">How to use these labels</h2>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed">
                        <li>• Code 128 barcode and QR both encode <span className="font-mono text-slate-800">{code}</span>, so any USB scanner works.</li>
                        <li>• Open <Link href="/library/scan" className="font-medium text-brand-700 underline">Scan &amp; lookup</Link> and scan into the search box to jump straight to the record.</li>
                        <li>• The same code is searchable from the {backLabel.toLowerCase()} list.</li>
                        <li>• Printing uses the browser dialog; choose “Save as PDF” for a digital copy.</li>
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}

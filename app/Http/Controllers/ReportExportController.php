<?php

namespace App\Http\Controllers;

use App\Support\ReportData;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function __invoke(Request $request): Response|StreamedResponse
    {
        $validated = $request->validate([
            'format' => ['nullable', 'in:csv,pdf'],
            'school_id' => ['nullable', 'uuid'],
        ]);

        $data = ReportData::build($request->user(), $validated['school_id'] ?? null);
        $stamp = now()->format('Ymd-His');
        $format = $validated['format'] ?? 'csv';

        if ($format === 'pdf') {
            return Pdf::loadView('reports.pdf', $data)
                ->setPaper('a4')
                ->download("siswahub-report-{$stamp}.pdf");
        }

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel opens it correctly.

            fputcsv($out, ['SiswaHub cross-module report']);
            fputcsv($out, ['Generated', $data['generatedAt']]);
            fputcsv($out, ['Scope', $data['context']['school'] ?? 'All schools']);
            fputcsv($out, []);

            fputcsv($out, ['Summary metric', 'Value']);
            foreach ($data['summary'] as $key => $value) {
                fputcsv($out, [ucwords(str_replace('_', ' ', $key)), $value]);
            }
            fputcsv($out, []);

            fputcsv($out, ['School', 'Code', 'Active students', 'Active employees', 'Asset units', 'Active routes', 'Book copies']);
            foreach ($data['schoolRows'] as $row) {
                fputcsv($out, [$row['name'], $row['code'], $row['students'], $row['employees'], $row['assets'], $row['routes'], $row['books']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Students by grade', 'Total']);
            foreach ($data['byGrade'] as $row) {
                fputcsv($out, [$row['label'], $row['value']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Employees by type', 'Total']);
            foreach ($data['employeesByType'] as $row) {
                fputcsv($out, [$row['label'], $row['value']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Route', 'Code', 'Passengers', 'Vehicle capacity', 'Utilisation %']);
            foreach ($data['routeUtilization'] as $row) {
                fputcsv($out, [$row['route'], $row['code'], $row['passengers'], $row['capacity'], $row['utilization']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Clinic disposition', 'Visits']);
            foreach ($data['clinicByDisposition'] as $row) {
                fputcsv($out, [$row['label'], $row['value']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Top clinic complaints', 'Visits']);
            foreach ($data['topComplaints'] as $row) {
                fputcsv($out, [$row['label'], $row['value']]);
            }

            fclose($out);
        }, "siswahub-report-{$stamp}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}

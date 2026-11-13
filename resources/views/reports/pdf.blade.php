<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SiswaHub report</title>
    <style>
        @page { margin: 28px 32px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1e293b; }
        h1 { font-size: 16px; margin: 0 0 2px; }
        .muted { color: #64748b; font-size: 9px; }
        .header { border-bottom: 2px solid #4338ca; padding-bottom: 8px; margin-bottom: 14px; }
        .cards { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-bottom: 14px; }
        .cards td { width: 20%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #f8fafc; }
        .cards .value { font-size: 15px; font-weight: bold; color: #0f172a; }
        .cards .label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        h2 { font-size: 11px; margin: 16px 0 6px; color: #0f172a; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th { background: #eef2ff; color: #3730a3; font-size: 9px; text-align: left; padding: 5px 6px; border-bottom: 1px solid #c7d2fe; }
        table.data td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; }
        table.data td.num, table.data th.num { text-align: right; }
        .two { width: 100%; border-collapse: collapse; }
        .two td { width: 50%; vertical-align: top; padding: 0 8px 0 0; }
        .foot { margin-top: 16px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SiswaHub · Cross-module report</h1>
        <p class="muted">
            Scope: {{ $context['school'] ?? 'All schools' }} · Generated {{ \Illuminate\Support\Carbon::parse($generatedAt)->format('d M Y H:i') }}
            · Financial and dormitory data stay in the legacy systems.
        </p>
    </div>

    <table class="cards">
        <tr>
            <td><div class="value">{{ number_format($summary['students']) }}</div><div class="label">Active students</div></td>
            <td><div class="value">{{ number_format($summary['employees']) }}</div><div class="label">Active employees</div></td>
            <td><div class="value">{{ number_format($summary['asset_units']) }}</div><div class="label">Asset units</div></td>
            <td><div class="value">{{ number_format($summary['active_routes']) }}</div><div class="label">Active routes</div></td>
            <td><div class="value">{{ number_format($summary['book_copies']) }}</div><div class="label">Book copies</div></td>
        </tr>
    </table>

    <h2>School overview</h2>
    <table class="data">
        <thead>
            <tr>
                <th>School</th>
                <th class="num">Students</th>
                <th class="num">Employees</th>
                <th class="num">Asset units</th>
                <th class="num">Active routes</th>
                <th class="num">Book copies</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($schoolRows as $row)
                <tr>
                    <td>{{ $row['name'] }} <span class="muted">({{ $row['code'] }})</span></td>
                    <td class="num">{{ number_format($row['students']) }}</td>
                    <td class="num">{{ number_format($row['employees']) }}</td>
                    <td class="num">{{ number_format($row['assets']) }}</td>
                    <td class="num">{{ $row['routes'] }}</td>
                    <td class="num">{{ number_format($row['books']) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="two">
        <tr>
            <td>
                <h2>Students by grade</h2>
                <table class="data">
                    <tbody>
                        @foreach ($byGrade as $row)
                            <tr><td>{{ $row['label'] }}</td><td class="num">{{ number_format($row['value']) }}</td></tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
            <td>
                <h2>Employees by type</h2>
                <table class="data">
                    <tbody>
                        @foreach ($employeesByType as $row)
                            <tr><td>{{ $row['label'] }}</td><td class="num">{{ number_format($row['value']) }}</td></tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <h2>Transport utilisation</h2>
    <table class="data">
        <thead>
            <tr><th>Route</th><th>Code</th><th class="num">Passengers</th><th class="num">Capacity</th><th class="num">Utilisation</th></tr>
        </thead>
        <tbody>
            @forelse ($routeUtilization as $row)
                <tr>
                    <td>{{ $row['route'] }}</td>
                    <td>{{ $row['code'] }}</td>
                    <td class="num">{{ $row['passengers'] }}</td>
                    <td class="num">{{ $row['capacity'] ?: '—' }}</td>
                    <td class="num">{{ $row['utilization'] }}%</td>
                </tr>
            @empty
                <tr><td colspan="5" class="muted">No routes recorded.</td></tr>
            @endforelse
        </tbody>
    </table>

    <table class="two">
        <tr>
            <td>
                <h2>Clinic dispositions</h2>
                <table class="data">
                    <tbody>
                        @foreach ($clinicByDisposition as $row)
                            <tr><td>{{ $row['label'] }}</td><td class="num">{{ number_format($row['value']) }}</td></tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
            <td>
                <h2>Top clinic complaints</h2>
                <table class="data">
                    <tbody>
                        @foreach ($topComplaints as $row)
                            <tr><td>{{ $row['label'] }}</td><td class="num">{{ number_format($row['value']) }}</td></tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <div class="foot">
        Active loans: {{ number_format($summary['active_loans']) }} ·
        Library members: {{ number_format($context['library_members']) }} ·
        Low-stock kitchen items: {{ number_format($context['low_stock_items']) }} ·
        Clinic visits (30d): {{ number_format($summary['clinic_visits_30d']) }} ·
        Meals served (30d): {{ number_format($summary['meals_served_30d']) }}
    </div>
</body>
</html>

<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $student = Student::query()->visibleTo($request->user())->first();
        $employee = Employee::query()->visibleTo($request->user())->first();

        return Inertia::render('Settings/Integration', [
            'baseUrl' => rtrim($request->root(), '/'),
            'apiKeyConfigured' => filled(config('services.integration.key')),
            'endpoints' => [
                ['method' => 'GET', 'path' => '/api/v1/schools', 'description' => 'All schools with their branches.'],
                ['method' => 'GET', 'path' => '/api/v1/students', 'description' => 'Paginated students. Filters: school_id, branch_id, status, updated_since.'],
                ['method' => 'GET', 'path' => '/api/v1/students/{uuid}', 'description' => 'Single student record for legacy system mapping.'],
                ['method' => 'GET', 'path' => '/api/v1/employees', 'description' => 'Paginated teachers, staff and general employees.'],
                ['method' => 'GET', 'path' => '/api/v1/assets', 'description' => 'Inventory snapshot with condition and location.'],
                ['method' => 'GET', 'path' => '/api/v1/transport/routes', 'description' => 'Routes with vehicle, driver and stops.'],
                ['method' => 'GET', 'path' => '/api/v1/library/loans', 'description' => 'Active and historical loans for reconciliation.'],
                ['method' => 'GET', 'path' => '/api/v1/clinic/visits', 'description' => 'Clinic visit log.'],
                ['method' => 'GET', 'path' => '/api/v1/dashboard/summary', 'description' => 'Headcount and operational summary counts.'],
            ],
            'studentFields' => $student ? array_keys($student->getAttributes()) : array_values(array_map(fn ($column) => $column['name'], Schema::getColumns('students'))),
            'employeeFields' => $employee ? array_keys($employee->getAttributes()) : array_values(array_map(fn ($column) => $column['name'], Schema::getColumns('employees'))),
            'sampleStudent' => $student ? [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'full_name' => $student->full_name,
                'school_id' => $student->school_id,
                'branch_id' => $student->branch_id,
                'grade_level' => $student->grade_level,
                'status' => $student->status,
                'external_id' => null,
            ] : null,
            'sampleEmployee' => $employee ? [
                'id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'full_name' => $employee->full_name,
                'type' => $employee->type,
                'school_id' => $employee->school_id,
                'branch_id' => $employee->branch_id,
                'external_id' => null,
            ] : null,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\BookLoan;
use App\Models\Branch;
use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\School;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Support\EmployeeRules;
use App\Support\Media;
use App\Support\StudentRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IntegrationApiController extends Controller
{
    public function schools(): JsonResponse
    {
        return response()->json([
            'data' => School::query()->with('branches:id,school_id,name,code,city,is_active')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'npsn', 'level', 'city', 'province', 'is_active']),
        ]);
    }

    public function students(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'school_id' => ['nullable', 'uuid'],
            'branch_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'string'],
            'updated_since' => ['nullable', 'date'],
        ]);

        $students = Student::query()
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->input('updated_since'), fn ($q, $v) => $q->where('updated_at', '>=', $v))
            ->orderBy('full_name')
            ->paginate($request->integer('per_page', 50))
            ->through(fn (Student $student) => $this->studentPayload($student));

        return response()->json($students);
    }

    public function student(Student $student): JsonResponse
    {
        return response()->json([
            'data' => [
                ...$this->studentPayload($student),
                'guardian' => [
                    'name' => $student->guardian_name,
                    'relation' => $student->guardian_relation,
                    'phone' => $student->guardian_phone,
                    'email' => $student->guardian_email,
                ],
                'medical_record' => $student->medicalRecord?->only(['blood_type', 'allergies', 'chronic_conditions']),
            ],
        ]);
    }

    public function employees(Request $request): JsonResponse
    {
        $employees = Employee::query()
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('type'), fn ($q, $v) => $q->where('type', $v))
            ->when($request->input('updated_since'), fn ($q, $v) => $q->where('updated_at', '>=', $v))
            ->orderBy('full_name')
            ->paginate($request->integer('per_page', 50))
            ->through(fn (Employee $employee) => [
                'id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'full_name' => $employee->full_name,
                'type' => $employee->type,
                'position' => $employee->position,
                'department' => $employee->department,
                'school_id' => $employee->school_id,
                'branch_id' => $employee->branch_id,
                'is_active' => $employee->is_active,
                'updated_at' => $employee->updated_at?->toIso8601String(),
            ]);

        return response()->json($employees);
    }

    public function assets(Request $request): JsonResponse
    {
        $assets = Asset::query()
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->with('category:id,name')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 50))
            ->through(fn (Asset $asset) => [
                'id' => $asset->id,
                'asset_code' => $asset->asset_code,
                'name' => $asset->name,
                'category' => $asset->category?->name,
                'quantity' => $asset->quantity,
                'unit' => $asset->unit,
                'condition' => $asset->condition,
                'status' => $asset->status,
                'location' => $asset->location,
                'school_id' => $asset->school_id,
                'branch_id' => $asset->branch_id,
                'updated_at' => $asset->updated_at?->toIso8601String(),
            ]);

        return response()->json($assets);
    }

    public function routes(): JsonResponse
    {
        $routes = TransportRoute::query()
            ->with(['vehicle:id,plate_number,capacity', 'driver:id,full_name', 'stops:id,transport_route_id,name,sequence,pickup_time'])
            ->withCount(['passengers' => fn ($q) => $q->where('is_active', true)])
            ->orderBy('name')
            ->get()
            ->map(fn (TransportRoute $route) => [
                'id' => $route->id,
                'code' => $route->code,
                'name' => $route->name,
                'school_id' => $route->school_id,
                'branch_id' => $route->branch_id,
                'vehicle' => $route->vehicle?->plate_number,
                'capacity' => $route->vehicle?->capacity,
                'driver' => $route->driver?->full_name,
                'passengers' => $route->passengers_count,
                'is_active' => $route->is_active,
                'stops' => $route->stops,
            ]);

        return response()->json(['data' => $routes]);
    }

    public function loans(Request $request): JsonResponse
    {
        $loans = BookLoan::query()
            ->with(['book:id,title,barcode', 'member:id,member_code,member_type,student_id,employee_id'])
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->latest('borrowed_at')
            ->paginate($request->integer('per_page', 50))
            ->through(fn (BookLoan $loan) => [
                'id' => $loan->id,
                'book' => $loan->book?->title,
                'barcode' => $loan->book?->barcode,
                'member_code' => $loan->member?->member_code,
                'borrowed_at' => $loan->borrowed_at?->toDateString(),
                'due_at' => $loan->due_at?->toDateString(),
                'returned_at' => $loan->returned_at?->toDateString(),
                'status' => $loan->status,
            ]);

        return response()->json($loans);
    }

    public function visits(Request $request): JsonResponse
    {
        $visits = ClinicVisit::query()
            ->with(['student:id,full_name', 'employee:id,full_name'])
            ->when($request->input('from'), fn ($q, $v) => $q->where('visit_date', '>=', $v))
            ->latest('visit_date')
            ->paginate($request->integer('per_page', 50))
            ->through(fn (ClinicVisit $visit) => [
                'id' => $visit->id,
                'patient_id' => $visit->student_id ?? $visit->employee_id,
                'patient_type' => $visit->patient_type,
                'patient_name' => $visit->displayName(),
                'visit_date' => $visit->visit_date?->toIso8601String(),
                'complaint' => $visit->complaint,
                'disposition' => $visit->disposition,
            ]);

        return response()->json($visits);
    }

    public function summary(): JsonResponse
    {
        return response()->json([
            'data' => [
                'schools' => School::count(),
                'branches' => Branch::count(),
                'students' => [
                    'total' => Student::count(),
                    'active' => Student::where('status', 'active')->count(),
                ],
                'employees' => [
                    'total' => Employee::count(),
                    'teachers' => Employee::where('type', 'teacher')->count(),
                    'active' => Employee::where('is_active', true)->count(),
                ],
                'active_transport_routes' => TransportRoute::where('is_active', true)->count(),
                'assets' => Asset::count(),
                'active_library_loans' => BookLoan::whereIn('status', ['borrowed', 'overdue'])->count(),
                'clinic_visits_30d' => ClinicVisit::where('visit_date', '>=', now()->subDays(30))->count(),
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function storeStudent(Request $request): JsonResponse
    {
        $data = Validator::make($request->all(), StudentRules::rules())->validate();

        $student = Student::create($this->writable($request, $data, 'photos/students', null));

        return response()->json(['data' => $this->studentPayload($student)], 201);
    }

    public function updateStudent(Request $request, Student $student): JsonResponse
    {
        $existing = collect($student->getAttributes())->only(array_keys(StudentRules::rules($student)))->all();
        $data = Validator::make([...$existing, ...$request->all()], StudentRules::rules($student))->validate();

        $student->update($this->writable($request, $data, 'photos/students', $student->photo_path));

        return response()->json(['data' => $this->studentPayload($student->refresh())]);
    }

    public function destroyStudent(Student $student): JsonResponse
    {
        $student->delete();

        return response()->json(null, 204);
    }

    public function storeEmployee(Request $request): JsonResponse
    {
        $data = Validator::make($request->all(), EmployeeRules::rules())->validate();

        $employee = Employee::create($this->writable($request, $data, 'photos/employees', null));

        return response()->json(['data' => $this->employeePayload($employee)], 201);
    }

    public function updateEmployee(Request $request, Employee $employee): JsonResponse
    {
        $existing = collect($employee->getAttributes())->only(array_keys(EmployeeRules::rules($employee)))->all();
        $data = Validator::make([...$existing, ...$request->all()], EmployeeRules::rules($employee))->validate();

        $employee->update($this->writable($request, $data, 'photos/employees', $employee->photo_path));

        return response()->json(['data' => $this->employeePayload($employee->refresh())]);
    }

    public function destroyEmployee(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json(null, 204);
    }

    protected function writable(Request $request, array $data, string $directory, ?string $currentPhoto): array
    {
        $payload = collect($data)->except(['photo', 'remove_photo'])->all();

        if ($request->hasFile('photo')) {
            $payload['photo_path'] = Media::storePhoto($request->file('photo'), $directory, $currentPhoto);
        } elseif ($request->boolean('remove_photo')) {
            Media::deletePhoto($currentPhoto);
            $payload['photo_path'] = null;
        }

        return $payload;
    }

    protected function employeePayload(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'employee_number' => $employee->employee_number,
            'full_name' => $employee->full_name,
            'type' => $employee->type,
            'position' => $employee->position,
            'department' => $employee->department,
            'school_id' => $employee->school_id,
            'branch_id' => $employee->branch_id,
            'is_active' => $employee->is_active,
            'photo_url' => Media::photoUrl($employee->photo_path),
            'updated_at' => $employee->updated_at?->toIso8601String(),
        ];
    }

    protected function studentPayload(Student $student): array
    {
        return [
            'id' => $student->id,
            'nisn' => $student->nisn,
            'nis' => $student->nis,
            'full_name' => $student->full_name,
            'gender' => $student->gender,
            'grade_level' => $student->grade_level,
            'classroom' => $student->classroom,
            'status' => $student->status,
            'enrollment_year' => $student->enrollment_year,
            'school_id' => $student->school_id,
            'branch_id' => $student->branch_id,
            'photo_url' => Media::photoUrl($student->photo_path),
            'updated_at' => $student->updated_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $employees = Employee::query()
            ->visibleTo($user)
            ->with(['school:id,name', 'branch:id,name'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('employee_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%");
                });
            })
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->when($request->input('type'), fn ($q, $v) => $q->where('type', $v))
            ->when($request->input('employment_status'), fn ($q, $v) => $q->where('employment_status', $v))
            ->orderBy('full_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search', 'school_id', 'branch_id', 'type', 'employment_status']),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'types' => ['teacher', 'staff', 'general'],
            'employmentStatuses' => ['permanent', 'contract', 'part_time', 'intern'],
            'counts' => [
                'total' => Employee::query()->visibleTo($user)->count(),
                'teachers' => Employee::query()->visibleTo($user)->where('type', 'teacher')->count(),
                'staff' => Employee::query()->visibleTo($user)->where('type', 'staff')->count(),
                'general' => Employee::query()->visibleTo($user)->where('type', 'general')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Employees/Form', [
            'employee' => null,
            ...$this->formOptions($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $employee = Employee::create($this->validated($request));

        return redirect()->route('employees.show', $employee)->with('success', $employee->full_name.' was added to the employee database.');
    }

    public function show(Request $request, Employee $employee): Response
    {
        abort_unless($this->canSee($request, $employee), 403);

        $employee->load(['school:id,name,code', 'branch:id,name', 'medicalRecord', 'user:id,name,email,employee_id']);

        $visits = $employee->clinicVisits()->latest('visit_date')->limit(5)->get()->map(fn ($visit) => [
            'id' => $visit->id,
            'visit_date' => $visit->visit_date?->toIso8601String(),
            'complaint' => $visit->complaint,
            'diagnosis' => $visit->diagnosis,
            'disposition' => $visit->disposition,
        ]);

        $routes = \App\Models\TransportRoute::query()
            ->visibleTo($request->user())
            ->where('driver_employee_id', $employee->id)
            ->get(['id', 'name', 'code']);

        return Inertia::render('Employees/Show', [
            'employee' => [
                ...$employee->only([
                    'id', 'employee_number', 'full_name', 'nickname', 'gender', 'birth_place',
                    'birth_date', 'religion', 'marital_status', 'blood_type', 'type', 'position',
                    'department', 'employment_status', 'join_date', 'end_date', 'education_level',
                    'major', 'email', 'phone', 'address', 'notes', 'is_active', 'photo_path',
                ]),
                'school' => $employee->school,
                'branch' => $employee->branch,
                'medical_record' => $employee->medicalRecord,
                'login_account' => $employee->user?->only('id', 'name', 'email'),
            ],
            'visits' => $visits,
            'routes' => $routes,
        ]);
    }

    public function edit(Request $request, Employee $employee): Response
    {
        abort_unless($this->canSee($request, $employee), 403);

        return Inertia::render('Employees/Form', [
            'employee' => $employee,
            ...$this->formOptions($request),
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        abort_unless($this->canSee($request, $employee), 403);

        $employee->update($this->validated($request, $employee));

        return redirect()->route('employees.show', $employee)->with('success', $employee->full_name.' was updated.');
    }

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        abort_unless($this->canSee($request, $employee), 403);

        $name = $employee->full_name;
        $employee->delete();

        return redirect()->route('employees.index')->with('success', $name.' was removed from the employee database.');
    }

    protected function canSee(Request $request, Employee $employee): bool
    {
        $user = $request->user();

        return $user->isSuperAdmin() || ! $user->school_id || $employee->school_id === $user->school_id;
    }

    protected function formOptions(Request $request): array
    {
        $user = $request->user();

        return [
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'types' => ['teacher', 'staff', 'general'],
            'employmentStatuses' => ['permanent', 'contract', 'part_time', 'intern'],
        ];
    }

    protected function validated(Request $request, ?Employee $employee = null): array
    {
        return $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'employee_number' => ['required', 'string', 'max:48', Rule::unique('employees', 'employee_number')->ignore($employee?->id)],
            'full_name' => ['required', 'string', 'max:120'],
            'nickname' => ['nullable', 'string', 'max:60'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'birth_place' => ['nullable', 'string', 'max:80'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'religion' => ['nullable', 'string', 'max:32'],
            'marital_status' => ['nullable', 'string', 'max:24'],
            'blood_type' => ['nullable', 'string', 'max:8'],
            'type' => ['required', Rule::in(['teacher', 'staff', 'general'])],
            'position' => ['nullable', 'string', 'max:80'],
            'department' => ['nullable', 'string', 'max:80'],
            'employment_status' => ['required', Rule::in(['permanent', 'contract', 'part_time', 'intern'])],
            'join_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:join_date'],
            'education_level' => ['nullable', 'string', 'max:32'],
            'major' => ['nullable', 'string', 'max:80'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);
    }
}

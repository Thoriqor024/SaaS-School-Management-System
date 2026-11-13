<?php

namespace App\Support;

use App\Models\Employee;
use Illuminate\Validation\Rule;

class EmployeeRules
{
    public static function rules(?Employee $employee = null): array
    {
        return [
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
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_photo' => ['boolean'],
        ];
    }
}

<?php

namespace App\Support;

use App\Models\Student;
use Illuminate\Validation\Rule;

class StudentRules
{
    public static function rules(?Student $student = null): array
    {
        return [
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'nisn' => ['nullable', 'string', 'max:32', Rule::unique('students', 'nisn')->ignore($student?->id)],
            'nis' => ['nullable', 'string', 'max:32'],
            'full_name' => ['required', 'string', 'max:120'],
            'nickname' => ['nullable', 'string', 'max:60'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'birth_place' => ['nullable', 'string', 'max:80'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'religion' => ['nullable', 'string', 'max:32'],
            'blood_type' => ['nullable', 'string', 'max:8'],
            'grade_level' => ['nullable', 'string', 'max:16'],
            'classroom' => ['nullable', 'string', 'max:32'],
            'enrollment_year' => ['nullable', 'string', 'max:8'],
            'admission_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'inactive', 'graduated', 'transferred'])],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'guardian_name' => ['nullable', 'string', 'max:120'],
            'guardian_relation' => ['nullable', 'string', 'max:24'],
            'guardian_phone' => ['nullable', 'string', 'max:32'],
            'guardian_email' => ['nullable', 'email', 'max:120'],
            'guardian_occupation' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_photo' => ['boolean'],
        ];
    }
}

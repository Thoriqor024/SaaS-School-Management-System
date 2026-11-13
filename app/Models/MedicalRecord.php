<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'patient_type', 'student_id', 'employee_id',
        'blood_type', 'allergies', 'chronic_conditions', 'current_medications',
        'emergency_contact_name', 'emergency_contact_phone', 'insurance_provider',
        'insurance_number', 'last_checkup_at', 'notes',
    ];

    protected function casts(): array
    {
        return ['last_checkup_at' => 'date'];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function displayName(): string
    {
        return $this->student?->full_name ?? $this->employee?->full_name ?? 'Unknown';
    }
}

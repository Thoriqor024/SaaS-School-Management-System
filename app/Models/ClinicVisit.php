<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ClinicVisit extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'patient_type', 'student_id', 'employee_id',
        'visit_date', 'complaint', 'temperature', 'blood_pressure', 'pulse',
        'weight', 'height', 'diagnosis', 'treatment', 'disposition',
        'attended_by_employee_id', 'follow_up_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'datetime',
            'follow_up_date' => 'date',
            'temperature' => 'decimal:1',
            'weight' => 'decimal:2',
            'height' => 'decimal:2',
            'pulse' => 'integer',
        ];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendant()
    {
        return $this->belongsTo(Employee::class, 'attended_by_employee_id');
    }

    public function dispenses()
    {
        return $this->hasMany(MedicineDispense::class);
    }

    public function displayName(): string
    {
        return $this->student?->full_name ?? $this->employee?->full_name ?? 'Unknown patient';
    }
}

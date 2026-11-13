<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'employee_number', 'full_name', 'nickname', 'gender',
        'birth_place', 'birth_date', 'religion', 'marital_status', 'blood_type', 'type',
        'position', 'department', 'employment_status', 'join_date', 'end_date',
        'education_level', 'major', 'email', 'phone', 'address', 'photo_path', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'join_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->hasOne(User::class);
    }

    public function medicalRecord()
    {
        return $this->hasOne(MedicalRecord::class);
    }

    public function clinicVisits()
    {
        return $this->hasMany(ClinicVisit::class);
    }

    public function libraryMembers()
    {
        return $this->hasMany(LibraryMember::class);
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            'teacher' => 'Teacher',
            'general' => 'General Employee',
            default => 'Staff',
        };
    }
}

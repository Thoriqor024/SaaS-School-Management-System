<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'nisn', 'nis', 'full_name', 'nickname', 'gender',
        'birth_place', 'birth_date', 'religion', 'blood_type', 'grade_level', 'classroom',
        'enrollment_year', 'admission_date', 'status', 'email', 'phone', 'address',
        'guardian_name', 'guardian_relation', 'guardian_phone', 'guardian_email',
        'guardian_occupation', 'photo_path', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'admission_date' => 'date',
        ];
    }

    public function transportPassengers()
    {
        return $this->hasMany(TransportPassenger::class);
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

    public function passengerLogs()
    {
        return $this->hasMany(PassengerLog::class);
    }

    public function activeRoute()
    {
        return $this->hasOne(TransportPassenger::class)->where('is_active', true)->with('route');
    }

    public function age(): ?int
    {
        return $this->birth_date?->age;
    }
}

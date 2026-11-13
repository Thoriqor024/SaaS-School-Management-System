<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LibraryMember extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'member_code', 'member_type', 'student_id',
        'employee_id', 'joined_at', 'expires_at', 'max_loans', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'date',
            'expires_at' => 'date',
            'max_loans' => 'integer',
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

    public function loans()
    {
        return $this->hasMany(BookLoan::class);
    }

    public function activeLoans()
    {
        return $this->hasMany(BookLoan::class)->whereIn('status', ['borrowed', 'overdue']);
    }

    public function displayName(): string
    {
        return $this->student?->full_name ?? $this->employee?->full_name ?? $this->member_code;
    }
}

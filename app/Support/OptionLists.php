<?php

namespace App\Support;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;

class OptionLists
{
    public static function schools(?User $user): Collection
    {
        return School::query()
            ->when($user && ! $user->isSuperAdmin(), fn ($q) => $q->where('id', $user->school_id))
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
    }

    public static function branches(?User $user, ?string $schoolId = null): Collection
    {
        return Branch::query()
            ->when($user && ! $user->isSuperAdmin(), fn ($q) => $q->where('school_id', $user->school_id))
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId))
            ->orderBy('name')
            ->get(['id', 'school_id', 'name', 'code']);
    }

    public static function students(?User $user, int $limit = 800): Collection
    {
        return Student::query()
            ->visibleTo($user)
            ->orderBy('full_name')
            ->limit($limit)
            ->get(['id', 'school_id', 'branch_id', 'full_name', 'nisn', 'grade_level', 'classroom']);
    }

    public static function employees(?User $user, ?array $types = null, int $limit = 500): Collection
    {
        return Employee::query()
            ->visibleTo($user)
            ->when($types, fn ($q) => $q->whereIn('type', $types))
            ->orderBy('full_name')
            ->limit($limit)
            ->get(['id', 'school_id', 'branch_id', 'full_name', 'type', 'position']);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'code', 'npsn', 'level', 'email', 'phone', 'address',
        'city', 'province', 'postal_code', 'headmaster_name', 'logo_color', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function initials(): string
    {
        return strtoupper(collect(preg_split('/\s+/', trim($this->name)))
            ->filter()
            ->take(2)
            ->map(fn ($word) => substr($word, 0, 1))
            ->implode(''));
    }
}

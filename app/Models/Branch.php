<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasUuids;

    protected $fillable = [
        'school_id', 'name', 'code', 'type', 'email', 'phone', 'address',
        'city', 'province', 'head_name', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}

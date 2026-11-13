<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CafeteriaMenu extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'title', 'menu_date', 'meal_type',
        'description', 'is_published', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'menu_date' => 'date',
            'is_published' => 'boolean',
        ];
    }

    public function items()
    {
        return $this->hasMany(MenuItem::class);
    }

    public function mealLogs()
    {
        return $this->hasMany(MealLog::class);
    }
}

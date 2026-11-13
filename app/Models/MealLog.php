<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MealLog extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'cafeteria_menu_id', 'meal_date', 'meal_type',
        'students_served', 'staff_served', 'guests_served', 'notes', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'meal_date' => 'date',
            'students_served' => 'integer',
            'staff_served' => 'integer',
            'guests_served' => 'integer',
        ];
    }

    public function menu()
    {
        return $this->belongsTo(CafeteriaMenu::class, 'cafeteria_menu_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function totalServed(): int
    {
        return $this->students_served + $this->staff_served + $this->guests_served;
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TransportVehicle extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'plate_number', 'brand', 'model', 'type', 'capacity',
        'year', 'condition', 'status', 'driver_employee_id', 'attendant_name',
        'tax_expiry', 'insurance_expiry', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'capacity' => 'integer',
            'tax_expiry' => 'date',
            'insurance_expiry' => 'date',
        ];
    }

    public function driver()
    {
        return $this->belongsTo(Employee::class, 'driver_employee_id');
    }

    public function routes()
    {
        return $this->hasMany(TransportRoute::class);
    }

    public function label(): string
    {
        return trim($this->brand.' '.$this->model) ?: $this->plate_number;
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TransportRoute extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'transport_vehicle_id', 'driver_employee_id', 'code',
        'name', 'start_point', 'end_point', 'departure_time', 'return_time',
        'distance_km', 'is_active', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'distance_km' => 'decimal:2',
        ];
    }

    public function vehicle()
    {
        return $this->belongsTo(TransportVehicle::class, 'transport_vehicle_id');
    }

    public function driver()
    {
        return $this->belongsTo(Employee::class, 'driver_employee_id');
    }

    public function stops()
    {
        return $this->hasMany(RouteStop::class)->orderBy('sequence');
    }

    public function passengers()
    {
        return $this->hasMany(TransportPassenger::class);
    }

    public function logs()
    {
        return $this->hasMany(PassengerLog::class);
    }
}

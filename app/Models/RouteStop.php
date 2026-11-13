<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RouteStop extends Model
{
    use HasUuids;

    protected $fillable = [
        'transport_route_id', 'name', 'address', 'sequence', 'pickup_time',
        'dropoff_time', 'latitude', 'longitude',
    ];

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'transport_route_id');
    }

    public function passengers()
    {
        return $this->hasMany(TransportPassenger::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TransportPassenger extends Model
{
    use HasUuids;

    protected $fillable = [
        'student_id', 'transport_route_id', 'route_stop_id', 'direction',
        'start_date', 'end_date', 'is_active', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'transport_route_id');
    }

    public function stop()
    {
        return $this->belongsTo(RouteStop::class, 'route_stop_id');
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PassengerLog extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'transport_route_id', 'student_id', 'log_date', 'direction',
        'status', 'recorded_by', 'notes',
    ];

    protected function casts(): array
    {
        return ['log_date' => 'date'];
    }

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'transport_route_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}

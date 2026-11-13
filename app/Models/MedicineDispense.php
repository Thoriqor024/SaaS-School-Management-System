<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MedicineDispense extends Model
{
    use HasUuids;

    protected $fillable = [
        'clinic_visit_id', 'medicine_id', 'quantity', 'dosage_instructions', 'dispensed_at',
    ];

    protected function casts(): array
    {
        return [
            'dispensed_at' => 'datetime',
            'quantity' => 'integer',
        ];
    }

    public function visit()
    {
        return $this->belongsTo(ClinicVisit::class, 'clinic_visit_id');
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}

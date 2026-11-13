<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'name', 'category', 'unit', 'stock',
        'min_stock', 'expiry_date', 'batch_number', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'min_stock' => 'integer',
            'expiry_date' => 'date',
        ];
    }

    public function dispenses()
    {
        return $this->hasMany(MedicineDispense::class);
    }

    public function isLowStock(): bool
    {
        return $this->stock <= $this->min_stock;
    }
}

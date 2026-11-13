<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CafeteriaInventoryItem extends Model
{
    use HasUuids, BelongsToSchool;

    protected $table = 'cafeteria_inventory_items';

    protected $fillable = [
        'school_id', 'branch_id', 'name', 'category', 'unit', 'quantity',
        'min_quantity', 'supplier', 'expiry_date', 'last_restocked_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'min_quantity' => 'decimal:2',
            'expiry_date' => 'date',
            'last_restocked_at' => 'date',
        ];
    }

    public function isLowStock(): bool
    {
        return (float) $this->quantity <= (float) $this->min_quantity;
    }
}

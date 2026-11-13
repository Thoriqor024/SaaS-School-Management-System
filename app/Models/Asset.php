<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'asset_category_id', 'asset_code', 'name', 'type',
        'quantity', 'unit', 'condition', 'status', 'location', 'assigned_to_employee_id',
        'purchase_date', 'purchase_price', 'warranty_until', 'last_checked_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'purchase_date' => 'date',
            'warranty_until' => 'date',
            'last_checked_at' => 'date',
            'purchase_price' => 'decimal:2',
        ];
    }

    public function category()
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(Employee::class, 'assigned_to_employee_id');
    }

    public function conditionLabel(): string
    {
        return match ($this->condition) {
            'good' => 'Good',
            'minor_damage' => 'Minor damage',
            'major_damage' => 'Major damage',
            'broken' => 'Broken',
            default => ucfirst($this->condition),
        };
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'in_use' => 'In use',
            'in_storage' => 'In storage',
            'maintenance' => 'Maintenance',
            'retired' => 'Retired',
            default => ucfirst($this->status),
        };
    }
}

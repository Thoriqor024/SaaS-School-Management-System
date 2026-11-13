<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasUuids;

    protected $fillable = ['cafeteria_menu_id', 'name', 'category', 'calories', 'allergens', 'notes'];

    protected function casts(): array
    {
        return ['calories' => 'integer'];
    }

    public function menu()
    {
        return $this->belongsTo(CafeteriaMenu::class, 'cafeteria_menu_id');
    }
}

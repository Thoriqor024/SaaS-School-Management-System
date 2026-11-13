<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AssetCategory extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'code', 'kind', 'description'];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}

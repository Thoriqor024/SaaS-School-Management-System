<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BookCategory extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'code', 'description'];

    public function books()
    {
        return $this->hasMany(Book::class);
    }
}

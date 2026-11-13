<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'branch_id', 'book_category_id', 'title', 'author', 'publisher',
        'published_year', 'isbn', 'barcode', 'shelf_location', 'language',
        'total_copies', 'available_copies', 'description',
    ];

    protected function casts(): array
    {
        return [
            'published_year' => 'integer',
            'total_copies' => 'integer',
            'available_copies' => 'integer',
        ];
    }

    public function category()
    {
        return $this->belongsTo(BookCategory::class, 'book_category_id');
    }

    public function loans()
    {
        return $this->hasMany(BookLoan::class);
    }

    public function activeLoans()
    {
        return $this->hasMany(BookLoan::class)->whereIn('status', ['borrowed', 'overdue']);
    }
}

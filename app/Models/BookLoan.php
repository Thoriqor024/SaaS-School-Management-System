<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BookLoan extends Model
{
    use HasUuids, BelongsToSchool;

    protected $fillable = [
        'school_id', 'book_id', 'library_member_id', 'borrowed_at', 'due_at',
        'returned_at', 'status', 'recorded_by', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'borrowed_at' => 'date',
            'due_at' => 'date',
            'returned_at' => 'date',
        ];
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function member()
    {
        return $this->belongsTo(LibraryMember::class, 'library_member_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function isOverdue(): bool
    {
        return $this->status !== 'returned' && $this->due_at?->isPast();
    }
}

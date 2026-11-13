<?php

namespace App\Models\Concerns;

use App\Models\Branch;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToSchool
{
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Restrict a query to the schools a user is allowed to see.
     * Super admins see every school; other users see their own school only.
     */
    public function scopeVisibleTo($query, ?User $user)
    {
        if (! $user || $user->isSuperAdmin()) {
            return $query;
        }

        // A non-super-admin account must belong to a school; without one it sees nothing.
        if (! $user->school_id) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where($this->getTable().'.school_id', $user->school_id);
    }
}

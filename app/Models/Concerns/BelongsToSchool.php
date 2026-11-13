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
        if ($user && ! $user->isSuperAdmin() && $user->school_id) {
            $query->where($this->getTable().'.school_id', $user->school_id);
        }

        return $query;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

abstract class Controller
{
    /**
     * Whether the user may read or manage a record belonging to this school.
     * Super admins see everything; everyone else needs a school that matches.
     */
    protected function canAccess(Request $request, ?string $schoolId): bool
    {
        $user = $request->user();

        return $user !== null
            && ($user->isSuperAdmin() || ($user->school_id !== null && $schoolId === $user->school_id));
    }

    /**
     * Keep writes inside the schools the current user is allowed to manage.
     * Super admins may write anywhere; other accounts need a matching school.
     */
    protected function ensureRecordScope(Request $request, ?string $schoolId, ?string $branchId = null): void
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin()) {
            return;
        }

        abort_if(! $user->school_id, 403, 'Your account is not attached to a school.');
        abort_unless($this->canAccess($request, $schoolId), 403, 'You cannot manage records for another school.');

        if ($branchId && ! Branch::whereKey($branchId)->where('school_id', $schoolId)->exists()) {
            throw ValidationException::withMessages([
                'branch_id' => 'The selected branch does not belong to the selected school.',
            ]);
        }
    }
}

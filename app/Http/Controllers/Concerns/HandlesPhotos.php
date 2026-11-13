<?php

namespace App\Http\Controllers\Concerns;

use App\Support\Media;
use Illuminate\Http\Request;

trait HandlesPhotos
{
    /**
     * Resolve the photo path for a create/update request.
     * Uploads replace the current file; remove_photo clears it.
     */
    protected function resolvePhoto(Request $request, ?string $current, string $directory): ?string
    {
        if ($request->boolean('remove_photo')) {
            Media::deletePhoto($current);

            return null;
        }

        if ($request->hasFile('photo')) {
            return Media::storePhoto($request->file('photo'), $directory, $current);
        }

        return $current;
    }
}

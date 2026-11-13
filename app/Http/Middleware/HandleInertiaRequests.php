<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props shared with every Inertia response.
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'appName' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'avatar_color' => $user->avatar_color,
                    'initials' => $user->initials(),
                    'school' => $user->school?->only('id', 'name'),
                    'branch' => $user->branch?->only('id', 'name'),
                    'is_super_admin' => $user->isSuperAdmin(),
                    'roles' => $user->roles->map(fn ($role) => [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ])->values(),
                    'permissions' => $user->permissionSlugs(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}

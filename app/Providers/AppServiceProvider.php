<?php

namespace App\Providers;

use App\Models\Permission;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Every permission slug becomes a gate ability, so Blade and controllers
        // can use `can:students.manage` style checks as well.
        Gate::before(function ($user) {
            return $user->isSuperAdmin() ? true : null;
        });

        foreach ($this->permissionSlugs() as $slug) {
            Gate::define($slug, fn ($user) => $user->hasPermission($slug));
        }
    }

    /**
     * Read permission slugs once per request when the table is available.
     */
    protected function permissionSlugs(): array
    {
        try {
            return Permission::query()->pluck('slug')->all();
        } catch (\Throwable) {
            return [];
        }
    }
}

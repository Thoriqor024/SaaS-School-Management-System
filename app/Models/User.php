<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasUuids;

    protected $fillable = [
        'school_id',
        'branch_id',
        'employee_id',
        'name',
        'email',
        'phone',
        'job_title',
        'avatar_color',
        'password',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles->contains('slug', $slug);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function roleNames(): Collection
    {
        return $this->roles->pluck('name');
    }

    /**
     * Flattened list of permission slugs granted through the user's roles.
     */
    public function permissionSlugs(): array
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles
                ->flatMap(fn (Role $role) => $role->relationLoaded('permissions')
                    ? $role->permissions->pluck('slug')
                    : $role->permissions()->pluck('slug'))
                ->unique()
                ->values()
                ->all();
        }

        return $this->roles()->with('permissions')->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('slug'))
            ->unique()
            ->values()
            ->all();
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($permission, $this->permissionSlugs(), true);
    }

    public function canAccessModule(string $module): bool
    {
        return $this->hasPermission($module.'.view') || $this->hasPermission($module.'.manage');
    }

    public function initials(): string
    {
        $parts = preg_split('/\s+/', trim($this->name));

        return strtoupper(substr($parts[0] ?? 'U', 0, 1).substr(end($parts) ?: '', 0, 1));
    }
}

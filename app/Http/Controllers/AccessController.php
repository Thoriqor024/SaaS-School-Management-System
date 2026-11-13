<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccessController extends Controller
{
    public function users(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $users = User::query()
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('school_id', $user->school_id))
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('job_title', 'like', "%{$search}%")))
            ->with(['roles:id,name,slug', 'school:id,name', 'branch:id,name', 'employee:id,full_name'])
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'job_title' => $u->job_title,
                'is_active' => $u->is_active,
                'last_login_at' => $u->last_login_at?->toIso8601String(),
                'school_id' => $u->school_id,
                'branch_id' => $u->branch_id,
                'employee_id' => $u->employee_id,
                'school' => $u->school?->name,
                'branch' => $u->branch?->name,
                'roles' => $u->roles->pluck('name'),
                'role_ids' => $u->roles->pluck('id'),
                'initials' => $u->initials(),
                'is_self' => $u->id === $user->id,
            ]);

        return Inertia::render('Access/Users', [
            'users' => $users,
            'roles' => Role::orderByDesc('level')->get(['id', 'name', 'slug', 'description', 'level']),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'employees' => OptionLists::employees($user),
            'filters' => ['search' => $search],
            'canManage' => $user->hasPermission('users.manage'),
        ]);
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:32'],
            'job_title' => ['nullable', 'string', 'max:80'],
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'is_active' => ['boolean'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['uuid', 'exists:roles,id'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'job_title' => $data['job_title'] ?? null,
            'school_id' => $data['school_id'] ?? null,
            'branch_id' => $data['branch_id'] ?? null,
            'employee_id' => $data['employee_id'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'avatar_color' => collect(['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet'])->random(),
        ]);

        $user->roles()->sync($data['roles']);

        return back()->with('success', 'Login account for '.$user->name.' was created.');
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:32'],
            'job_title' => ['nullable', 'string', 'max:80'],
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'is_active' => ['boolean'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['uuid', 'exists:roles,id'],
        ]);

        $payload = collect($data)->except(['password', 'roles'])->toArray();

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);
        $user->roles()->sync($data['roles']);

        return back()->with('success', $user->name.' was updated.');
    }

    public function destroyUser(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->isSuperAdmin() && User::whereHas('roles', fn ($q) => $q->where('slug', 'super_admin'))->count() <= 1) {
            return back()->with('error', 'At least one super admin account must remain.');
        }

        $user->delete();

        return back()->with('success', 'The login account was deleted.');
    }

    public function roles(Request $request): Response
    {
        $roles = Role::query()
            ->with(['permissions:id,name,slug,group'])
            ->withCount('users')
            ->orderByDesc('level')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'level' => $role->level,
                'is_system' => $role->is_system,
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('id'),
            ]);

        return Inertia::render('Access/Roles', [
            'roles' => $roles,
            'permissionGroups' => Permission::query()->orderBy('group')->orderBy('name')->get()
                ->groupBy('group')
                ->map(fn ($permissions, $group) => [
                    'group' => $group,
                    'permissions' => $permissions->map(fn (Permission $p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'slug' => $p->slug,
                    ])->values(),
                ])->values(),
            'canManage' => $request->user()->hasPermission('users.manage'),
        ]);
    }

    public function updateRolePermissions(Request $request, Role $role): RedirectResponse
    {
        abort_if($role->slug === 'super_admin', 403, 'Super admin permissions are locked.');

        $data = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['uuid', 'exists:permissions,id'],
        ]);

        $role->permissions()->sync($data['permissions'] ?? []);

        return back()->with('success', 'Permissions for '.$role->name.' were updated.');
    }
}

<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AccessSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['Dashboard overview', 'dashboard.view', 'dashboard'],
            ['View students', 'students.view', 'students'],
            ['Manage students', 'students.manage', 'students'],
            ['View employees', 'employees.view', 'employees'],
            ['Manage employees', 'employees.manage', 'employees'],
            ['Manage login accounts & roles', 'users.manage', 'access'],
            ['Manage schools & branches', 'schools.manage', 'schools'],
            ['View assets', 'assets.view', 'assets'],
            ['Manage assets', 'assets.manage', 'assets'],
            ['View transport', 'transport.view', 'transport'],
            ['Manage transport', 'transport.manage', 'transport'],
            ['View library', 'library.view', 'library'],
            ['Manage library', 'library.manage', 'library'],
            ['View clinic', 'clinic.view', 'clinic'],
            ['Manage clinic', 'clinic.manage', 'clinic'],
            ['View cafeteria', 'cafeteria.view', 'cafeteria'],
            ['Manage cafeteria', 'cafeteria.manage', 'cafeteria'],
            ['View reports', 'reports.view', 'reports'],
            ['View integration console', 'integrations.view', 'integrations'],
        ];

        foreach ($permissions as [$name, $slug, $group]) {
            Permission::updateOrCreate(['slug' => $slug], ['name' => $name, 'group' => $group]);
        }

        $all = Permission::pluck('slug')->all();

        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super_admin',
                'description' => 'Full access to every school, branch and module.',
                'level' => 100,
                'permissions' => $all,
            ],
            [
                'name' => 'School Admin',
                'slug' => 'school_admin',
                'description' => 'Operational admin for one school and all of its branches.',
                'level' => 80,
                'permissions' => array_values(array_diff($all, ['schools.manage'])),
            ],
            [
                'name' => 'HR Manager',
                'slug' => 'hr_manager',
                'description' => 'Owns the global student and employee master data.',
                'level' => 70,
                'permissions' => ['dashboard.view', 'students.view', 'students.manage', 'employees.view', 'employees.manage', 'users.manage', 'reports.view', 'integrations.view'],
            ],
            [
                'name' => 'Asset Manager',
                'slug' => 'asset_manager',
                'description' => 'Physical inventory, equipment condition and locations.',
                'level' => 60,
                'permissions' => ['dashboard.view', 'assets.view', 'assets.manage', 'reports.view'],
            ],
            [
                'name' => 'Transport Manager',
                'slug' => 'transport_manager',
                'description' => 'Fleet, routes, drivers and passenger logs.',
                'level' => 60,
                'permissions' => ['dashboard.view', 'transport.view', 'transport.manage', 'students.view', 'employees.view', 'reports.view'],
            ],
            [
                'name' => 'Librarian',
                'slug' => 'librarian',
                'description' => 'Book catalog, memberships and circulation.',
                'level' => 60,
                'permissions' => ['dashboard.view', 'library.view', 'library.manage', 'students.view', 'employees.view', 'reports.view'],
            ],
            [
                'name' => 'Clinic Officer',
                'slug' => 'clinic_officer',
                'description' => 'Clinic visits, medical records and medicine stock.',
                'level' => 60,
                'permissions' => ['dashboard.view', 'clinic.view', 'clinic.manage', 'students.view', 'employees.view', 'reports.view'],
            ],
            [
                'name' => 'Cafeteria Manager',
                'slug' => 'cafeteria_manager',
                'description' => 'Menu planning, meal logs and kitchen inventory.',
                'level' => 60,
                'permissions' => ['dashboard.view', 'cafeteria.view', 'cafeteria.manage', 'students.view', 'reports.view'],
            ],
            [
                'name' => 'Teacher',
                'slug' => 'teacher',
                'description' => 'Read-only access to student, library and clinic information.',
                'level' => 30,
                'permissions' => ['dashboard.view', 'students.view', 'library.view', 'clinic.view'],
            ],
        ];

        foreach ($roles as $role) {
            $model = Role::updateOrCreate(
                ['slug' => $role['slug']],
                ['name' => $role['name'], 'description' => $role['description'], 'level' => $role['level'], 'is_system' => true]
            );

            $model->permissions()->sync(Permission::whereIn('slug', $role['permissions'])->pluck('id'));
        }
    }
}

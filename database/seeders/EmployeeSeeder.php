<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Role;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');

        $templates = [
            ['type' => 'teacher', 'position' => 'Mathematics Teacher', 'department' => 'Academic', 'education' => 'S1', 'major' => 'Mathematics Education'],
            ['type' => 'teacher', 'position' => 'Indonesian Language Teacher', 'department' => 'Academic', 'education' => 'S1', 'major' => 'Indonesian Literature'],
            ['type' => 'teacher', 'position' => 'Science Teacher', 'department' => 'Academic', 'education' => 'S2', 'major' => 'Biology'],
            ['type' => 'teacher', 'position' => 'English Teacher', 'department' => 'Academic', 'education' => 'S1', 'major' => 'English Education'],
            ['type' => 'staff', 'position' => 'Administrative Officer', 'department' => 'Administration', 'education' => 'D3', 'major' => 'Office Administration'],
            ['type' => 'staff', 'position' => 'Finance Staff', 'department' => 'Finance', 'education' => 'S1', 'major' => 'Accounting'],
            ['type' => 'staff', 'position' => 'IT Support', 'department' => 'Technology', 'education' => 'S1', 'major' => 'Information Systems'],
            ['type' => 'general', 'position' => 'School Bus Driver', 'department' => 'Operations', 'education' => 'SMA', 'major' => null],
            ['type' => 'general', 'position' => 'Security Officer', 'department' => 'Operations', 'education' => 'SMA', 'major' => null],
            ['type' => 'general', 'position' => 'Cleaning Staff', 'department' => 'Operations', 'education' => 'SMP', 'major' => null],
        ];

        $branches = Branch::with('school')->get();
        $sequence = 1;

        foreach ($branches as $branch) {
            foreach ($templates as $template) {
                $gender = $faker->randomElement(['male', 'female']);
                $name = $faker->firstName($gender).' '.$faker->lastName();

                Employee::updateOrCreate(
                    ['employee_number' => 'EMP-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT)],
                    [
                        'school_id' => $branch->school_id,
                        'branch_id' => $branch->id,
                        'full_name' => $name,
                        'nickname' => explode(' ', $name)[0],
                        'gender' => $gender,
                        'birth_place' => $faker->city(),
                        'birth_date' => $faker->dateTimeBetween('-58 years', '-22 years')->format('Y-m-d'),
                        'religion' => $faker->randomElement(['Islam', 'Christian', 'Catholic', 'Hindu', 'Buddhist']),
                        'marital_status' => $faker->randomElement(['single', 'married']),
                        'blood_type' => $faker->randomElement(['A', 'B', 'AB', 'O']),
                        'type' => $template['type'],
                        'position' => $template['position'],
                        'department' => $template['department'],
                        'employment_status' => $faker->randomElement(['permanent', 'permanent', 'contract', 'part_time']),
                        'join_date' => $faker->dateTimeBetween('-9 years', '-2 months')->format('Y-m-d'),
                        'education_level' => $template['education'],
                        'major' => $template['major'],
                        'email' => Str::slug($name, '.').'.'.strtolower($branch->code).'@siswahub.test',
                        'phone' => $faker->numerify('08##########'),
                        'address' => $faker->address(),
                        'is_active' => $faker->boolean(95),
                    ]
                );

                $sequence++;
            }
        }

        $school = School::where('code', 'NGS')->firstOrFail();
        $branch = $school->branches()->where('code', 'NGS-MAIN')->firstOrFail();
        $teacher = Employee::where('school_id', $school->id)->where('type', 'teacher')->first();

        $accounts = [
            ['name' => 'Ahmad Fauzi', 'email' => 'admin@siswahub.test', 'role' => 'super_admin', 'job' => 'System Administrator', 'school' => null, 'branch' => null, 'employee' => null],
            ['name' => 'Dewi Lestari', 'email' => 'principal@siswahub.test', 'role' => 'school_admin', 'job' => 'Principal', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Rina Puspita', 'email' => 'hr@siswahub.test', 'role' => 'hr_manager', 'job' => 'HR Manager', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Yoga Pratama', 'email' => 'assets@siswahub.test', 'role' => 'asset_manager', 'job' => 'Asset Manager', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Maya Anggraini', 'email' => 'library@siswahub.test', 'role' => 'librarian', 'job' => 'Head Librarian', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Nadia Safitri', 'email' => 'clinic@siswahub.test', 'role' => 'clinic_officer', 'job' => 'School Nurse', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Joko Susilo', 'email' => 'transport@siswahub.test', 'role' => 'transport_manager', 'job' => 'Transport Coordinator', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Sari Wulandari', 'email' => 'cafeteria@siswahub.test', 'role' => 'cafeteria_manager', 'job' => 'Cafeteria Manager', 'school' => $school, 'branch' => $branch, 'employee' => null],
            ['name' => 'Budi Setiawan', 'email' => 'teacher@siswahub.test', 'role' => 'teacher', 'job' => 'Mathematics Teacher', 'school' => $school, 'branch' => $branch, 'employee' => $teacher],
        ];

        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                    'job_title' => $account['job'],
                    'school_id' => $account['school']?->id,
                    'branch_id' => $account['branch']?->id,
                    'employee_id' => $account['employee']?->id,
                    'phone' => $faker->numerify('08##########'),
                    'avatar_color' => $faker->randomElement(['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet']),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $role = Role::where('slug', $account['role'])->first();
            if ($role) {
                $user->roles()->sync([$role->id]);
            }
        }
    }
}

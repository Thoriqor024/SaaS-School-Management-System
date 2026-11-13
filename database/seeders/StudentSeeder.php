<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');
        $schools = School::with('branches')->get();
        $rows = [];
        $counter = 1;

        $gradesBySchool = [
            'NGS' => range(1, 12),
            'BCA' => range(7, 12),
            'HBS' => range(1, 9),
        ];

        foreach ($schools as $school) {
            $grades = $gradesBySchool[$school->code] ?? range(1, 12);

            foreach ($school->branches as $branch) {
                foreach ($grades as $grade) {
                    $perGrade = random_int(2, 4);

                    for ($i = 0; $i < $perGrade; $i++) {
                        $gender = $faker->randomElement(['male', 'female']);
                        $name = $faker->firstName($gender).' '.$faker->lastName();
                        $enrollmentYear = (string) $faker->numberBetween(2019, 2026);
                        // Keep ages believable for the grade level.
                        $age = $grade + 6;
                        $birthDate = now()->subYears($age)->subDays(random_int(0, 364))->toDateString();
                        $status = $faker->randomElement(['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'graduated', 'transferred', 'inactive']);

                        $rows[] = [
                            'id' => (string) Str::uuid(),
                            'school_id' => $school->id,
                            'branch_id' => $branch->id,
                            'nisn' => '00'.str_pad((string) (30000000 + $counter), 8, '0', STR_PAD_LEFT),
                            'nis' => $school->code.'-'.str_pad((string) $counter, 5, '0', STR_PAD_LEFT),
                            'full_name' => $name,
                            'nickname' => explode(' ', $name)[0],
                            'gender' => $gender,
                            'birth_place' => $faker->city(),
                            'birth_date' => $birthDate,
                            'religion' => $faker->randomElement(['Islam', 'Christian', 'Catholic', 'Hindu', 'Buddhist']),
                            'blood_type' => $faker->randomElement(['A', 'B', 'AB', 'O']),
                            'grade_level' => (string) $grade,
                            'classroom' => $grade.$faker->randomElement(['A', 'B', 'C']),
                            'enrollment_year' => $enrollmentYear,
                            'admission_date' => $enrollmentYear.'-07-'.str_pad((string) random_int(1, 20), 2, '0', STR_PAD_LEFT),
                            'status' => $status,
                            'email' => null,
                            'phone' => $faker->boolean(35) ? $faker->numerify('08##########') : null,
                            'address' => $faker->address(),
                            'guardian_name' => $faker->firstName().' '.$faker->lastName(),
                            'guardian_relation' => $faker->randomElement(['father', 'mother', 'guardian']),
                            'guardian_phone' => $faker->numerify('08##########'),
                            'guardian_email' => null,
                            'guardian_occupation' => $faker->randomElement(['Entrepreneur', 'Civil Servant', 'Teacher', 'Engineer', 'Doctor', 'Private Employee', 'Trader']),
                            'photo_path' => null,
                            'notes' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        $counter++;
                    }
                }
            }
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('students')->insert($chunk);
        }
    }
}

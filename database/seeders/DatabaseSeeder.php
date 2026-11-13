<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AccessSeeder::class,
            SchoolSeeder::class,
            EmployeeSeeder::class,
            StudentSeeder::class,
            AssetSeeder::class,
            TransportSeeder::class,
            LibrarySeeder::class,
            ClinicSeeder::class,
            CafeteriaSeeder::class,
        ]);
    }
}

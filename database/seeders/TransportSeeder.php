<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\PassengerLog;
use App\Models\RouteStop;
use App\Models\Student;
use App\Models\TransportPassenger;
use App\Models\TransportRoute;
use App\Models\TransportVehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TransportSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');
        $branches = Branch::with('school')->get();

        $plates = ['B 7123 NGS', 'B 8841 NGS', 'B 9012 NGS', 'D 1188 BCA', 'D 2201 BCA', 'L 8801 HBS', 'L 8932 HBS'];
        $routesBySchool = [
            'NGS' => [
                ['code' => 'NGS-R1', 'name' => 'Kebayoran – Senayan Loop', 'start' => 'Main Campus', 'end' => 'Senayan', 'depart' => '06:15', 'return' => '15:30'],
                ['code' => 'NGS-R2', 'name' => 'Depok – Margonda Express', 'start' => 'South Campus', 'end' => 'Margonda', 'depart' => '05:50', 'return' => '16:00'],
                ['code' => 'NGS-R3', 'name' => 'Tebet – Casablanca Shuttle', 'start' => 'Main Campus', 'end' => 'Casablanca', 'depart' => '06:30', 'return' => '15:45'],
            ],
            'BCA' => [
                ['code' => 'BCA-R1', 'name' => 'Dago – Cihampelas Line', 'start' => 'Dago Campus', 'end' => 'Cihampelas', 'depart' => '06:10', 'return' => '15:20'],
                ['code' => 'BCA-R2', 'name' => 'Setiabudi – Lembang Line', 'start' => 'North Campus', 'end' => 'Lembang', 'depart' => '05:45', 'return' => '16:10'],
            ],
            'HBS' => [
                ['code' => 'HBS-R1', 'name' => 'Darmo – Wonokromo Line', 'start' => 'Darmo Campus', 'end' => 'Wonokromo', 'depart' => '06:20', 'return' => '15:15'],
                ['code' => 'HBS-R2', 'name' => 'Rungkut – Merr Circuit', 'start' => 'East Campus', 'end' => 'MERR', 'depart' => '06:00', 'return' => '15:40'],
            ],
        ];

        $stopNames = ['Perumahan Griya Asri', 'Taman Kota', 'Stasiun Kota', 'Pasar Modern', 'RS Central', 'Plaza Utama', 'Perumahan Bumi Indah', 'Gedung Serbaguna'];

        $vehicleIndex = 0;
        $schools = $branches->groupBy('school_id');

        foreach ($schools as $schoolId => $schoolBranches) {
            $schoolCode = $schoolBranches->first()->school->code;
            $branch = $schoolBranches->first();

            $vehicle = TransportVehicle::updateOrCreate(
                ['plate_number' => $plates[$vehicleIndex % count($plates)]],
                [
                    'school_id' => $schoolId,
                    'branch_id' => $branch->id,
                    'brand' => 'Hino',
                    'model' => 'RK8 Coach',
                    'type' => 'bus',
                    'capacity' => 45,
                    'year' => 2021,
                    'condition' => 'good',
                    'status' => 'active',
                    'driver_employee_id' => Employee::where('school_id', $schoolId)->where('type', 'general')->value('id'),
                    'attendant_name' => $faker->name('female'),
                    'tax_expiry' => Carbon::today()->addMonths(7)->toDateString(),
                    'insurance_expiry' => Carbon::today()->addMonths(4)->toDateString(),
                ]
            );
            $vehicleIndex++;

            $secondVehicle = TransportVehicle::updateOrCreate(
                ['plate_number' => $plates[$vehicleIndex % count($plates)]],
                [
                    'school_id' => $schoolId,
                    'branch_id' => $schoolBranches->last()->id,
                    'brand' => 'Toyota',
                    'model' => 'HiAce',
                    'type' => 'van',
                    'capacity' => 15,
                    'year' => 2022,
                    'condition' => 'good',
                    'status' => 'active',
                    'driver_employee_id' => Employee::where('school_id', $schoolId)->where('type', 'general')->skip(1)->value('id'),
                    'attendant_name' => $faker->name('female'),
                    'tax_expiry' => Carbon::today()->addMonths(3)->toDateString(),
                    'insurance_expiry' => Carbon::today()->addMonths(9)->toDateString(),
                ]
            );
            $vehicleIndex++;

            foreach ($routesBySchool[$schoolCode] ?? [] as $index => $definition) {
                $route = TransportRoute::updateOrCreate(
                    ['school_id' => $schoolId, 'code' => $definition['code']],
                    [
                        'branch_id' => $schoolBranches[$index % $schoolBranches->count()]->id,
                        'transport_vehicle_id' => $index === 0 ? $vehicle->id : $secondVehicle->id,
                        'driver_employee_id' => $index === 0 ? $vehicle->driver_employee_id : $secondVehicle->driver_employee_id,
                        'name' => $definition['name'],
                        'start_point' => $definition['start'],
                        'end_point' => $definition['end'],
                        'departure_time' => $definition['depart'],
                        'return_time' => $definition['return'],
                        'distance_km' => $faker->randomFloat(1, 8, 32),
                        'is_active' => true,
                    ]
                );

                if ($route->stops()->count() === 0) {
                    $used = [];
                    foreach (range(1, 5) as $sequence) {
                        $stopName = $stopNames[array_rand($stopNames)];
                        while (in_array($stopName, $used, true)) {
                            $stopName = $stopNames[array_rand($stopNames)];
                        }
                        $used[] = $stopName;

                        RouteStop::create([
                            'transport_route_id' => $route->id,
                            'name' => $stopName,
                            'address' => $faker->streetAddress(),
                            'sequence' => $sequence,
                            'pickup_time' => Carbon::createFromFormat('H:i', $definition['depart'])->addMinutes($sequence * 8)->format('H:i'),
                            'dropoff_time' => Carbon::createFromFormat('H:i', $definition['return'])->addMinutes($sequence * 5)->format('H:i'),
                            'latitude' => $faker->latitude(-7.4, -6.1),
                            'longitude' => $faker->longitude(106.6, 112.8),
                        ]);
                    }
                }

                $stops = $route->stops()->get();
                $students = Student::where('branch_id', $route->branch_id)
                    ->where('status', 'active')
                    ->inRandomOrder()
                    ->limit(random_int(6, 11))
                    ->get();

                foreach ($students as $student) {
                    TransportPassenger::updateOrCreate(
                        ['student_id' => $student->id, 'transport_route_id' => $route->id],
                        [
                            'route_stop_id' => $stops->random()->id,
                            'direction' => $faker->randomElement(['both', 'both', 'both', 'pickup', 'dropoff']),
                            'start_date' => Carbon::today()->subMonths(random_int(1, 10))->toDateString(),
                            'is_active' => true,
                        ]
                    );

                    foreach (range(0, 4) as $daysAgo) {
                        $day = Carbon::today()->subDays($daysAgo);

                        if ($day->isWeekend()) {
                            continue;
                        }

                        PassengerLog::create([
                            'school_id' => $schoolId,
                            'transport_route_id' => $route->id,
                            'student_id' => $student->id,
                            'log_date' => $day->toDateString(),
                            'direction' => 'pickup',
                            'status' => $faker->randomElement(['picked_up', 'picked_up', 'picked_up', 'picked_up', 'late', 'absent']),
                            'recorded_by' => null,
                        ]);
                    }
                }
            }
        }
    }
}

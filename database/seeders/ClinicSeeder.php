<?php

namespace Database\Seeders;

use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\MedicineDispense;
use App\Models\School;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ClinicSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');

        $medicines = [
            ['Paracetamol 500mg', 'analgesic', 'tablet', 320, 60, 24],
            ['Ibuprofen 400mg', 'analgesic', 'tablet', 180, 40, 18],
            ['Amoxicillin 500mg', 'antibiotic', 'capsule', 90, 30, 10],
            ['Cetirizine 10mg', 'antihistamine', 'tablet', 120, 30, 30],
            ['Vitamin C 1000mg', 'vitamin', 'tablet', 200, 40, 20],
            ['Oral Rehydration Salt', 'other', 'sachet', 150, 40, 36],
            ['Antiseptic Solution 100ml', 'first_aid', 'bottle', 40, 12, 24],
            ['Rolled Bandage 10cm', 'first_aid', 'roll', 60, 20, 60],
            ['Sterile Gauze Pack', 'first_aid', 'pack', 140, 30, 48],
            ['Cough Syrup 60ml', 'other', 'bottle', 55, 15, 20],
            ['Minyak Kayu Putih 30ml', 'other', 'bottle', 80, 20, 48],
            ['Saline Eye Drops', 'other', 'bottle', 35, 10, 18],
            ['Povidone Iodine 60ml', 'first_aid', 'bottle', 25, 10, 24],
            ['Activated Charcoal', 'other', 'tablet', 60, 20, 30],
        ];

        $complaints = [
            ['Headache', 'Tension headache', 'Paracetamol 500mg', 'Rest and hydration advised', 'returned_to_class'],
            ['Stomach ache', 'Mild gastritis', 'Oral Rehydration Salt', 'Light meal recommended', 'returned_to_class'],
            ['Fever 38.2°C', 'Viral fever', 'Paracetamol 500mg', 'Sent home for rest', 'sent_home'],
            ['Allergic rash', 'Skin allergy', 'Cetirizine 10mg', 'Avoid allergen, monitor rash', 'returned_to_class'],
            ['Sprained ankle', 'Grade 1 ankle sprain', 'Ibuprofen 400mg', 'RICE protocol applied', 'observation'],
            ['Nose bleeding', 'Epistaxis', 'Sterile Gauze Pack', 'Pressure applied, checked 15 minutes', 'returned_to_class'],
            ['Cough and cold', 'Upper respiratory infection', 'Cough Syrup 60ml', 'Warm fluids, monitor', 'returned_to_class'],
            ['Minor cut on hand', 'Superficial laceration', 'Antiseptic Solution 100ml', 'Wound cleaned and dressed', 'returned_to_class'],
            ['Dizziness', 'Mild dehydration', 'Oral Rehydration Salt', 'Rest, hydration, canteen breakfast', 'observation'],
            ['Asthma tightness', 'Mild asthma exacerbation', 'Saline Eye Drops', 'Inhaler administered, parents notified', 'referred_to_hospital'],
        ];

        $medicineModels = [];

        foreach (School::with('branches')->get() as $school) {
            $branch = $school->branches->first();

            foreach ($medicines as $index => $medicine) {
                [$name, $category, $unit, $stock, $minStock, $expiryMonths] = $medicine;

                $model = Medicine::updateOrCreate(
                    ['school_id' => $school->id, 'name' => $name, 'branch_id' => $branch->id],
                    [
                        'category' => $category,
                        'unit' => $unit,
                        'stock' => $index % 7 === 0 ? random_int(0, 8) : $stock,
                        'min_stock' => $minStock,
                        'expiry_date' => Carbon::today()->addMonths($expiryMonths - 30)->toDateString(),
                        'batch_number' => 'BATCH-'.strtoupper(substr(md5($name.$school->id), 0, 8)),
                    ]
                );

                $medicineModels[$school->id][$name] = $model;
            }

            $students = Student::where('school_id', $school->id)->where('status', 'active')->inRandomOrder()->limit(40)->get();
            $employees = Employee::where('school_id', $school->id)->where('is_active', true)->inRandomOrder()->limit(8)->get();

            foreach ($students as $student) {
                MedicalRecord::updateOrCreate(
                    ['patient_type' => 'student', 'student_id' => $student->id],
                    [
                        'school_id' => $school->id,
                        'branch_id' => $student->branch_id,
                        'blood_type' => $student->blood_type,
                        'allergies' => match ($student->id) {
                            default => $faker->randomElement([null, 'Peanuts', 'Dust and pollen', 'Seafood', 'Penicillin', 'Egg white']),
                        },
                        'chronic_conditions' => $faker->randomElement([null, null, null, 'Mild asthma', 'Allergic rhinitis', 'Eczema']),
                        'emergency_contact_name' => $student->guardian_name,
                        'emergency_contact_phone' => $student->guardian_phone,
                        'last_checkup_at' => Carbon::today()->subMonths(random_int(1, 12))->toDateString(),
                    ]
                );
            }

            foreach ($employees as $employee) {
                MedicalRecord::updateOrCreate(
                    ['patient_type' => 'employee', 'employee_id' => $employee->id],
                    [
                        'school_id' => $school->id,
                        'branch_id' => $employee->branch_id,
                        'blood_type' => $employee->blood_type,
                        'allergies' => $faker->randomElement([null, null, 'Dust', 'Shellfish']),
                        'chronic_conditions' => $faker->randomElement([null, null, 'Hypertension']),
                        'emergency_contact_name' => $faker->name(),
                        'emergency_contact_phone' => $faker->numerify('08##########'),
                        'last_checkup_at' => Carbon::today()->subMonths(random_int(1, 12))->toDateString(),
                    ]
                );
            }

            foreach (range(1, 34) as $i) {
                [$complaint, $diagnosis, $medicineName, $treatment, $disposition] = $complaints[array_rand($complaints)];
                $patient = $faker->boolean(85) ? $students->random() : $employees->random();
                $isStudent = $patient instanceof Student;

                $visit = ClinicVisit::create([
                    'school_id' => $school->id,
                    'branch_id' => $patient->branch_id,
                    'patient_type' => $isStudent ? 'student' : 'employee',
                    'student_id' => $isStudent ? $patient->id : null,
                    'employee_id' => $isStudent ? null : $patient->id,
                    'visit_date' => Carbon::today()->subDays(random_int(0, 30))->setTime(random_int(7, 14), random_int(0, 59)),
                    'complaint' => $complaint,
                    'temperature' => $faker->randomFloat(1, 36.2, 38.9),
                    'blood_pressure' => random_int(100, 130).'/'.random_int(65, 88),
                    'pulse' => random_int(62, 105),
                    'weight' => $faker->randomFloat(1, 28, 78),
                    'height' => $faker->randomFloat(1, 120, 178),
                    'diagnosis' => $diagnosis,
                    'treatment' => $treatment,
                    'disposition' => $disposition,
                    'attended_by_employee_id' => Employee::where('school_id', $school->id)->where('type', 'staff')->value('id'),
                    'notes' => null,
                ]);

                if (random_int(1, 100) <= 70 && isset($medicineModels[$school->id][$medicineName])) {
                    $medicine = $medicineModels[$school->id][$medicineName];
                    $quantity = random_int(1, 3);

                    if ($medicine->stock >= $quantity) {
                        MedicineDispense::create([
                            'clinic_visit_id' => $visit->id,
                            'medicine_id' => $medicine->id,
                            'quantity' => $quantity,
                            'dosage_instructions' => 'Take '.$quantity.' '.$medicine->unit.' after meals, 3 times daily.',
                            'dispensed_at' => $visit->visit_date,
                        ]);

                        $medicine->decrement('stock', $quantity);
                    }
                }
            }
        }
    }
}

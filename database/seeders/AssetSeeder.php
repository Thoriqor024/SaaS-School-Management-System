<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Branch;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'IT & Computers', 'code' => 'IT', 'kind' => 'fixed', 'description' => 'Laptops, desktops, projectors and network hardware.'],
            ['name' => 'Classroom Furniture', 'code' => 'FURN', 'kind' => 'fixed', 'description' => 'Student desks, chairs, whiteboards and cabinets.'],
            ['name' => 'Laboratory Equipment', 'code' => 'LAB', 'kind' => 'fixed', 'description' => 'Science lab instruments and safety equipment.'],
            ['name' => 'Sports Equipment', 'code' => 'SPT', 'kind' => 'fixed', 'description' => 'Balls, nets, mats and athletics gear.'],
            ['name' => 'Office Supplies', 'code' => 'SUP', 'kind' => 'consumable', 'description' => 'Paper, stationery and printer consumables.'],
            ['name' => 'Cleaning Supplies', 'code' => 'CLN', 'kind' => 'consumable', 'description' => 'Detergents, disinfectants and cleaning tools.'],
            ['name' => 'Library Assets', 'code' => 'LIB', 'kind' => 'fixed', 'description' => 'Shelving, reading tables and catalog terminals.'],
            ['name' => 'Kitchen & Cafeteria', 'code' => 'CAF', 'kind' => 'fixed', 'description' => 'Cooking equipment, trays and serving tools.'],
        ];

        $categoryModels = [];
        foreach ($categories as $category) {
            $categoryModels[$category['code']] = AssetCategory::updateOrCreate(['code' => $category['code']], $category);
        }

        $templates = [
            ['IT', 'Student Laptop', 'fixed', 12, 'unit'],
            ['IT', 'Classroom Projector', 'fixed', 3, 'unit'],
            ['IT', 'Network Switch 24-port', 'fixed', 1, 'unit'],
            ['IT', 'Desktop Computer (Lab)', 'fixed', 10, 'unit'],
            ['FURN', 'Student Desk', 'fixed', 40, 'unit'],
            ['FURN', 'Student Chair', 'fixed', 40, 'unit'],
            ['FURN', 'Teacher Desk', 'fixed', 2, 'unit'],
            ['FURN', 'Whiteboard 120x240', 'fixed', 2, 'unit'],
            ['LAB', 'Microscope', 'fixed', 6, 'unit'],
            ['LAB', 'Bunsen Burner', 'fixed', 8, 'unit'],
            ['LAB', 'Safety Goggles', 'fixed', 30, 'unit'],
            ['SPT', 'Basketball', 'fixed', 8, 'unit'],
            ['SPT', 'Volleyball Net', 'fixed', 2, 'unit'],
            ['SPT', 'Athletics Mat', 'fixed', 4, 'unit'],
            ['SUP', 'A4 Paper Ream', 'consumable', 120, 'ream'],
            ['SUP', 'Whiteboard Marker', 'consumable', 90, 'piece'],
            ['SUP', 'Printer Toner', 'consumable', 12, 'cartridge'],
            ['CLN', 'Floor Cleaner 5L', 'consumable', 24, 'bottle'],
            ['CLN', 'Hand Sanitiser 1L', 'consumable', 30, 'bottle'],
            ['LIB', 'Library Reading Table', 'fixed', 6, 'unit'],
            ['LIB', 'Book Shelf', 'fixed', 12, 'unit'],
            ['CAF', 'Stainless Cooking Pot', 'fixed', 6, 'unit'],
            ['CAF', 'Food Tray', 'fixed', 150, 'unit'],
            ['CAF', 'Dish Rack', 'fixed', 8, 'unit'],
        ];

        $locations = ['Room 101', 'Room 102', 'Science Lab', 'Computer Lab', 'Library', 'Main Hall', 'Admin Office', 'Warehouse', 'Cafeteria', 'Sports Hall'];
        $conditions = ['good', 'good', 'good', 'good', 'good', 'good', 'minor_damage', 'minor_damage', 'major_damage', 'broken'];
        $statuses = ['in_use', 'in_use', 'in_use', 'in_use', 'in_storage', 'maintenance', 'retired'];

        $sequence = 1;
        $branches = Branch::with('school')->get();

        foreach ($branches as $branch) {
            $employeeId = Employee::where('branch_id', $branch->id)->value('id');
            $selection = $templates;
            shuffle($selection);
            $selection = array_slice($selection, 0, random_int(14, 20));

            foreach ($selection as $template) {
                [$categoryCode, $name, $type, $quantity, $unit] = $template;
                $condition = $conditions[array_rand($conditions)];
                $status = $statuses[array_rand($statuses)];

                if ($condition === 'broken' && $status === 'in_use') {
                    $status = 'maintenance';
                }

                Asset::updateOrCreate(
                    ['asset_code' => 'AST-'.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT)],
                    [
                        'school_id' => $branch->school_id,
                        'branch_id' => $branch->id,
                        'asset_category_id' => $categoryModels[$categoryCode]->id,
                        'name' => $name,
                        'type' => $type,
                        'quantity' => $quantity + random_int(0, 5),
                        'unit' => $unit,
                        'condition' => $condition,
                        'status' => $status,
                        'location' => $locations[array_rand($locations)],
                        'assigned_to_employee_id' => $type === 'fixed' && random_int(0, 1) ? $employeeId : null,
                        'purchase_date' => now()->subMonths(random_int(2, 70))->toDateString(),
                        'purchase_price' => random_int(15, 1800) * 100000,
                        'warranty_until' => now()->addMonths(random_int(-12, 30))->toDateString(),
                        'last_checked_at' => now()->subDays(random_int(1, 200))->toDateString(),
                        'notes' => null,
                    ]
                );

                $sequence++;
            }
        }
    }
}

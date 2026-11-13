<?php

namespace Database\Seeders;

use App\Models\CafeteriaInventoryItem;
use App\Models\CafeteriaMenu;
use App\Models\MealLog;
use App\Models\School;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CafeteriaSeeder extends Seeder
{
    public function run(): void
    {
        $menuTemplates = [
            ['title' => 'Nasi Goreng Kampung', 'items' => [['Nasi Goreng Kampung', 'main', 520, null], ['Telur Mata Sapi', 'side', 120, 'Egg'], ['Jeruk Segar', 'drink', 90, null], ['Pisang', 'fruit', 105, null]]],
            ['title' => 'Ayam Bakar & Lalapan', 'items' => [['Ayam Bakar', 'main', 480, null], ['Lalapan Sayur', 'side', 60, null], ['Nasi Putih', 'side', 260, null], ['Es Teh Manis', 'drink', 80, null]]],
            ['title' => 'Soto Betawi', 'items' => [['Soto Betawi', 'main', 420, null], ['Emping', 'side', 90, null], ['Nasi Putih', 'side', 260, null], ['Air Mineral', 'drink', 0, null]]],
            ['title' => 'Mie Ayam Spesial', 'items' => [['Mie Ayam', 'main', 450, 'Gluten'], ['Pangsit Goreng', 'side', 180, 'Gluten'], ['Sayur Hijau', 'side', 45, null], ['Melon Potong', 'fruit', 60, null]]],
            ['title' => 'Nasi Kuning Komplit', 'items' => [['Nasi Kuning', 'main', 480, null], ['Ayam Serundeng', 'side', 210, null], ['Tempe Orek', 'side', 110, 'Soy'], ['Air Mineral', 'drink', 0, null]]],
            ['title' => 'Gado-Gado Siram', 'items' => [['Gado-Gado', 'main', 380, 'Peanuts'], ['Lontong', 'side', 180, null], ['Kerupuk', 'side', 70, null], ['Jus Alpukat', 'drink', 220, null]]],
            ['title' => 'Sup Bola-Bola & Buah', 'items' => [['Sup Bola-Bola', 'main', 320, null], ['Nasi Putih', 'side', 260, null], ['Semangka', 'fruit', 50, null], ['Susu UHT', 'drink', 150, 'Milk']]],
            ['title' => 'Rendang & Nasi Hangat', 'items' => [['Rendang Daging', 'main', 560, null], ['Nasi Hangat', 'side', 260, null], ['Daun Singkong', 'side', 70, null], ['Es Jeruk', 'drink', 90, null]]],
            ['title' => 'Bubur Ayam Pagi', 'items' => [['Bubur Ayam', 'main', 340, null], ['Cakwe', 'side', 150, 'Gluten'], ['Telur Rebus', 'side', 78, 'Egg'], ['Teh Hangat', 'drink', 30, null]]],
            ['title' => 'Pancake & Fruit Bowl', 'items' => [['Pancake Madu', 'main', 380, 'Gluten, Milk'], ['Potongan Buah', 'fruit', 80, null], ['Yoghurt', 'side', 120, 'Milk'], ['Jus Jeruk', 'drink', 110, null]]],
        ];

        $inventoryTemplates = [
            ['Beras Premium', 'dry_goods', 'kg', 240, 80, 'CV Sumber Pangan'],
            ['Minyak Goreng', 'dry_goods', 'liter', 60, 20, 'CV Sumber Pangan'],
            ['Gula Pasir', 'dry_goods', 'kg', 45, 15, 'CV Sumber Pangan'],
            ['Telur Ayam', 'fresh', 'kg', 38, 15, 'Pasar Induk'],
            ['Ayam Fillet', 'fresh', 'kg', 28, 12, 'Pasar Induk'],
            ['Daging Sapi', 'fresh', 'kg', 18, 8, 'Pasar Induk'],
            ['Sayur Bayam', 'fresh', 'kg', 12, 6, 'Pasar Induk'],
            ['Wortel', 'fresh', 'kg', 16, 6, 'Pasar Induk'],
            ['Susu UHT', 'beverage', 'liter', 40, 20, 'PT Dairy Nusantara'],
            ['Teh Celup', 'beverage', 'box', 14, 5, 'CV Sumber Pangan'],
            ['Air Mineral Galon', 'beverage', 'galon', 22, 10, 'PT Tirta Jaya'],
            ['Piring Melamin', 'utensil', 'unit', 180, 60, 'CV Perlengkapan Dapur'],
            ['Sendok Stainless', 'utensil', 'unit', 220, 80, 'CV Perlengkapan Dapur'],
            ['Gas LPG 12kg', 'other', 'tabung', 9, 4, 'Agen Gas Sejahtera'],
            ['Sabun Cuci Piring', 'other', 'liter', 6, 4, 'CV Perlengkapan Dapur'],
        ];

        foreach (School::with('branches')->get() as $school) {
            $branches = $school->branches;

            foreach (range(-7, 3) as $dayOffset) {
                $date = Carbon::today()->addDays($dayOffset);
                if ($date->isSunday()) {
                    continue;
                }

                $template = $menuTemplates[($dayOffset + 10) % count($menuTemplates)];
                $branch = $branches[($dayOffset + 10) % $branches->count()];

                $menu = CafeteriaMenu::updateOrCreate(
                    ['school_id' => $school->id, 'title' => $template['title'], 'menu_date' => $date->toDateString()],
                    [
                        'branch_id' => $branch->id,
                        'meal_type' => 'lunch',
                        'description' => 'Balanced lunch set prepared by the central kitchen.',
                        'is_published' => $dayOffset <= 1,
                        'created_by' => null,
                    ]
                );

                $menu->items()->delete();
                foreach ($template['items'] as [$name, $category, $calories, $allergens]) {
                    $menu->items()->create([
                        'name' => $name,
                        'category' => $category,
                        'calories' => $calories,
                        'allergens' => $allergens,
                        'notes' => null,
                    ]);
                }

                if ($dayOffset <= 0 && ! $date->isWeekend()) {
                    foreach ($branches as $index => $logBranch) {
                        MealLog::updateOrCreate(
                            ['school_id' => $school->id, 'branch_id' => $logBranch->id, 'meal_date' => $date->toDateString(), 'meal_type' => 'lunch'],
                            [
                                'cafeteria_menu_id' => $index === 0 ? $menu->id : null,
                                'students_served' => random_int(180, 420),
                                'staff_served' => random_int(18, 42),
                                'guests_served' => random_int(0, 12),
                                'notes' => null,
                                'recorded_by' => null,
                            ]
                        );
                    }
                }
            }

            foreach ($branches as $branch) {
                foreach ($inventoryTemplates as $index => $template) {
                    [$name, $category, $unit, $quantity, $minQuantity, $supplier] = $template;

                    CafeteriaInventoryItem::updateOrCreate(
                        ['school_id' => $school->id, 'branch_id' => $branch->id, 'name' => $name],
                        [
                            'category' => $category,
                            'unit' => $unit,
                            'quantity' => $index % 6 === 0 ? round($minQuantity * 0.6, 2) : $quantity,
                            'min_quantity' => $minQuantity,
                            'supplier' => $supplier,
                            'expiry_date' => Carbon::today()->addDays($index % 5 === 0 ? random_int(2, 10) : random_int(30, 300))->toDateString(),
                            'last_restocked_at' => Carbon::today()->subDays(random_int(1, 14))->toDateString(),
                        ]
                    );
                }
            }
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $schools = [
            [
                'name' => 'Nusantara Global School',
                'code' => 'NGS',
                'npsn' => '20104561',
                'level' => 'K-12',
                'email' => 'hello@nusantaraglobal.sch.id',
                'phone' => '+62 21 5550 1200',
                'address' => 'Jl. Cendrawasih No. 18, Kebayoran Baru',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'postal_code' => '12190',
                'headmaster_name' => 'Dr. Ratna Kusumawati',
                'logo_color' => 'indigo',
                'branches' => [
                    ['name' => 'Main Campus', 'code' => 'NGS-MAIN', 'type' => 'main', 'city' => 'Jakarta Selatan', 'address' => 'Jl. Cendrawasih No. 18', 'head_name' => 'Bambang Wijaya', 'phone' => '+62 21 5550 1201'],
                    ['name' => 'South Campus', 'code' => 'NGS-SOUTH', 'type' => 'campus', 'city' => 'Depok', 'address' => 'Jl. Margonda Raya No. 210', 'head_name' => 'Siti Nurhaliza', 'phone' => '+62 21 5550 1202'],
                    ['name' => 'Elementary Wing', 'code' => 'NGS-ELEM', 'type' => 'wing', 'city' => 'Jakarta Selatan', 'address' => 'Jl. Cendrawasih No. 20A', 'head_name' => 'Yuni Pratiwi', 'phone' => '+62 21 5550 1203'],
                ],
            ],
            [
                'name' => 'Bina Cendekia Academy',
                'code' => 'BCA',
                'npsn' => '20219873',
                'level' => 'Secondary',
                'email' => 'info@binacendekia.sch.id',
                'phone' => '+62 22 8730 4400',
                'address' => 'Jl. Dago Atas No. 77',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'postal_code' => '40135',
                'headmaster_name' => 'Hendra Gunawan, M.Pd.',
                'logo_color' => 'emerald',
                'branches' => [
                    ['name' => 'Dago Campus', 'code' => 'BCA-DAGO', 'type' => 'main', 'city' => 'Bandung', 'address' => 'Jl. Dago Atas No. 77', 'head_name' => 'Lina Marlina', 'phone' => '+62 22 8730 4401'],
                    ['name' => 'North Campus', 'code' => 'BCA-NORTH', 'type' => 'campus', 'city' => 'Bandung', 'address' => 'Jl. Setiabudi No. 154', 'head_name' => 'Agus Setiawan', 'phone' => '+62 22 8730 4402'],
                ],
            ],
            [
                'name' => 'Harapan Bangsa School',
                'code' => 'HBS',
                'npsn' => '20504412',
                'level' => 'K-9',
                'email' => 'office@harapanbangsa.sch.id',
                'phone' => '+62 31 5920 8800',
                'address' => 'Jl. Darmo Permai Selatan No. 9',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'postal_code' => '60126',
                'headmaster_name' => 'Maria Santoso',
                'logo_color' => 'amber',
                'branches' => [
                    ['name' => 'Darmo Campus', 'code' => 'HBS-DARMO', 'type' => 'main', 'city' => 'Surabaya', 'address' => 'Jl. Darmo Permai Selatan No. 9', 'head_name' => 'Rudi Hartono', 'phone' => '+62 31 5920 8801'],
                    ['name' => 'East Campus', 'code' => 'HBS-EAST', 'type' => 'campus', 'city' => 'Surabaya', 'address' => 'Jl. Rungkut Asri Timur No. 22', 'head_name' => 'Fitri Handayani', 'phone' => '+62 31 5920 8802'],
                ],
            ],
        ];

        foreach ($schools as $school) {
            $branches = $school['branches'];
            unset($school['branches']);

            $model = School::updateOrCreate(['code' => $school['code']], [...$school, 'is_active' => true]);

            foreach ($branches as $branch) {
                $model->branches()->updateOrCreate(
                    ['code' => $branch['code']],
                    [...$branch, 'email' => $school['email'], 'province' => $school['province'], 'is_active' => true]
                );
            }
        }
    }
}

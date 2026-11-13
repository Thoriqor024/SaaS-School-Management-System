<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookLoan;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\School;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class LibrarySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fiction', 'code' => 'FIC', 'description' => 'Novels, short stories and literature.'],
            ['name' => 'Science', 'code' => 'SCI', 'description' => 'Physics, biology, chemistry and general science.'],
            ['name' => 'History & Social', 'code' => 'HIS', 'description' => 'History, geography and social studies.'],
            ['name' => 'Reference', 'code' => 'REF', 'description' => 'Dictionaries, encyclopedias and atlases.'],
            ['name' => 'Language', 'code' => 'LNG', 'description' => 'Indonesian, English and foreign language learning.'],
            ['name' => 'Children', 'code' => 'CHL', 'description' => 'Picture books and early readers.'],
            ['name' => 'Technology', 'code' => 'TEC', 'description' => 'Computing, engineering and coding.'],
            ['name' => 'Religion & Ethics', 'code' => 'REL', 'description' => 'Religious studies and character education.'],
        ];

        $categoryModels = [];
        foreach ($categories as $category) {
            $categoryModels[$category['code']] = BookCategory::updateOrCreate(['code' => $category['code']], $category);
        }

        $titles = [
            ['Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, 'FIC', 'Indonesian'],
            ['Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, 'FIC', 'Indonesian'],
            ['Perahu Kertas', 'Dee Lestari', 'Bentang Pustaka', 2009, 'FIC', 'Indonesian'],
            ['Sang Pemimpi', 'Andrea Hirata', 'Bentang Pustaka', 2006, 'FIC', 'Indonesian'],
            ['Cantik Itu Luka', 'Eka Kurniawan', 'Gramedia', 2002, 'FIC', 'Indonesian'],
            ['Sains untuk Semua', 'Yohanes Surya', 'Kandel', 2014, 'SCI', 'Indonesian'],
            ['Fisika Dasar', 'Halliday & Resnick', 'Erlangga', 2018, 'SCI', 'English'],
            ['Biologi Molekuler', 'Alberts', 'Garland', 2019, 'SCI', 'English'],
            ['Kimia Organik', 'Paula Bruice', 'Pearson', 2017, 'SCI', 'English'],
            ['Sejarah Indonesia Modern', 'M.C. Ricklefs', 'Serambi', 2008, 'HIS', 'Indonesian'],
            ['Sapiens', 'Yuval Noah Harari', 'Kepustakaan Populer', 2017, 'HIS', 'Indonesian'],
            ['Guns, Germs and Steel', 'Jared Diamond', 'W.W. Norton', 1997, 'HIS', 'English'],
            ['Kamus Besar Bahasa Indonesia', 'Badan Bahasa', 'Balai Pustaka', 2016, 'REF', 'Indonesian'],
            ['Oxford Advanced Learner Dictionary', 'Oxford Press', 'Oxford', 2020, 'REF', 'English'],
            ['Atlas Dunia Lengkap', 'National Geographic', 'Gramedia', 2021, 'REF', 'Indonesian'],
            ['English Grammar in Use', 'Raymond Murphy', 'Cambridge', 2019, 'LNG', 'English'],
            ['Bahasa Indonesia untuk SMA', 'Kemendikbud', 'Erlangga', 2020, 'LNG', 'Indonesian'],
            ['Cerita Anak Nusantara', 'Tim Penulis', 'Balai Pustaka', 2015, 'CHL', 'Indonesian'],
            ['Si Kancil dan Kawan-Kawan', 'Murti Bunanta', 'Gramedia', 2018, 'CHL', 'Indonesian'],
            ['Pemrograman Python untuk Pemula', 'Budi Raharjo', 'Informatika', 2022, 'TEC', 'Indonesian'],
            ['Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008, 'TEC', 'English'],
            ['Dasar-Dasar Kecerdasan Buatan', 'Suharjito', 'Andi Publisher', 2021, 'TEC', 'Indonesian'],
            ['Pendidikan Karakter', 'Ki Hadjar Dewantara', 'Majelis Luhur', 2011, 'REL', 'Indonesian'],
            ['Akhlak Mulia untuk Remaja', 'Ustadz Fadlan', 'Gema Insani', 2019, 'REL', 'Indonesian'],
        ];

        $branches = Branch::with('school')->get();
        $sequence = 1;

        foreach ($branches as $branch) {
            foreach ($titles as $title) {
                [$name, $author, $publisher, $year, $categoryCode, $language] = $title;

                Book::updateOrCreate(
                    ['barcode' => 'BK-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT)],
                    [
                        'school_id' => $branch->school_id,
                        'branch_id' => $branch->id,
                        'book_category_id' => $categoryModels[$categoryCode]->id,
                        'title' => $name,
                        'author' => $author,
                        'publisher' => $publisher,
                        'published_year' => $year,
                        'isbn' => '978-602-'.random_int(1000, 9999).'-'.random_int(10, 99),
                        'shelf_location' => chr(random_int(65, 72)).'-'.random_int(1, 8).''.random_int(1, 9),
                        'language' => $language,
                        'total_copies' => random_int(3, 9),
                        'available_copies' => random_int(3, 9),
                        'description' => null,
                    ]
                );

                $sequence++;
            }
        }

        // Keep available copies consistent before creating loans.
        Book::query()->update(['available_copies' => \Illuminate\Support\Facades\DB::raw('total_copies')]);

        foreach (School::with('branches')->get() as $school) {
            $students = Student::where('school_id', $school->id)->where('status', 'active')->inRandomOrder()->limit(32)->get();
            $employees = Employee::where('school_id', $school->id)->where('is_active', true)->inRandomOrder()->limit(8)->get();

            foreach ($students as $student) {
                LibraryMember::firstOrCreate(
                    ['member_type' => 'student', 'student_id' => $student->id],
                    [
                        'school_id' => $school->id,
                        'branch_id' => $student->branch_id,
                        'member_code' => 'LIB-'.strtoupper(Str::random(6)),
                        'joined_at' => Carbon::today()->subMonths(random_int(1, 18))->toDateString(),
                        'expires_at' => Carbon::today()->addYear()->toDateString(),
                        'max_loans' => 3,
                        'status' => 'active',
                    ]
                );
            }

            foreach ($employees as $employee) {
                LibraryMember::firstOrCreate(
                    ['member_type' => 'employee', 'employee_id' => $employee->id],
                    [
                        'school_id' => $school->id,
                        'branch_id' => $employee->branch_id,
                        'member_code' => 'LIB-'.strtoupper(Str::random(6)),
                        'joined_at' => Carbon::today()->subMonths(random_int(1, 24))->toDateString(),
                        'expires_at' => Carbon::today()->addYears(2)->toDateString(),
                        'max_loans' => 5,
                        'status' => 'active',
                    ]
                );
            }
        }

        $members = LibraryMember::with('student')->get();

        foreach ($members as $member) {
            $loanCount = random_int(0, 2);

            for ($i = 0; $i < $loanCount; $i++) {
                $book = Book::where('school_id', $member->school_id)->where('available_copies', '>', 0)->inRandomOrder()->first();

                if (! $book) {
                    continue;
                }

                $borrowedAt = Carbon::today()->subDays(random_int(1, 40));
                $dueAt = $borrowedAt->copy()->addDays(14);
                $returned = $dueAt->isPast() && random_int(0, 100) > 45;

                $loan = BookLoan::create([
                    'school_id' => $member->school_id,
                    'book_id' => $book->id,
                    'library_member_id' => $member->id,
                    'borrowed_at' => $borrowedAt->toDateString(),
                    'due_at' => $dueAt->toDateString(),
                    'returned_at' => $returned ? $dueAt->copy()->subDays(random_int(0, 4))->toDateString() : null,
                    'status' => $returned ? 'returned' : ($dueAt->isPast() ? 'overdue' : 'borrowed'),
                    'notes' => null,
                ]);

                if (! $returned) {
                    $book->decrement('available_copies');
                }
            }
        }
    }
}

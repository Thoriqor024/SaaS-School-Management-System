<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\ClinicVisit;
use App\Models\LibraryMember;
use App\Models\Medicine;
use App\Models\School;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function props(string $url): array
    {
        $response = $this->get($url);
        $response->assertOk();

        return $response->viewData('page')['props'] ?? [];
    }

    public function test_identity_changes_flow_into_reports_library_and_clinic(): void
    {
        $admin = User::where('email', 'admin@siswahub.test')->firstOrFail();
        $this->actingAs($admin);

        $school = School::orderBy('code')->firstOrFail();
        $activeBefore = Student::where('status', 'active')->count();
        $loansBefore = $this->props('/reports')['summary']['active_loans'];

        $this->post('/students', [
            'school_id' => $school->id, 'full_name' => 'Flow Student',
            'gender' => 'female', 'status' => 'active',
        ])->assertRedirect();
        $student = Student::where('full_name', 'Flow Student')->firstOrFail();

        $reports = $this->props('/reports');
        $this->assertSame($activeBefore + 1, $reports['summary']['students'], 'Reports must include the new student.');

        // Library: issuing a loan decrements stock, shows on the student profile and in reports.
        $book = Book::where('school_id', $school->id)->where('available_copies', '>', 0)->firstOrFail();
        $available = $book->available_copies;

        $this->post('/library/members', [
            'school_id' => $school->id, 'member_type' => 'student', 'student_id' => $student->id,
            'max_loans' => 2, 'status' => 'active',
        ])->assertRedirect();
        $member = LibraryMember::where('student_id', $student->id)->firstOrFail();

        $this->post('/library/loans', [
            'book_id' => $book->id, 'library_member_id' => $member->id,
            'borrowed_at' => now()->toDateString(), 'due_at' => now()->addWeek()->toDateString(),
        ])->assertRedirect();

        $this->assertSame($available - 1, $book->refresh()->available_copies);
        $this->get('/students/'.$student->id)->assertOk()->assertSee($book->title);
        $this->assertSame($loansBefore + 1, $this->props('/reports')['summary']['active_loans']);

        // Clinic: a visit is counted for 30 days and medicine stock follows dispenses.
        $medicine = Medicine::where('school_id', $school->id)->where('stock', '>', 10)->firstOrFail();
        $visitsBefore = $this->props('/clinic/visits')['counts']['today'];

        $this->post('/clinic/visits', [
            'school_id' => $school->id, 'patient_type' => 'student', 'student_id' => $student->id,
            'visit_date' => now()->toDateTimeString(), 'complaint' => 'Flow fever',
            'disposition' => 'returned_to_class',
        ])->assertRedirect();
        $visit = ClinicVisit::where('complaint', 'Flow fever')->firstOrFail();

        $this->assertSame($visitsBefore + 1, $this->props('/clinic/visits')['counts']['today']);

        $stock = $medicine->stock;
        $this->post('/clinic/visits/'.$visit->id.'/dispense', [
            'medicine_id' => $medicine->id, 'quantity' => 3,
        ])->assertRedirect();
        $this->assertSame($stock - 3, $medicine->refresh()->stock);

        // Transport: assigning a route shows up on the student profile.
        $route = TransportRoute::where('school_id', $school->id)->firstOrFail();
        $this->post('/transport/passengers', [
            'student_id' => $student->id, 'transport_route_id' => $route->id,
            'direction' => 'both', 'is_active' => true,
        ])->assertRedirect();
        $profile = $this->props('/students/'.$student->id);
        $this->assertSame($route->id, $profile['student']['route']['id'], 'The student profile must link the assigned route.');

        // Cafeteria: a menu can be planned for the student's school.
        $this->post('/cafeteria/menus', [
            'school_id' => $school->id, 'title' => 'Flow Menu',
            'menu_date' => now()->addDay()->toDateString(), 'meal_type' => 'lunch',
            'items' => [['name' => 'Flow Rice', 'category' => 'main']],
        ])->assertRedirect();
        $this->assertDatabaseHas('cafeteria_menus', ['title' => 'Flow Menu', 'school_id' => $school->id]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\AssetCategory;
use App\Models\Book;
use App\Models\BookCategory;
use App\Models\Branch;
use App\Models\CafeteriaInventoryItem;
use App\Models\CafeteriaMenu;
use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\MealLog;
use App\Models\Medicine;
use App\Models\Role;
use App\Models\School;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\TransportVehicle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ModuleCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_every_module_supports_create_update_and_delete(): void
    {
        $admin = User::where('email', 'admin@siswahub.test')->firstOrFail();
        $this->actingAs($admin);

        $school = School::orderBy('code')->firstOrFail();
        $branch = Branch::where('school_id', $school->id)->firstOrFail();
        $tag = substr((string) now()->timestamp, -6);

        // ---------- validation ----------
        $this->post('/students', [])->assertSessionHasErrors(['school_id', 'full_name', 'gender', 'status']);

        // ---------- schools + branches ----------
        $this->post('/schools', ['name' => 'Audit School', 'code' => 'AUD-'.$tag])->assertRedirect();
        $newSchool = School::where('code', 'AUD-'.$tag)->firstOrFail();
        $this->put('/schools/'.$newSchool->id, ['name' => 'Audit School Renamed', 'code' => 'AUD-'.$tag])->assertRedirect();
        $this->assertDatabaseHas('schools', ['id' => $newSchool->id, 'name' => 'Audit School Renamed']);

        $this->post('/schools/'.$newSchool->id.'/branches', ['name' => 'Audit Branch', 'code' => 'AB-'.$tag])->assertRedirect();
        $newBranch = Branch::where('code', 'AB-'.$tag)->firstOrFail();
        $this->put('/branches/'.$newBranch->id, ['name' => 'Audit Branch 2', 'code' => 'AB-'.$tag])->assertRedirect();
        $this->delete('/branches/'.$newBranch->id)->assertRedirect();
        $this->assertDatabaseMissing('branches', ['id' => $newBranch->id]);

        // A school with students must not be deletable.
        $this->delete('/schools/'.$school->id)->assertRedirect();
        $this->assertDatabaseHas('schools', ['id' => $school->id]);

        $this->delete('/schools/'.$newSchool->id)->assertRedirect();
        $this->assertDatabaseMissing('schools', ['id' => $newSchool->id]);

        // ---------- assets ----------
        $this->post('/assets/categories', ['name' => 'Audit Cat', 'code' => 'AC-'.$tag, 'kind' => 'fixed'])->assertRedirect();
        $category = AssetCategory::where('code', 'AC-'.$tag)->firstOrFail();
        $this->put('/assets/categories/'.$category->id, ['name' => 'Audit Cat 2', 'code' => 'AC-'.$tag, 'kind' => 'fixed'])->assertRedirect();
        $this->assertDatabaseHas('asset_categories', ['id' => $category->id, 'name' => 'Audit Cat 2']);

        $this->post('/assets', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'asset_category_id' => $category->id,
            'asset_code' => 'AST-'.$tag, 'name' => 'Audit Projector', 'type' => 'fixed', 'quantity' => 3,
            'unit' => 'unit', 'condition' => 'good', 'status' => 'in_use', 'location' => 'Lab',
        ])->assertRedirect();
        $asset = \App\Models\Asset::where('asset_code', 'AST-'.$tag)->firstOrFail();
        $this->put('/assets/'.$asset->id, [
            'school_id' => $school->id, 'asset_category_id' => $category->id, 'asset_code' => 'AST-'.$tag,
            'name' => 'Audit Projector 4K', 'type' => 'fixed', 'quantity' => 4, 'unit' => 'unit',
            'condition' => 'minor_damage', 'status' => 'maintenance',
        ])->assertRedirect();
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'quantity' => 4, 'status' => 'maintenance']);
        $this->delete('/assets/'.$asset->id)->assertRedirect();
        $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
        $this->delete('/assets/categories/'.$category->id)->assertRedirect();
        $this->assertDatabaseMissing('asset_categories', ['id' => $category->id]);

        // ---------- students ----------
        $this->post('/students', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'full_name' => 'Audit Student',
            'gender' => 'female', 'status' => 'active', 'grade_level' => '7', 'classroom' => '7A',
            'nisn' => '99'.$tag, 'guardian_name' => 'Audit Guardian', 'guardian_phone' => '081200000000',
        ])->assertRedirect();
        $student = Student::where('nisn', '99'.$tag)->firstOrFail();
        $this->get('/students/'.$student->id)->assertOk()->assertSee('Audit Student');
        $this->get('/students?search=99'.$tag)->assertOk()->assertSee('Audit Student');

        $this->put('/students/'.$student->id, [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'full_name' => 'Audit Student II',
            'gender' => 'female', 'status' => 'active', 'grade_level' => '8', 'classroom' => '8B',
        ])->assertRedirect();
        $this->assertDatabaseHas('students', ['id' => $student->id, 'classroom' => '8B', 'full_name' => 'Audit Student II']);

        // ---------- employees ----------
        $this->post('/employees', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'employee_number' => 'EMP-'.$tag,
            'full_name' => 'Audit Employee', 'gender' => 'male', 'type' => 'teacher',
            'employment_status' => 'contract', 'position' => 'Auditor', 'is_active' => true,
        ])->assertRedirect();
        $employee = Employee::where('employee_number', 'EMP-'.$tag)->firstOrFail();
        $this->get('/employees/'.$employee->id)->assertOk()->assertSee('Audit Employee');
        $this->put('/employees/'.$employee->id, [
            'school_id' => $school->id, 'employee_number' => 'EMP-'.$tag, 'full_name' => 'Audit Employee',
            'gender' => 'male', 'type' => 'staff', 'employment_status' => 'permanent', 'is_active' => true,
        ])->assertRedirect();
        $this->assertDatabaseHas('employees', ['id' => $employee->id, 'type' => 'staff']);

        // ---------- access ----------
        $librarian = Role::where('slug', 'librarian')->firstOrFail();
        $email = 'audit-'.$tag.'@siswahub.test';
        $this->post('/access/users', [
            'name' => 'Audit User', 'email' => $email, 'password' => 'password123',
            'roles' => [$librarian->id], 'school_id' => $school->id, 'is_active' => true,
        ])->assertRedirect();
        $account = User::where('email', $email)->firstOrFail();
        $this->assertDatabaseHas('role_user', ['user_id' => $account->id, 'role_id' => $librarian->id]);

        $this->put('/access/users/'.$account->id, [
            'name' => 'Audit User 2', 'email' => $email, 'roles' => [$librarian->id], 'is_active' => false,
        ])->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $account->id, 'is_active' => false]);
        $this->delete('/access/users/'.$account->id)->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $account->id]);

        $originalPermissions = $librarian->permissions()->pluck('permissions.id')->all();
        $this->put('/access/roles/'.$librarian->id.'/permissions', [
            'permissions' => array_slice($originalPermissions, 0, 2),
        ])->assertRedirect();
        $this->assertCount(2, $librarian->permissions()->get());
        $this->put('/access/roles/'.$librarian->id.'/permissions', ['permissions' => $originalPermissions])->assertRedirect();
        $this->assertCount(count($originalPermissions), $librarian->permissions()->get());

        // ---------- transport ----------
        $this->post('/transport/vehicles', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'plate_number' => 'B'.$tag.'AUD',
            'type' => 'bus', 'capacity' => 40, 'condition' => 'good', 'status' => 'active', 'brand' => 'Audit',
        ])->assertRedirect();
        $vehicle = TransportVehicle::where('plate_number', 'B'.$tag.'AUD')->firstOrFail();
        $this->put('/transport/vehicles/'.$vehicle->id, [
            'school_id' => $school->id, 'plate_number' => 'B'.$tag.'AUD', 'type' => 'minibus',
            'capacity' => 20, 'condition' => 'good', 'status' => 'maintenance',
        ])->assertRedirect();
        $this->assertDatabaseHas('transport_vehicles', ['id' => $vehicle->id, 'capacity' => 20]);

        $this->post('/transport/routes', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'transport_vehicle_id' => $vehicle->id,
            'code' => 'RT-'.$tag, 'name' => 'Audit Route',
            'stops' => [
                ['name' => 'Stop A', 'pickup_time' => '06:30'],
                ['name' => 'Stop B', 'pickup_time' => '06:45'],
            ],
        ])->assertRedirect();
        $route = TransportRoute::where('code', 'RT-'.$tag)->firstOrFail();
        $this->assertCount(2, $route->stops()->get());

        $this->put('/transport/routes/'.$route->id, [
            'school_id' => $school->id, 'transport_vehicle_id' => $vehicle->id, 'code' => 'RT-'.$tag,
            'name' => 'Audit Route X', 'stops' => [['name' => 'Stop Only']],
        ])->assertRedirect();
        $this->assertCount(1, $route->stops()->get());
        $this->assertDatabaseHas('transport_routes', ['id' => $route->id, 'name' => 'Audit Route X']);

        $this->post('/transport/passengers', [
            'student_id' => $student->id, 'transport_route_id' => $route->id,
            'direction' => 'both', 'start_date' => now()->toDateString(), 'is_active' => true,
        ])->assertRedirect();
        $passenger = \App\Models\TransportPassenger::where('transport_route_id', $route->id)->firstOrFail();
        $this->put('/transport/passengers/'.$passenger->id, ['direction' => 'pickup', 'is_active' => false])->assertRedirect();
        $this->assertDatabaseHas('transport_passengers', ['id' => $passenger->id, 'direction' => 'pickup']);
        $this->delete('/transport/passengers/'.$passenger->id)->assertRedirect();
        $this->assertDatabaseMissing('transport_passengers', ['id' => $passenger->id]);

        $this->post('/transport/logs', [
            'transport_route_id' => $route->id, 'student_id' => $student->id,
            'log_date' => now()->toDateString(), 'direction' => 'pickup', 'status' => 'picked_up',
        ])->assertRedirect();
        $log = \App\Models\PassengerLog::where('transport_route_id', $route->id)->firstOrFail();
        $this->assertSame($school->id, $log->school_id);
        $this->delete('/transport/logs/'.$log->id)->assertRedirect();
        $this->assertDatabaseMissing('passenger_logs', ['id' => $log->id]);

        $this->delete('/transport/routes/'.$route->id)->assertRedirect();
        $this->assertDatabaseMissing('route_stops', ['transport_route_id' => $route->id]);
        $this->delete('/transport/vehicles/'.$vehicle->id)->assertRedirect();

        // ---------- library ----------
        $this->post('/library/categories', ['name' => 'Audit Books', 'code' => 'BC-'.$tag])->assertRedirect();
        $bookCategory = BookCategory::where('code', 'BC-'.$tag)->firstOrFail();
        $this->put('/library/categories/'.$bookCategory->id, ['name' => 'Audit Books 2', 'code' => 'BC-'.$tag])->assertRedirect();

        // No barcode supplied on purpose: the catalogue must generate one.
        $this->post('/library/books', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'book_category_id' => $bookCategory->id,
            'title' => 'Audit Book', 'author' => 'Auditor', 'total_copies' => 2, 'available_copies' => 2,
        ])->assertRedirect();
        $book = Book::where('title', 'Audit Book')->firstOrFail();
        $this->assertNotEmpty($book->barcode);

        $this->put('/library/books/'.$book->id, [
            'school_id' => $school->id, 'book_category_id' => $bookCategory->id, 'title' => 'Audit Book',
            'total_copies' => 3, 'available_copies' => 3,
        ])->assertRedirect();
        $this->assertDatabaseHas('books', ['id' => $book->id, 'total_copies' => 3]);

        $this->post('/library/members', [
            'school_id' => $school->id, 'member_type' => 'student', 'student_id' => $student->id,
            'max_loans' => 3, 'status' => 'active',
        ])->assertRedirect();
        $member = LibraryMember::where('student_id', $student->id)->firstOrFail();

        $this->post('/library/loans', [
            'book_id' => $book->id, 'library_member_id' => $member->id,
            'borrowed_at' => now()->toDateString(), 'due_at' => now()->addDays(14)->toDateString(),
        ])->assertRedirect();
        $loan = $book->loans()->firstOrFail();
        $this->assertSame(2, $book->refresh()->available_copies);
        $this->get('/students/'.$student->id)->assertOk()->assertSee('Audit Book');

        $this->post('/library/loans/'.$loan->id.'/return', [])->assertRedirect();
        $this->assertDatabaseHas('book_loans', ['id' => $loan->id, 'status' => 'returned']);
        $this->assertSame(3, $book->refresh()->available_copies);
        $this->delete('/library/loans/'.$loan->id)->assertRedirect();

        $this->put('/library/members/'.$member->id, ['max_loans' => 5, 'status' => 'suspended'])->assertRedirect();
        $this->assertDatabaseHas('library_members', ['id' => $member->id, 'max_loans' => 5]);
        $this->delete('/library/members/'.$member->id)->assertRedirect();
        $this->delete('/library/books/'.$book->id)->assertRedirect();
        $this->delete('/library/categories/'.$bookCategory->id)->assertRedirect();

        // ---------- clinic ----------
        $this->post('/clinic/medicines', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'name' => 'Audit Medicine',
            'category' => 'analgesic', 'unit' => 'tablet', 'stock' => 20, 'min_stock' => 5,
        ])->assertRedirect();
        $medicine = Medicine::where('name', 'Audit Medicine')->firstOrFail();
        $this->put('/clinic/medicines/'.$medicine->id, [
            'school_id' => $school->id, 'name' => 'Audit Medicine', 'category' => 'analgesic',
            'unit' => 'tablet', 'stock' => 30, 'min_stock' => 10,
        ])->assertRedirect();
        $this->assertSame(30, $medicine->refresh()->stock);

        $this->post('/clinic/visits', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'patient_type' => 'student',
            'student_id' => $student->id, 'visit_date' => now()->toDateTimeString(),
            'complaint' => 'Audit complaint', 'temperature' => 37.5, 'disposition' => 'returned_to_class',
        ])->assertRedirect();
        $visit = ClinicVisit::where('complaint', 'Audit complaint')->firstOrFail();
        $this->put('/clinic/visits/'.$visit->id, [
            'school_id' => $school->id, 'patient_type' => 'student', 'student_id' => $student->id,
            'visit_date' => now()->toDateTimeString(), 'complaint' => 'Audit complaint',
            'diagnosis' => 'Mild fever', 'disposition' => 'sent_home',
        ])->assertRedirect();
        $this->assertDatabaseHas('clinic_visits', ['id' => $visit->id, 'disposition' => 'sent_home']);

        $this->post('/clinic/visits/'.$visit->id.'/dispense', [
            'medicine_id' => $medicine->id, 'quantity' => 4, 'dosage_instructions' => '3x1',
        ])->assertRedirect();
        $this->assertSame(26, $medicine->refresh()->stock);
        $this->assertDatabaseHas('medicine_dispenses', ['clinic_visit_id' => $visit->id, 'quantity' => 4]);

        $this->delete('/clinic/visits/'.$visit->id)->assertRedirect();
        $this->assertSame(30, $medicine->refresh()->stock, 'Deleting a visit restores dispensed stock.');

        $this->post('/clinic/records', [
            'school_id' => $school->id, 'patient_type' => 'student', 'student_id' => $student->id,
            'blood_type' => 'O', 'allergies' => 'Audit allergy', 'emergency_contact_name' => 'Audit Guardian',
        ])->assertRedirect();
        $record = \App\Models\MedicalRecord::where('student_id', $student->id)->firstOrFail();
        $this->put('/clinic/records/'.$record->id, ['blood_type' => 'O', 'allergies' => 'Audit allergy 2'])->assertRedirect();
        $this->assertDatabaseHas('medical_records', ['id' => $record->id, 'allergies' => 'Audit allergy 2']);
        $this->delete('/clinic/records/'.$record->id)->assertRedirect();
        $this->delete('/clinic/medicines/'.$medicine->id)->assertRedirect();

        // ---------- cafeteria ----------
        $this->post('/cafeteria/menus', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'title' => 'Audit Menu',
            'menu_date' => now()->toDateString(), 'meal_type' => 'lunch',
            'items' => [
                ['name' => 'Audit Rice', 'category' => 'main', 'calories' => 400],
                ['name' => 'Audit Soup', 'category' => 'side'],
            ],
        ])->assertRedirect();
        $menu = CafeteriaMenu::where('title', 'Audit Menu')->firstOrFail();
        $this->assertCount(2, $menu->items()->get());
        $this->put('/cafeteria/menus/'.$menu->id, [
            'school_id' => $school->id, 'title' => 'Audit Menu X', 'menu_date' => now()->toDateString(),
            'meal_type' => 'lunch', 'items' => [['name' => 'Audit Rice Only', 'category' => 'main']],
        ])->assertRedirect();
        $this->assertCount(1, $menu->items()->get());

        $this->post('/cafeteria/inventory', [
            'school_id' => $school->id, 'name' => 'Audit Stock', 'category' => 'dry_goods',
            'unit' => 'kg', 'quantity' => 10, 'min_quantity' => 2,
        ])->assertRedirect();
        $item = CafeteriaInventoryItem::where('name', 'Audit Stock')->firstOrFail();
        $this->put('/cafeteria/inventory/'.$item->id, [
            'school_id' => $school->id, 'name' => 'Audit Stock', 'category' => 'dry_goods',
            'unit' => 'kg', 'quantity' => 12, 'min_quantity' => 3,
        ])->assertRedirect();
        $this->assertSame(12.0, (float) $item->refresh()->quantity);
        $this->post('/cafeteria/inventory/'.$item->id.'/restock', ['quantity' => 5])->assertRedirect();
        $this->assertSame(17.0, (float) $item->refresh()->quantity);
        $this->assertNotNull($item->last_restocked_at);

        $this->post('/cafeteria/meal-logs', [
            'school_id' => $school->id, 'branch_id' => $branch->id, 'cafeteria_menu_id' => $menu->id,
            'meal_date' => now()->toDateString(), 'meal_type' => 'lunch',
            'students_served' => 100, 'staff_served' => 10, 'guests_served' => 2,
        ])->assertRedirect();
        $mealLog = MealLog::where('students_served', 100)->where('school_id', $school->id)->firstOrFail();
        $this->put('/cafeteria/meal-logs/'.$mealLog->id, [
            'meal_date' => now()->toDateString(), 'meal_type' => 'lunch',
            'students_served' => 120, 'staff_served' => 11,
        ])->assertRedirect();
        $this->assertDatabaseHas('meal_logs', ['id' => $mealLog->id, 'students_served' => 120]);
        $this->delete('/cafeteria/meal-logs/'.$mealLog->id)->assertRedirect();

        $this->delete('/cafeteria/inventory/'.$item->id)->assertRedirect();
        $this->delete('/cafeteria/menus/'.$menu->id)->assertRedirect();

        // ---------- cleanup: identity records ----------
        $this->delete('/students/'.$student->id)->assertRedirect();
        $this->assertDatabaseMissing('students', ['id' => $student->id]);
        $this->delete('/employees/'.$employee->id)->assertRedirect();
        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);

        $this->assertTrue(Str::isUuid($student->id));
    }
}

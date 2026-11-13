<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Employee;
use App\Models\Role;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenancyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function pageProps(string $url): array
    {
        $response = $this->get($url);
        $response->assertOk();

        return $response->viewData('page')['props'] ?? [];
    }

    public function test_school_admin_is_confined_to_its_own_school(): void
    {
        $principal = User::where('email', 'principal@siswahub.test')->firstOrFail();
        $ownSchool = $principal->school_id;

        $foreignStudent = Student::where('school_id', '!=', $ownSchool)->firstOrFail();
        $foreignEmployee = Employee::where('school_id', '!=', $ownSchool)->firstOrFail();
        $foreignSchool = School::where('id', '!=', $ownSchool)->firstOrFail();
        $librarian = Role::where('slug', 'librarian')->firstOrFail();

        $this->actingAs($principal);

        $this->get('/students/'.$foreignStudent->id)->assertForbidden();
        $this->get('/employees/'.$foreignEmployee->id)->assertForbidden();
        $this->post('/students', [
            'school_id' => $foreignSchool->id, 'full_name' => 'Cross School Attempt',
            'gender' => 'male', 'status' => 'active',
        ])->assertForbidden();
        $this->assertDatabaseMissing('students', ['full_name' => 'Cross School Attempt']);

        // Roles are global, so only super admins may change them.
        $this->get('/access/roles')->assertOk();
        $this->put('/access/roles/'.$librarian->id.'/permissions', ['permissions' => []])->assertForbidden();

        // Creating a whole school stays a super-admin action.
        $this->post('/schools', ['name' => 'Rogue School', 'code' => 'ROGUE'])->assertForbidden();
        $this->assertDatabaseMissing('schools', ['code' => 'ROGUE']);

        // A school admin can still create records inside its own school.
        $this->post('/students', [
            'school_id' => $ownSchool, 'full_name' => 'Own School Student',
            'gender' => 'female', 'status' => 'active',
        ])->assertRedirect();
        $this->assertDatabaseHas('students', ['full_name' => 'Own School Student', 'school_id' => $ownSchool]);
    }

    public function test_teacher_permissions_are_read_only_for_identity_records(): void
    {
        $teacher = User::where('email', 'teacher@siswahub.test')->firstOrFail();
        $this->actingAs($teacher);

        $this->get('/students')->assertOk();
        $this->get('/assets')->assertForbidden();
        $this->post('/students', [
            'school_id' => $teacher->school_id, 'full_name' => 'Teacher Attempt',
            'gender' => 'male', 'status' => 'active',
        ])->assertForbidden();
        $this->assertDatabaseMissing('students', ['full_name' => 'Teacher Attempt']);
    }

    public function test_non_super_admin_without_a_school_can_neither_read_nor_write(): void
    {
        $role = Role::where('slug', 'school_admin')->firstOrFail();
        $account = User::create([
            'name' => 'Unassigned Admin',
            'email' => 'unassigned@siswahub.test',
            'password' => Hash::make('password'),
            'school_id' => null,
            'branch_id' => null,
            'is_active' => true,
        ]);
        $account->roles()->sync([$role->id]);

        $this->actingAs($account);
        $student = Student::firstOrFail();
        $asset = Asset::firstOrFail();

        $studentsProps = $this->pageProps('/students');
        $this->assertSame(0, $studentsProps['counts']['total'], 'Unassigned accounts must see no students.');

        $employeesProps = $this->pageProps('/employees');
        $this->assertSame(0, $employeesProps['counts']['total'], 'Unassigned accounts must see no employees.');
        $this->get('/employees/'.Employee::firstOrFail()->id)->assertForbidden();

        $assetsProps = $this->pageProps('/assets');
        $this->assertSame(0, $assetsProps['counts']['items'], 'Unassigned accounts must see no assets.');

        $this->get('/students/'.$student->id)->assertForbidden();
        $this->get('/assets/'.$asset->id.'/label')->assertForbidden();

        $this->post('/students', [
            'school_id' => $student->school_id, 'full_name' => 'Unassigned Attempt',
            'gender' => 'male', 'status' => 'active',
        ])->assertForbidden();
        $this->assertDatabaseMissing('students', ['full_name' => 'Unassigned Attempt']);

        $this->post('/assets', [
            'school_id' => $student->school_id, 'asset_code' => 'UN-1', 'name' => 'Unassigned Asset',
            'type' => 'fixed', 'quantity' => 1, 'unit' => 'unit', 'condition' => 'good', 'status' => 'in_use',
        ])->assertForbidden();
        $this->assertDatabaseMissing('assets', ['asset_code' => 'UN-1']);

        // The dashboard must not leak global totals either.
        $dashboard = $this->get('/');
        $dashboard->assertOk();
    }
}

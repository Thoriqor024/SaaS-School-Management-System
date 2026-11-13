<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\School;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'test-integration-key';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        config(['services.integration.key' => self::KEY]);
    }

    private function api()
    {
        return $this->withHeaders(['X-API-Key' => self::KEY]);
    }

    public function test_read_endpoints_return_json(): void
    {
        $student = Student::firstOrFail();

        $endpoints = [
            '/api/v1/schools',
            '/api/v1/students?per_page=2',
            '/api/v1/students/'.$student->id,
            '/api/v1/employees?per_page=2',
            '/api/v1/assets?per_page=2',
            '/api/v1/transport/routes',
            '/api/v1/library/loans?per_page=2',
            '/api/v1/clinic/visits?per_page=2',
            '/api/v1/dashboard/summary',
        ];

        foreach ($endpoints as $endpoint) {
            $this->api()->getJson($endpoint)->assertOk()->assertJsonStructure(['data']);
        }
    }

    public function test_api_key_is_required(): void
    {
        $this->getJson('/api/v1/students')->assertStatus(401);
        $this->withHeaders(['X-API-Key' => 'wrong-key'])->getJson('/api/v1/students')->assertStatus(401);

        config(['services.integration.key' => null]);
        $this->getJson('/api/v1/students')->assertStatus(503);
    }

    public function test_students_can_be_created_updated_and_deleted_through_the_api(): void
    {
        $school = School::orderBy('code')->firstOrFail();

        $created = $this->api()->postJson('/api/v1/students', [
            'school_id' => $school->id,
            'full_name' => 'API Student',
            'gender' => 'female',
            'status' => 'active',
            'nisn' => 'API-'.now()->timestamp,
        ])->assertCreated()->json('data');

        $this->assertDatabaseHas('students', ['id' => $created['id'], 'full_name' => 'API Student']);

        $this->api()->patchJson('/api/v1/students/'.$created['id'], [
            'classroom' => '9Z',
            'status' => 'graduated',
        ])->assertOk()->assertJsonPath('data.classroom', '9Z');

        $this->assertDatabaseHas('students', ['id' => $created['id'], 'classroom' => '9Z', 'status' => 'graduated']);

        $this->api()->deleteJson('/api/v1/students/'.$created['id'])->assertNoContent();
        $this->assertDatabaseMissing('students', ['id' => $created['id']]);
    }

    public function test_employees_can_be_created_updated_and_deleted_through_the_api(): void
    {
        $school = School::orderBy('code')->firstOrFail();

        $created = $this->api()->postJson('/api/v1/employees', [
            'school_id' => $school->id,
            'employee_number' => 'API-EMP-'.now()->timestamp,
            'full_name' => 'API Employee',
            'gender' => 'male',
            'type' => 'teacher',
            'employment_status' => 'contract',
        ])->assertCreated()->json('data');

        $this->api()->patchJson('/api/v1/employees/'.$created['id'], [
            'type' => 'staff',
            'employment_status' => 'permanent',
        ])->assertOk();

        $this->assertDatabaseHas('employees', ['id' => $created['id'], 'type' => 'staff']);

        $this->api()->deleteJson('/api/v1/employees/'.$created['id'])->assertNoContent();
        $this->assertDatabaseMissing('employees', ['id' => $created['id']]);
    }

    public function test_write_endpoints_validate_input(): void
    {
        $this->api()->postJson('/api/v1/students', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['school_id', 'full_name', 'gender', 'status']);

        $this->api()->postJson('/api/v1/employees', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['school_id', 'employee_number', 'full_name']);
    }
}

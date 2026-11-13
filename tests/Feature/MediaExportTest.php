<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Storage::fake('public');
    }

    /**
     * A real 1x1 PNG, so the upload passes the `image` validation rule without GD.
     */
    private function fakeImage(string $name): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    public function test_student_and_employee_photos_are_uploaded_and_removed(): void
    {
        $admin = User::where('email', 'admin@siswahub.test')->firstOrFail();
        $this->actingAs($admin);
        $school = School::orderBy('code')->firstOrFail();

        $this->post('/students', [
            'school_id' => $school->id, 'full_name' => 'Photo Student',
            'gender' => 'female', 'status' => 'active',
            'photo' => $this->fakeImage('student.png'),
        ])->assertRedirect();

        $student = Student::where('full_name', 'Photo Student')->firstOrFail();
        $this->assertNotNull($student->photo_path);
        Storage::disk('public')->assertExists($student->photo_path);
        $storedPath = $student->photo_path;

        $profile = $this->get('/students/'.$student->id)->assertOk()->viewData('page')['props'];
        $this->assertStringStartsWith('/storage/photos/students/', $profile['student']['photo_url']);

        $this->put('/students/'.$student->id, [
            'school_id' => $school->id, 'full_name' => 'Photo Student',
            'gender' => 'female', 'status' => 'active', 'remove_photo' => true,
        ])->assertRedirect();

        $this->assertNull($student->refresh()->photo_path);
        Storage::disk('public')->assertMissing($storedPath);

        $this->post('/employees', [
            'school_id' => $school->id, 'employee_number' => 'PH-1', 'full_name' => 'Photo Employee',
            'gender' => 'male', 'type' => 'staff', 'employment_status' => 'permanent',
            'photo' => $this->fakeImage('employee.png'),
        ])->assertRedirect();

        $employee = \App\Models\Employee::where('employee_number', 'PH-1')->firstOrFail();
        $this->assertNotNull($employee->photo_path);
        Storage::disk('public')->assertExists($employee->photo_path);

        $this->put('/employees/'.$employee->id, [
            'school_id' => $school->id, 'employee_number' => 'PH-1', 'full_name' => 'Photo Employee',
            'gender' => 'male', 'type' => 'staff', 'employment_status' => 'permanent',
        ])->assertRedirect();
        Storage::disk('public')->assertExists($employee->refresh()->photo_path);
    }

    public function test_barcode_and_qr_labels_render_and_scan_finds_the_record(): void
    {
        $admin = User::where('email', 'admin@siswahub.test')->firstOrFail();
        $this->actingAs($admin);

        $book = Book::whereNotNull('barcode')->firstOrFail();
        $label = $this->get('/library/books/'.$book->id.'/label')->assertOk();
        $props = $label->viewData('page')['props'];

        $this->assertSame('Library/Label', $label->viewData('page')['component']);
        $this->assertStringContainsString('<svg', $props['barcode']);
        $this->assertStringContainsString('<svg', $props['qr']);
        $this->assertSame($book->barcode, $props['code']);

        $scan = $this->get('/library/scan?code='.urlencode($book->barcode))->assertOk();
        $scanProps = $scan->viewData('page')['props'];
        $this->assertSame($book->id, $scanProps['books'][0]['id']);
        $this->assertSame($book->barcode, $scanProps['books'][0]['barcode']);

        $asset = \App\Models\Asset::firstOrFail();
        $assetLabel = $this->get('/assets/'.$asset->id.'/label')->assertOk();
        $assetProps = $assetLabel->viewData('page')['props'];
        $this->assertSame($asset->asset_code, $assetProps['code']);
        $this->assertStringContainsString('<svg', $assetProps['barcode']);
    }

    public function test_reports_can_be_exported_as_csv_and_pdf(): void
    {
        $admin = User::where('email', 'admin@siswahub.test')->firstOrFail();
        $this->actingAs($admin);

        $csv = $this->get('/reports/export?format=csv')->assertOk();
        $this->assertStringContainsString('text/csv', $csv->headers->get('content-type'));
        $this->assertStringContainsString('SiswaHub cross-module report', $csv->streamedContent());

        $pdf = $this->get('/reports/export?format=pdf')->assertOk();
        $this->assertSame('application/pdf', $pdf->headers->get('content-type'));
        $this->assertStringStartsWith('%PDF', $pdf->getContent());

        $school = School::firstOrFail();
        $this->get('/reports/export?format=csv&school_id='.$school->id)->assertOk();
    }
}

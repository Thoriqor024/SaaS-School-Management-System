<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Book;
use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_every_module_page_renders_for_the_super_admin(): void
    {
        $admin = User::where('email', 'admin@siswahub.test')->firstOrFail();
        $this->actingAs($admin);

        $student = Student::firstOrFail();
        $employee = Employee::firstOrFail();
        $asset = Asset::firstOrFail();
        $route = TransportRoute::firstOrFail();
        $book = Book::where('available_copies', '>', 0)->firstOrFail();
        $visit = ClinicVisit::firstOrFail();

        $pages = [
            '/',
            '/students', '/students/create', '/students/'.$student->id, '/students/'.$student->id.'/edit',
            '/employees', '/employees/create', '/employees/'.$employee->id, '/employees/'.$employee->id.'/edit',
            '/schools', '/access/users', '/access/roles',
            '/assets', '/assets/create', '/assets/'.$asset->id.'/edit', '/assets/categories',
            '/transport/vehicles', '/transport/routes', '/transport/routes/create', '/transport/routes/'.$route->id.'/edit',
            '/transport/passengers', '/transport/logs',
            '/library/books', '/library/books/create', '/library/books/'.$book->id.'/edit',
            '/library/members', '/library/loans', '/library/categories', '/library/scan',
            '/library/scan?code='.$book->barcode,
            '/library/books/'.$book->id.'/label',
            '/assets/'.$asset->id.'/label',
            '/clinic/visits', '/clinic/visits/create', '/clinic/visits/'.$visit->id.'/edit', '/clinic/medicines', '/clinic/records',
            '/cafeteria/menus', '/cafeteria/inventory', '/cafeteria/meal-logs',
            '/reports', '/reports?school_id='.$student->school_id, '/settings/integration',
        ];

        foreach ($pages as $page) {
            $this->get($page)->assertOk();
        }
    }

    public function test_login_screen_renders_the_sign_in_form(): void
    {
        $response = $this->get('/login');
        $response->assertOk();

        $page = $response->viewData('page');
        $this->assertSame('Auth/Login', $page['component']);
    }
}

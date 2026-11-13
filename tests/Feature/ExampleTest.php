<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_guests_are_redirected_to_the_login_screen(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }

    public function test_the_login_screen_renders(): void
    {
        $this->get('/login')->assertOk();
    }
}

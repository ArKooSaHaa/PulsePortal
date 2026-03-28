<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class AuthTest extends TestCase
{
    use RefreshDatabase;

    // Patient valid registration
    public function test_patient_can_register()
    {
        $this->withoutExceptionHandling();
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test Patient',
            'email'                 => 'patient.test@gmail.com',
            'password'              => 'Password1',   
            'password_confirmation' => 'Password1',  
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success');
    }

    public function test_weak_password()
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test Patient',
            'email'                 => 'patient.test@gmail.com',
            'password'              => 'password',   // no uppercase or number
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(422); //422 - for unprocessable content
    }

    public function test_duplicate_email()
    {
        $data = [
            'name'                  => 'Test Patient',
            'email'                 => 'patient.test@gmail.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
        ];

        $this->postJson('/api/auth/register', $data); 
        $response = $this->postJson('/api/auth/register', $data); // duplicate

        $response->assertStatus(422); 
    }
}
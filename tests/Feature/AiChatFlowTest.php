<?php

namespace Tests\Feature;

use App\Http\Services\LlmService;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class AiChatFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $patientUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->patientUser = User::create([
            'name' => 'Patient One',
            'email' => 'patient.one@example.com',
            'password' => bcrypt('Password123'),
            'role' => 'patient',
        ]);

        Patient::create([
            'user_id' => $this->patientUser->id,
            'phone' => '01700000000',
        ]);

        $doctorUser = User::create([
            'name' => 'Dr. General',
            'email' => 'doctor.general@example.com',
            'password' => bcrypt('Password123'),
            'role' => 'doctor',
        ]);

        Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'General Medicine',
            'department' => 'General Medicine',
            'consultation_fee' => 900,
            'is_available' => true,
            'availability' => [
                'service_hours' => [
                    'start' => '09:00',
                    'end' => '17:00',
                ],
            ],
        ]);
    }

    public function test_chat_api_progresses_from_collect_to_confirm_to_advice_stages(): void
    {
        $this->mock(LlmService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('askLlm')
                ->once()
                ->andReturn(<<<'TEXT'
Likely possibilities:
- Viral upper-respiratory or flu-like illness.

Care plan:
- Rest and drink enough fluids.
- Monitor temperature and hydration status.

Medicine options (OTC only):
- Paracetamol as per package label.
- Oral rehydration salts as per package label.

When to seek urgent care:
- Breathing difficulty, persistent vomiting, or severe chest pain.

Recommended specialist:
- General Physician
TEXT);
        });

        $collectResponse = $this->actingAs($this->patientUser, 'api')
            ->postJson('/api/patient/ai/chat', [
                'message' => 'Headache',
            ]);

        $collectResponse->assertStatus(200)
            ->assertJsonPath('stage', 'collect')
            ->assertJsonPath('emergency', false)
            ->assertJsonCount(0, 'doctors');

        $collectAssistantMessage = (string) $collectResponse->json('message');

        $confirmResponse = $this->actingAs($this->patientUser, 'api')
            ->postJson('/api/patient/ai/chat', [
                'message' => 'Headache and fever for 2 days, pain 6/10, no other symptoms.',
                'history' => [
                    ['role' => 'user', 'content' => 'Headache'],
                    ['role' => 'assistant', 'content' => $collectAssistantMessage],
                ],
            ]);

        $confirmResponse->assertStatus(200)
            ->assertJsonPath('stage', 'confirm')
            ->assertJsonPath('emergency', false)
            ->assertJsonCount(0, 'doctors');

        $confirmAssistantMessage = (string) $confirmResponse->json('message');

        $adviceResponse = $this->actingAs($this->patientUser, 'api')
            ->postJson('/api/patient/ai/chat', [
                'message' => 'confirm',
                'history' => [
                    ['role' => 'user', 'content' => 'Headache and fever for 2 days, pain 6/10, no other symptoms.'],
                    ['role' => 'assistant', 'content' => $confirmAssistantMessage],
                ],
            ]);

        $adviceResponse->assertStatus(200)
            ->assertJsonPath('stage', 'advice')
            ->assertJsonPath('specialization', 'General Physician')
            ->assertJsonPath('emergency', false)
            ->assertJsonCount(1, 'doctors')
            ->assertJsonPath('doctors.0.name', 'Dr. General');

        $this->assertStringContainsString(
            'Medicine options (OTC only):',
            (string) $adviceResponse->json('message')
        );
    }
}

<?php

namespace Tests\Unit;

use App\Http\Services\TriageService;
use PHPUnit\Framework\TestCase;

class TriageServiceTest extends TestCase
{
    public function test_it_detects_emergency_keywords_without_llm(): void
    {
        $service = new TriageService();

        $this->assertSame(
            '⚠️ This may be an emergency. Seek immediate medical care.',
            $service->checkEmergency('I have chest pain and sweating.')
        );
    }

    public function test_it_maps_common_symptoms_to_specialists(): void
    {
        $service = new TriageService();

        $this->assertSame('General Physician', $service->mapSpecialist('Fever for two days'));
        $this->assertSame('Cardiologist', $service->mapSpecialist('Chest tightness'));
        $this->assertSame('Dermatologist', $service->mapSpecialist('Skin rash and itching'));
        $this->assertSame('Gastroenterologist', $service->mapSpecialist('Stomach pain after meals'));
    }

    public function test_chat_reply_starts_with_collection_when_details_are_missing(): void
    {
        $service = new TriageService();

        $reply = $service->buildChatReply(
            'I have headache.',
            [],
            fn (string $prompt): string => $prompt,
        );

        $this->assertSame('collect', $reply['stage']);
        $this->assertFalse($reply['show_doctors']);
        $this->assertStringContainsString('missing details', strtolower($reply['message']));
    }

    public function test_chat_reply_requires_confirmation_after_complete_symptom_snapshot(): void
    {
        $service = new TriageService();

        $reply = $service->buildChatReply(
            'Headache and fever for 2 days, pain 6/10, no other symptoms.',
            [],
            fn (string $prompt): string => $prompt,
        );

        $this->assertSame('confirm', $reply['stage']);
        $this->assertFalse($reply['show_doctors']);
        $this->assertStringContainsString('Reply with "confirm"', $reply['message']);
    }

    public function test_chat_reply_returns_advice_after_user_confirms(): void
    {
        $service = new TriageService();

        $reply = $service->buildChatReply(
            'confirm',
            [
                ['role' => 'user', 'content' => 'Headache and fever for 2 days, pain 6/10, no other symptoms.'],
                ['role' => 'assistant', 'content' => 'Reply with "confirm" to continue.'],
            ],
            fn (string $prompt): string => "Likely possibilities:\n- Viral illness\n\nCare plan:\n- Rest\n\nMedicine options (OTC only):\n- Paracetamol\n\nWhen to seek urgent care:\n- Breathing difficulty\n\nRecommended specialist:\n- General Physician",
        );

        $this->assertSame('advice', $reply['stage']);
        $this->assertTrue($reply['show_doctors']);
        $this->assertStringContainsString('Medicine options (OTC only):', $reply['message']);
    }
}

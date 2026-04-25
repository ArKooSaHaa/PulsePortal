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

    public function test_prompt_includes_recent_memory_and_required_format(): void
    {
        $service = new TriageService();

        $prompt = $service->buildPrompt('I still have fever.', [
            ['role' => 'user', 'content' => 'I feel weak.'],
            ['role' => 'assistant', 'content' => 'Possible causes: * Viral illness'],
        ]);

        $this->assertStringContainsString('User: I feel weak.', $prompt);
        $this->assertStringContainsString('Assistant: Possible causes: * Viral illness', $prompt);
        $this->assertStringContainsString('Possible causes:', $prompt);
        $this->assertStringContainsString('Advice:', $prompt);
        $this->assertStringContainsString('Follow-up question:', $prompt);
    }
}

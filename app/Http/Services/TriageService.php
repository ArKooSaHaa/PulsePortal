<?php

namespace App\Http\Services;

class TriageService
{
    public const DISCLAIMER = 'This AI provides general health information only. Consult a doctor.';

    private const SYSTEM_PROMPT = <<<'PROMPT'
You are a medical triage assistant for PulsePortal.

Strict rules:
- Ask follow-up symptom questions.
- Do NOT give a final diagnosis.
- Suggest only possible conditions.
- Give short, clear advice.
- Always recommend doctor consultation.
- Keep responses under 120 words.
- Do not recommend prescription drugs.
- No unsafe medical advice.
- No creative writing.
- Support English and Bangla. Reply in the user's language when clear, but keep the section labels exactly as shown.

MANDATORY RESPONSE FORMAT:
Possible causes:
* ...

Advice:
* ...

Follow-up question:
* ...
PROMPT;

    private const EMERGENCY_KEYWORDS = [
        'chest pain',
        'breathing difficulty',
        'difficulty breathing',
        'shortness of breath',
        'unconscious',
        'seizure',
        'severe bleeding',
        'বুকে ব্যথা',
        'শ্বাসকষ্ট',
        'অজ্ঞান',
        'খিঁচুনি',
        'অতিরিক্ত রক্তপাত',
    ];

    public function checkEmergency(string $text): ?string
    {
        $normalized = $this->normalize($text);

        foreach (self::EMERGENCY_KEYWORDS as $keyword) {
            if (str_contains($normalized, $this->normalize($keyword))) {
                return '⚠️ This may be an emergency. Seek immediate medical care.';
            }
        }

        return null;
    }

    public function mapSpecialist(string $userText): string
    {
        $text = $this->normalize($userText);

        if ($this->hasAny($text, ['chest pain', 'chest tightness', 'heart pain', 'বুকে ব্যথা'])) {
            return 'Cardiologist';
        }

        if ($this->hasAny($text, ['skin issue', 'skin issues', 'rash', 'itch', 'itching', 'acne', 'allergy', 'চুলকানি', 'র‍্যাশ', 'ত্বক'])) {
            return 'Dermatologist';
        }

        if ($this->hasAny($text, ['stomach pain', 'abdominal pain', 'belly pain', 'gastric', 'indigestion', 'পেট ব্যথা', 'গ্যাস্ট্রিক'])) {
            return 'Gastroenterologist';
        }

        if ($this->hasAny($text, ['fever', 'temperature', 'flu', 'cold', 'জ্বর', 'সর্দি', 'কাশি'])) {
            return 'General Physician';
        }

        return 'General Physician';
    }

    public function buildPrompt(string $userText, array $history = [], ?string $specialization = null): string
    {
        $memory = $this->formatHistory($history);
        $specialist = $specialization ?: $this->mapSpecialist($userText);
        $stage = $this->conversationStage($history);

        return self::SYSTEM_PROMPT . "\n\n"
            . "Conversation stage: {$stage}\n\n"
            . "Conversation memory (last 3-5 messages):\n"
            . ($memory !== '' ? $memory : 'No prior context.') . "\n\n"
            . "Mapped doctor specialization: {$specialist}\n\n"
            . "Current patient message:\n{$this->cleanContent($userText)}\n\n"
            . "Return only the mandatory response format.";
    }

    public function ensureStructuredResponse(string $response): string
    {
        $trimmed = trim($response);
        $normalized = $this->normalize($trimmed);

        if (
            str_contains($normalized, 'possible causes:') &&
            str_contains($normalized, 'advice:') &&
            str_contains($normalized, 'follow-up question:')
        ) {
            return $trimmed;
        }

        return <<<'TEXT'
Possible causes:
* Your symptoms could have several possible causes and need proper medical review.

Advice:
* Rest, stay hydrated, monitor symptoms, and consult a doctor.

Follow-up question:
* How long have you had these symptoms, and are they getting worse?
TEXT;
    }

    public function databaseSpecializationTerms(string $specialization): array
    {
        return match ($specialization) {
            'Cardiologist' => ['Cardiology', 'Cardiologist', 'Cardiac & Vascular Surgery'],
            'Dermatologist' => ['Dermatology', 'Dermatologist'],
            'Gastroenterologist' => ['Gastroenterology', 'Gastroenterologist'],
            'General Physician' => ['General Physician', 'General Medicine', 'Internal Medicine'],
            default => [$specialization],
        };
    }

    private function formatHistory(array $history): string
    {
        $messages = collect($history)
            ->filter(fn ($message) => is_array($message))
            ->map(function (array $message) {
                $role = strtolower((string) ($message['role'] ?? 'user'));
                $label = $role === 'assistant' ? 'Assistant' : 'User';
                $content = $this->cleanContent((string) ($message['content'] ?? ''));

                return $content === '' ? null : "{$label}: {$content}";
            })
            ->filter()
            ->values()
            ->slice(-5);

        return $messages->implode("\n");
    }

    private function conversationStage(array $history): string
    {
        $messageCount = collect($history)
            ->filter(fn ($message) => is_array($message) && trim((string) ($message['content'] ?? '')) !== '')
            ->count();

        if ($messageCount <= 1) {
            return 'initial symptom clarification; ask one focused follow-up question';
        }

        if ($messageCount <= 4) {
            return 'focused triage; refine possible causes and ask the most important missing question';
        }

        return 'recommendation stage; keep advice concise and guide the patient to the mapped specialist';
    }

    private function cleanContent(string $content): string
    {
        return trim(mb_substr(preg_replace('/\s+/u', ' ', $content) ?: '', 0, 1200));
    }

    private function hasAny(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($text, $this->normalize($needle))) {
                return true;
            }
        }

        return false;
    }

    private function normalize(string $text): string
    {
        return mb_strtolower(trim($text));
    }
}

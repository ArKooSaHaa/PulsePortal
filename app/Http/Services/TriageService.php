<?php

namespace App\Http\Services;

class TriageService
{
    public const DISCLAIMER = 'This AI provides general health information only and is not a medical diagnosis. Please consult a licensed doctor.';

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

    private const SYMPTOM_DICTIONARY = [
        'Headache' => ['headache', 'migraine', 'head pain', 'মাথা ব্যথা'],
        'Fever' => ['fever', 'high temperature', 'জ্বর'],
        'Cough' => ['cough', 'কাশি'],
        'Sore throat' => ['sore throat', 'throat pain', 'গলা ব্যথা'],
        'Runny nose' => ['runny nose', 'cold', 'সর্দি', 'নাক দিয়ে পানি'],
        'Chest pain' => ['chest pain', 'chest tightness', 'বুকে ব্যথা'],
        'Breathing difficulty' => ['shortness of breath', 'breathing difficulty', 'শ্বাসকষ্ট'],
        'Stomach pain' => ['stomach pain', 'abdominal pain', 'belly pain', 'পেট ব্যথা'],
        'Nausea' => ['nausea', 'vomit feeling', 'বমি ভাব'],
        'Vomiting' => ['vomiting', 'vomit', 'বমি'],
        'Diarrhea' => ['diarrhea', 'loose motion', 'পাতলা পায়খানা'],
        'Constipation' => ['constipation', 'কোষ্ঠকাঠিন্য'],
        'Skin rash' => ['rash', 'skin rash', 'র‍্যাশ'],
        'Itching' => ['itch', 'itching', 'চুলকানি'],
        'Dizziness' => ['dizzy', 'dizziness', 'মাথা ঘোরা'],
        'Body pain' => ['body pain', 'muscle pain', 'joint pain', 'শরীর ব্যথা', 'গা ব্যথা'],
        'Fatigue' => ['fatigue', 'tired', 'weakness', 'দুর্বলতা'],
    ];

    private const CONFIRMATION_WORDS = [
        'confirm',
        'yes',
        'yes confirm',
        'confirmed',
        'correct',
        'proceed',
        'ok confirm',
        'ঠিক',
        'ঠিক আছে',
        'হ্যাঁ',
        'জি',
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

    /**
     * Combine user turns into one narrative string for triage analysis.
     */
    public function buildPatientNarrative(string $currentMessage, array $history = [], bool $includeCurrent = true): string
    {
        $segments = [];

        foreach ($history as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $role = strtolower((string) ($entry['role'] ?? 'user'));
            if ($role !== 'user') {
                continue;
            }

            $content = $this->cleanContent((string) ($entry['content'] ?? ''));
            if ($content !== '') {
                $segments[] = $content;
            }
        }

        if ($includeCurrent) {
            $current = $this->cleanContent($currentMessage);
            if ($current !== '') {
                $segments[] = $current;
            }
        }

        return implode(' | ', array_slice($segments, -8));
    }

    /**
     * Stage-based triage response:
     * - collect: gather missing symptom details
     * - confirm: confirm captured symptom summary
     * - advice: provide care plan + OTC options + specialist direction
     */
    public function buildChatReply(string $currentMessage, array $history, callable $askLlm): array
    {
        $awaitingConfirmation = $this->awaitingConfirmation($history);
        $isConfirmation = $awaitingConfirmation && $this->isExplicitConfirmation($currentMessage);

        $narrative = $this->buildPatientNarrative($currentMessage, $history, !$isConfirmation);
        $profile = $this->extractSymptomProfile($narrative);
        $resolvedSpecialization = $this->mapSpecialist($narrative !== '' ? $narrative : $currentMessage);

        if ($isConfirmation) {
            return [
                'stage' => 'advice',
                'message' => $this->buildAdviceMessage($profile, $resolvedSpecialization, $askLlm),
                'show_doctors' => true,
                'symptom_summary' => $profile['summary'],
                'specialization' => $resolvedSpecialization,
            ];
        }

        if (!$profile['is_complete']) {
            return [
                'stage' => 'collect',
                'message' => $this->buildCollectionMessage($profile),
                'show_doctors' => false,
                'symptom_summary' => $profile['summary'],
                'specialization' => $resolvedSpecialization,
            ];
        }

        return [
            'stage' => 'confirm',
            'message' => $this->buildConfirmationMessage($profile),
            'show_doctors' => false,
            'symptom_summary' => $profile['summary'],
            'specialization' => $resolvedSpecialization,
        ];
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

    private function buildCollectionMessage(array $profile): string
    {
        $lines = [
            'Thank you. Before I provide medicine suggestions and doctor recommendations, I need a complete symptom checklist.',
            '',
            'Current details captured:',
            '- Main symptoms: ' . ($profile['symptoms_text'] ?: 'Not provided yet'),
            '- Duration: ' . ($profile['duration'] ?: 'Not provided yet'),
            '- Severity: ' . ($profile['severity'] ?: 'Not provided yet'),
            '- Associated symptoms: ' . ($profile['associated_text'] ?: 'Not provided yet'),
        ];

        if (!empty($profile['risk_notes'])) {
            $lines[] = '- Medical context: ' . implode('; ', $profile['risk_notes']);
        }

        $lines[] = '';
        $lines[] = 'Please share the missing details in one message:';

        foreach ($profile['missing'] as $index => $field) {
            $lines[] = ($index + 1) . '. ' . $field;
        }

        $lines[] = '';
        $lines[] = 'Example: "Headache and nausea for 2 days, pain 6/10, no other symptoms."';
        $lines[] = 'After that, I will confirm your summary and then provide advice and doctors from our database.';

        return implode("\n", $lines);
    }

    private function buildConfirmationMessage(array $profile): string
    {
        $lines = [
            'Please confirm the symptom summary below before I provide your care plan:',
            '',
            '- Main symptoms: ' . $profile['symptoms_text'],
            '- Duration: ' . $profile['duration'],
            '- Severity: ' . $profile['severity'],
            '- Associated symptoms: ' . $profile['associated_text'],
        ];

        if (!empty($profile['risk_notes'])) {
            $lines[] = '- Medical context: ' . implode('; ', $profile['risk_notes']);
        }

        $lines[] = '';
        $lines[] = 'Reply with "confirm" to continue.';
        $lines[] = 'If anything is incorrect, type the correction and I will update the summary.';

        return implode("\n", $lines);
    }

    private function buildAdviceMessage(array $profile, string $specialization, callable $askLlm): string
    {
        $prompt = $this->buildAdvicePrompt($profile, $specialization);

        try {
            $raw = (string) $askLlm($prompt);
            $validated = $this->normalizeAdviceResponse($raw);

            if ($validated !== null) {
                return $validated;
            }
        } catch (\Throwable $e) {
            // Fallback below is intentionally deterministic for reliability.
        }

        return $this->buildAdviceFallback($profile, $specialization);
    }

    private function buildAdvicePrompt(array $profile, string $specialization): string
    {
        $summary = $profile['summary'];

        return <<<PROMPT
You are PulsePortal's professional triage assistant.

Safety rules:
- Do not provide a final diagnosis.
- Recommend only non-prescription medicine options.
- Keep guidance practical, concise, and medically safe.
- Mention clear red-flag symptoms for urgent care.
- Reply in English unless the patient summary is clearly Bangla.

Patient summary:
{$summary}

Suggested specialist:
{$specialization}

Respond with exactly these headings:
Likely possibilities:
- ...

Care plan:
- ...

Medicine options (OTC only):
- ...

When to seek urgent care:
- ...

Recommended specialist:
- ...
PROMPT;
    }

    private function normalizeAdviceResponse(string $response): ?string
    {
        $trimmed = trim($response);
        if ($trimmed === '') {
            return null;
        }

        $normalized = $this->normalize($trimmed);
        $requiredHeadings = [
            'likely possibilities:',
            'care plan:',
            'medicine options (otc only):',
            'when to seek urgent care:',
            'recommended specialist:',
        ];

        foreach ($requiredHeadings as $heading) {
            if (!str_contains($normalized, $heading)) {
                return null;
            }
        }

        return $trimmed;
    }

    private function buildAdviceFallback(array $profile, string $specialization): string
    {
        $possibleCauses = $this->fallbackPossibleCauses($specialization);
        $otcOptions = $this->fallbackOtcOptions($profile);

        $lines = [
            'Likely possibilities:',
        ];

        foreach ($possibleCauses as $cause) {
            $lines[] = '- ' . $cause;
        }

        $lines[] = '';
        $lines[] = 'Care plan:';
        $lines[] = '- Rest, hydrate well, and monitor symptom trend every 6-8 hours.';
        $lines[] = '- Avoid heavy/oily food, smoking, and alcohol until symptoms improve.';
        $lines[] = '- If symptoms are worsening after 24-48 hours, consult a doctor quickly.';

        $lines[] = '';
        $lines[] = 'Medicine options (OTC only):';
        foreach ($otcOptions as $option) {
            $lines[] = '- ' . $option;
        }

        $lines[] = '';
        $lines[] = 'When to seek urgent care:';
        $lines[] = '- Severe chest pain, breathing difficulty, confusion, fainting, or persistent vomiting.';
        $lines[] = '- Very high fever, blood in vomit/stool, or symptoms becoming severe rapidly.';

        $lines[] = '';
        $lines[] = 'Recommended specialist:';
        $lines[] = '- ' . $specialization . ' (based on your symptom pattern).';

        return implode("\n", $lines);
    }

    private function fallbackPossibleCauses(string $specialization): array
    {
        return match ($specialization) {
            'Cardiologist' => [
                'Cardiac strain or blood pressure-related symptoms.',
                'Acid reflux or chest wall inflammation can sometimes mimic chest discomfort.',
            ],
            'Dermatologist' => [
                'Allergic or irritant skin inflammation.',
                'Fungal or eczema-related skin reaction.',
            ],
            'Gastroenterologist' => [
                'Acid-related gastric irritation or indigestion.',
                'Mild stomach or bowel inflammation.',
            ],
            default => [
                'Common viral or inflammatory illness.',
                'Stress-related or lifestyle-related symptom flare.',
            ],
        };
    }

    private function fallbackOtcOptions(array $profile): array
    {
        $symptoms = $this->normalize(implode(' ', $profile['symptoms']));
        $options = [];

        if ($this->hasAny($symptoms, ['headache', 'fever', 'body pain'])) {
            $options[] = 'Paracetamol/acetaminophen as per package label (avoid overdose).';
        }

        if ($this->hasAny($symptoms, ['stomach pain', 'nausea', 'vomiting', 'diarrhea'])) {
            $options[] = 'ORS for hydration and an antacid as per package label.';
        }

        if ($this->hasAny($symptoms, ['skin rash', 'itching'])) {
            $options[] = 'A non-sedating antihistamine or calamine lotion as per label instructions.';
        }

        if ($this->hasAny($symptoms, ['cough', 'sore throat', 'runny nose'])) {
            $options[] = 'Warm fluids, lozenges, and supportive cough/cold OTC medicine as per label.';
        }

        if (empty($options)) {
            $options[] = 'Use OTC medicine only after checking with a pharmacist and package instructions.';
        }

        $options[] = 'Avoid starting antibiotics or steroid medicines without a doctor\'s prescription.';

        return array_values(array_unique($options));
    }

    private function awaitingConfirmation(array $history): bool
    {
        for ($index = count($history) - 1; $index >= 0; $index--) {
            $entry = $history[$index] ?? null;
            if (!is_array($entry)) {
                continue;
            }

            $role = strtolower((string) ($entry['role'] ?? 'user'));
            if ($role !== 'assistant') {
                continue;
            }

            $content = $this->normalize((string) ($entry['content'] ?? ''));
            return str_contains($content, 'reply with "confirm"') || str_contains($content, 'reply with confirm');
        }

        return false;
    }

    private function isExplicitConfirmation(string $text): bool
    {
        $normalized = mb_strtolower(trim($text));
        $normalized = preg_replace('/[^\p{L}\p{N}\s]/u', '', $normalized) ?? '';
        $normalized = preg_replace('/\s+/u', ' ', trim($normalized)) ?? '';

        if (preg_match('/\b(no|not|না)\b/u', $normalized) === 1) {
            return false;
        }

        if (preg_match('/\b(confirm|confirmed|yes|correct|proceed)\b/u', $normalized) === 1) {
            return true;
        }

        if (preg_match('/\b(হ্যাঁ|ঠিক|জি)\b/u', $normalized) === 1) {
            return true;
        }

        return in_array($normalized, self::CONFIRMATION_WORDS, true);
    }

    private function extractSymptomProfile(string $narrative): array
    {
        $normalized = $this->normalize($narrative);
        $symptoms = $this->extractSymptoms($normalized);
        $duration = $this->extractDuration($narrative);
        $severity = $this->extractSeverity($normalized);
        $associatedStatus = $this->extractAssociatedStatus($normalized, $symptoms);
        $riskNotes = $this->extractRiskNotes($normalized, $narrative);

        $missing = [];
        if (empty($symptoms)) {
            $missing[] = 'Main symptoms (for example: headache, fever, cough).';
        }
        if ($duration === null) {
            $missing[] = 'Duration (how long you have had these symptoms).';
        }
        if ($severity === null) {
            $missing[] = 'Severity (mild/moderate/severe or pain score out of 10).';
        }
        if ($associatedStatus['status'] === 'unknown') {
            $missing[] = 'Other associated symptoms (or explicitly say "none").';
        }

        $symptomsText = empty($symptoms) ? null : implode(', ', $symptoms);
        $associatedText = match ($associatedStatus['status']) {
            'none' => 'None reported',
            'present' => implode(', ', $associatedStatus['symptoms']),
            default => null,
        };

        $summaryParts = [];
        $summaryParts[] = 'Main symptoms: ' . ($symptomsText ?: 'Not fully provided');
        $summaryParts[] = 'Duration: ' . ($duration ?: 'Not fully provided');
        $summaryParts[] = 'Severity: ' . ($severity ?: 'Not fully provided');
        $summaryParts[] = 'Associated symptoms: ' . ($associatedText ?: 'Not fully provided');

        if (!empty($riskNotes)) {
            $summaryParts[] = 'Medical context: ' . implode('; ', $riskNotes);
        }

        return [
            'symptoms' => $symptoms,
            'symptoms_text' => $symptomsText,
            'duration' => $duration,
            'severity' => $severity,
            'associated_text' => $associatedText,
            'risk_notes' => $riskNotes,
            'missing' => $missing,
            'is_complete' => empty($missing),
            'summary' => implode('; ', $summaryParts),
        ];
    }

    private function extractSymptoms(string $normalizedNarrative): array
    {
        $matches = [];

        foreach (self::SYMPTOM_DICTIONARY as $label => $keywords) {
            if ($this->hasAny($normalizedNarrative, $keywords)) {
                $matches[] = $label;
            }
        }

        if (empty($matches) && preg_match('/\b(pain|ache|fever|cough|rash|itch|vomit|nausea|dizzy|weak)\b/u', $normalizedNarrative, $found)) {
            $fallback = ucfirst((string) ($found[1] ?? 'symptom'));
            $matches[] = $fallback;
        }

        return array_slice(array_values(array_unique($matches)), 0, 6);
    }

    private function extractDuration(string $text): ?string
    {
        $patterns = [
            '/\b\d+\s*(?:hours?|hrs?|days?|weeks?|months?|years?)\b/i',
            '/\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:hour|hours|day|days|week|weeks|month|months|year|years)\b/i',
            '/\b(?:today|yesterday|last night|since morning|since yesterday)\b/i',
            '/\b\d+\s*(?:ঘন্টা|দিন|সপ্তাহ|মাস|বছর)\b/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match) === 1) {
                return trim((string) $match[0]);
            }
        }

        return null;
    }

    private function extractSeverity(string $normalizedNarrative): ?string
    {
        if (preg_match('/\b([1-9]|10)\s*\/\s*10\b/u', $normalizedNarrative, $match) === 1) {
            return $match[1] . '/10';
        }

        if ($this->hasAny($normalizedNarrative, ['very severe', 'severe', 'intense', 'unbearable', 'তীব্র'])) {
            return 'Severe';
        }

        if ($this->hasAny($normalizedNarrative, ['moderate', 'medium', 'মাঝারি'])) {
            return 'Moderate';
        }

        if ($this->hasAny($normalizedNarrative, ['mild', 'light', 'slight', 'মৃদু'])) {
            return 'Mild';
        }

        return null;
    }

    private function extractAssociatedStatus(string $normalizedNarrative, array $symptoms): array
    {
        if (
            preg_match('/\b(no other symptoms?|no additional symptoms?|nothing else|only this|just this)\b/u', $normalizedNarrative) === 1
            || str_contains($normalizedNarrative, 'আর কোন উপসর্গ নেই')
        ) {
            return [
                'status' => 'none',
                'symptoms' => [],
            ];
        }

        if (count($symptoms) > 1) {
            return [
                'status' => 'present',
                'symptoms' => array_slice($symptoms, 1),
            ];
        }

        return [
            'status' => 'unknown',
            'symptoms' => [],
        ];
    }

    private function extractRiskNotes(string $normalizedNarrative, string $rawNarrative): array
    {
        $notes = [];

        if ($this->hasAny($normalizedNarrative, ['diabetes', 'hypertension', 'high blood pressure', 'asthma', 'thyroid', 'heart disease', 'kidney disease'])) {
            $notes[] = 'Patient mentioned pre-existing medical conditions.';
        }

        if ($this->hasAny($normalizedNarrative, ['allergy', 'allergies', 'অ্যালার্জি'])) {
            $notes[] = 'Patient mentioned allergy history.';
        }

        if (preg_match('/\b(taking|using|currently on)\b/i', $rawNarrative) === 1) {
            $notes[] = 'Patient is currently taking medicine.';
        }

        return $notes;
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

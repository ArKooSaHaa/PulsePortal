<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Services\AiService;
use App\Http\Services\LlmService;
use App\Http\Services\TriageService;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;

class AiController extends Controller
{
    protected AiService $aiService;
    protected LlmService $llmService;
    protected TriageService $triageService;

    public function __construct(AiService $aiService, LlmService $llmService, TriageService $triageService)
    {
        $this->middleware('auth:api');
        $this->aiService = $aiService;
        $this->llmService = $llmService;
        $this->triageService = $triageService;
    }

    /**
     * POST /api/patient/ai/chat
     * AI Health Assistant — general symptom guidance chatbot.
     */
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
            'history.*.role' => 'nullable|string|in:user,assistant',
            'history.*.content' => 'nullable|string|max:2000',
        ]);

        $message = trim((string) $validated['message']);
        $history = $this->normalizeHistory($validated['history'] ?? []);
        $patientNarrative = $this->triageService->buildPatientNarrative($message, $history);
        $specialization = $this->triageService->mapSpecialist($patientNarrative !== '' ? $patientNarrative : $message);

        $emergencyMessage = $this->triageService->checkEmergency($patientNarrative !== '' ? $patientNarrative : $message);
        if ($emergencyMessage !== null) {
            return response()->json([
                'message' => $emergencyMessage,
                'stage' => 'emergency',
                'specialization' => $specialization,
                'doctors' => [],
                'disclaimer' => TriageService::DISCLAIMER,
                'emergency' => true,
                'symptom_summary' => $patientNarrative,
            ]);
        }

        try {
            $chatReply = $this->triageService->buildChatReply(
                $message,
                $history,
                fn (string $prompt): string => $this->llmService->askLlm($prompt)
            );

            $resolvedSpecialization = (string) ($chatReply['specialization'] ?? $specialization);
            $stage = (string) ($chatReply['stage'] ?? 'collect');
            $showDoctors = (bool) ($chatReply['show_doctors'] ?? false);
            $recommendedDoctors = $showDoctors
                ? $this->fetchDoctorsBySpecialization($resolvedSpecialization)
                : [];

            return response()->json([
                'message' => (string) ($chatReply['message'] ?? ''),
                'stage' => $stage,
                'specialization' => $resolvedSpecialization,
                'doctors' => $recommendedDoctors,
                'disclaimer' => TriageService::DISCLAIMER,
                'emergency' => false,
                'symptom_summary' => (string) ($chatReply['symptom_summary'] ?? $patientNarrative),
            ]);
        } catch (\Exception $e) {
            $errorMsg = $this->getUserFriendlyError($e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => $errorMsg,
            ], 503);
        }
    }

    private function normalizeHistory(array $history): array
    {
        return collect($history)
            ->filter(fn ($message) => is_array($message))
            ->map(function (array $message) {
                $role = strtolower((string) ($message['role'] ?? 'user'));
                $normalizedRole = in_array($role, ['user', 'assistant'], true) ? $role : 'user';
                $content = trim((string) ($message['content'] ?? ''));

                return [
                    'role' => $normalizedRole,
                    'content' => mb_substr($content, 0, 2000),
                ];
            })
            ->filter(fn (array $message) => $message['content'] !== '')
            ->values()
            ->slice(-5)
            ->values()
            ->toArray();
    }

    private function fetchDoctorsBySpecialization(string $specialization): array
    {
        $terms = $this->triageService->databaseSpecializationTerms($specialization);

        $doctors = Doctor::with('user')
            ->where('is_available', true)
            ->where(function ($query) use ($terms) {
                foreach ($terms as $term) {
                    $query->orWhere('specialization', $term)
                        ->orWhere('specialization', 'like', '%' . $term . '%');
                }
            })
            ->limit(8)
            ->get();

        if ($doctors->isEmpty()) {
            $doctors = Doctor::with('user')
                ->where('is_available', true)
                ->limit(8)
                ->get();
        }

        return $doctors
            ->map(function (Doctor $doctor) {
                $name = (string) ($doctor->user->name ?? '');
                if ($name === '') {
                    return null;
                }

                return [
                    'id' => $doctor->id,
                    'name' => $name,
                    'specialization' => (string) $doctor->specialization,
                    'department' => (string) ($doctor->department ?? ''),
                    'fee' => $doctor->consultation_fee,
                    'service_hours_label' => $this->formatServiceHoursLabel($doctor->availability),
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    private function formatServiceHoursLabel(?array $availability): ?string
    {
        $serviceHours = $this->resolveServiceHours($availability);
        if (!$serviceHours) {
            return null;
        }

        $start = date('h:i A', strtotime($serviceHours['start']));
        $end = date('h:i A', strtotime($serviceHours['end']));

        return "{$start} - {$end}";
    }

    private function resolveServiceHours(?array $availability): ?array
    {
        if (!is_array($availability)) {
            return null;
        }

        if (
            isset($availability['service_hours']) &&
            is_array($availability['service_hours']) &&
            !empty($availability['service_hours']['start']) &&
            !empty($availability['service_hours']['end'])
        ) {
            return [
                'start' => (string) $availability['service_hours']['start'],
                'end' => (string) $availability['service_hours']['end'],
            ];
        }

        $dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        $ranges = collect($dayKeys)
            ->map(fn ($day) => $availability[$day] ?? null)
            ->filter(fn ($range) => is_array($range) && count($range) === 2)
            ->values();

        if ($ranges->isEmpty()) {
            return null;
        }

        $starts = $ranges->map(fn ($range) => (string) $range[0])->sort()->values();
        $ends = $ranges->map(fn ($range) => (string) $range[1])->sort()->values();

        return [
            'start' => $starts->first(),
            'end' => $ends->last(),
        ];
    }

    /**
     * POST /api/patient/ai/suggest-doctors
     * Analyze symptoms and return matching specializations from the database.
     */
    public function suggestDoctors(Request $request)
    {
        $request->validate([
            'symptoms' => 'required|string|max:2000',
        ]);

        $symptoms = $request->input('symptoms');

        // Get all available specializations from the database
        $specializations = Doctor::where('is_available', true)
            ->distinct()
            ->pluck('specialization')
            ->toArray();

        // Get doctors with details for context
        $doctorDetails = Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(fn($d) => [
                'name'           => $d->user->name,
                'specialization' => $d->specialization,
                'fee'            => $d->consultation_fee,
            ])
            ->toArray();

        $specList = implode(', ', $specializations);

        $systemPrompt = <<<PROMPT
You are a medical triage assistant for PulsePortal Hospital. Your job is to analyze patient symptoms and recommend which medical specializations they should consult.

Available specializations at our hospital: {$specList}

You MUST respond with ONLY a valid JSON object (no markdown, no explanation outside JSON) in this exact format:
{
  "specializations": ["Specialization1", "Specialization2"],
  "explanation": "Brief 1-2 sentence explanation of why these specializations are recommended."
}

RULES:
- ONLY include specializations from the available list above.
- If symptoms could relate to multiple specializations, include all relevant ones (max 3).
- If symptoms are vague, suggest "General Medicine" or the most relevant available specialization.
- The explanation should be helpful and reassuring.
- Do NOT include any text outside the JSON object.
PROMPT;

        try {
            $result = $this->aiService->structuredChat($systemPrompt, "Patient symptoms: {$symptoms}");

            // Validate the AI returned valid specializations
            $validSpecs = [];
            if (isset($result['specializations']) && is_array($result['specializations'])) {
                $validSpecs = array_filter($result['specializations'], function ($spec) use ($specializations) {
                    return in_array($spec, $specializations);
                });
            }

            // If no valid specializations found, fallback
            if (empty($validSpecs)) {
                $validSpecs = $specializations; // Show all doctors
            }

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'specializations' => array_values($validSpecs),
                    'explanation'     => $result['explanation'] ?? 'Based on your symptoms, we recommend consulting the following specialists.',
                ],
            ]);
        } catch (\Exception $e) {
            $errorMsg = $this->getUserFriendlyError($e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => $errorMsg,
            ], 503);
        }
    }

    /**
     * POST /api/doctor/ai/patient-summary/{patientId}
     * Generate an AI clinical summary of a patient's medical history.
     * Also persists the summary to the patient's medical_history field.
     */
    public function summarizePatientHistory($patientId)
    {
        $doctor = auth()->user()->doctor;
        if (!$doctor) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $patient = Patient::with('user')->find($patientId);
        if (!$patient) {
            return response()->json(['status' => 'error', 'message' => 'Patient not found.'], 404);
        }

        // Gather all completed appointments for this patient (across all doctors)
        $completedAppointments = Appointment::with(['doctor.user', 'prescriptions'])
            ->where('patient_id', $patientId)
            ->where('status', 'completed')
            ->orderBy('appointment_date', 'asc')
            ->get();

        if ($completedAppointments->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'data'   => ['summary' => 'No completed appointments found for this patient yet.'],
            ]);
        }

        // Build context from appointment records
        $appointmentSummaries = $completedAppointments->map(function ($appt) {
            $parts = [
                "Date: {$appt->appointment_date->format('Y-m-d')}",
                "Doctor: " . ($appt->doctor->user->name ?? 'Unknown'),
                "Specialization: " . ($appt->doctor->specialization ?? 'Unknown'),
                "Symptoms: {$appt->symptoms}",
            ];

            if ($appt->prescriptions->isNotEmpty()) {
                foreach ($appt->prescriptions as $p) {
                    if ($p->disease_or_problem) {
                        $parts[] = "Diagnosis: {$p->disease_or_problem}";
                    }
                    $meds = json_decode($p->medication, true);
                    if (is_array($meds)) {
                        $medList = collect($meds)->map(fn($m) => $m['name'] . ($m['dosage'] ? " ({$m['dosage']})" : ''))->implode(', ');
                        $parts[] = "Medicines: {$medList}";
                    }
                    if ($p->instructions) {
                        $parts[] = "Doctor Notes: {$p->instructions}";
                    }
                }
            }

            return implode(' | ', $parts);
        })->implode("\n");

        $systemPrompt = <<<PROMPT
You are a medical records assistant for PulsePortal Hospital. Your job is to write a concise clinical summary of a patient's medical history based on their appointment records.

Guidelines:
- Write in third person (e.g., "Patient has a history of...")
- Keep it to 3-5 sentences maximum
- Highlight key conditions, diagnoses, recurring issues, and treatments
- Mention relevant specializations consulted
- Note any prescribed medications and their purposes
- Be factual, professional, and concise — this will be displayed to doctors
- If the patient has had only one appointment, still summarize it meaningfully
- Do NOT include specific dates unless medically relevant
PROMPT;

        $userMessage = "Generate a clinical summary for patient '{$patient->user->name}' based on these appointment records:\n\n{$appointmentSummaries}";

        try {
            $summary = $this->aiService->chat($systemPrompt, $userMessage);

            // Persist the summary to the patient's medical_history field
            $patient->update(['medical_history' => trim($summary)]);

            return response()->json([
                'status' => 'success',
                'data'   => ['summary' => trim($summary)],
            ]);
        } catch (\Exception $e) {
            $errorMsg = $this->getUserFriendlyError($e->getMessage());
            return response()->json(['status' => 'error', 'message' => $errorMsg], 503);
        }
    }

    /**
     * POST /api/patient/ai/prescription-summary/{appointmentId}
     * Generate an AI patient-friendly summary of a prescription.
     */
    public function summarizePrescription($appointmentId)
    {
        $patient = auth()->user()->patient;
        if (!$patient) {
            return response()->json(['status' => 'error', 'message' => 'Patient profile not found.'], 404);
        }

        $appointment = Appointment::where('id', $appointmentId)
            ->where('patient_id', $patient->id)
            ->with(['doctor.user', 'prescriptions'])
            ->first();

        if (!$appointment) {
            return response()->json(['status' => 'error', 'message' => 'Appointment not found.'], 404);
        }

        $prescription = $appointment->prescriptions->first();
        if (!$prescription) {
            return response()->json(['status' => 'error', 'message' => 'No prescription found.'], 404);
        }

        // Build prescription context
        $medicines = json_decode($prescription->medication, true) ?? [];
        $medDetails = collect($medicines)->map(function ($m) {
            $detail = $m['name'];
            if (!empty($m['dosage'])) $detail .= " — Dosage: {$m['dosage']}";
            if (!empty($m['instruction'])) $detail .= " — Instructions: {$m['instruction']}";
            return $detail;
        })->implode("\n");

        $context = "Doctor: Dr. {$appointment->doctor->user->name} ({$appointment->doctor->specialization})\n";
        $context .= "Diagnosis: " . ($prescription->disease_or_problem ?: 'Not specified') . "\n";
        $context .= "Medicines:\n{$medDetails}\n";
        $context .= "Doctor's Notes: " . ($prescription->instructions ?: 'None') . "\n";

        $systemPrompt = <<<PROMPT
You are a patient-friendly health advisor for PulsePortal Hospital. Your job is to explain a prescription in simple, easy-to-understand language for a patient.

Your response MUST include these sections:
1. **Your Diagnosis**: Briefly explain what condition/disease was diagnosed in simple terms.
2. **Your Medicines**: For each medicine, explain what it does and why the doctor prescribed it. Include dosage reminders.
3. **Important Suggestions**: Provide 3-5 practical health suggestions based on the diagnosis and medicines (diet, rest, things to avoid, when to seek further help).
4. **⚠️ Warnings**: Any side effects to watch for or situations where they should contact their doctor immediately.

Guidelines:
- Use warm, reassuring, simple language (avoid medical jargon)
- Keep each section concise (2-3 sentences each)
- Use bullet points for clarity
- Remind the patient to follow the doctor's instructions
- Do NOT contradict or change the doctor's prescription
PROMPT;

        $userMessage = "Please summarize this prescription for the patient:\n\n{$context}";

        try {
            $summary = $this->aiService->chat($systemPrompt, $userMessage);

            return response()->json([
                'status' => 'success',
                'data'   => ['summary' => trim($summary)],
            ]);
        } catch (\Exception $e) {
            $errorMsg = $this->getUserFriendlyError($e->getMessage());
            return response()->json(['status' => 'error', 'message' => $errorMsg], 503);
        }
    }

    /**
     * Convert raw API error messages into user-friendly text.
     */
    private function getUserFriendlyError(string $rawError): string
    {
        if (stripos($rawError, 'decommissioned') !== false || stripos($rawError, 'model_decommissioned') !== false) {
            return 'The configured AI model is unavailable. Please update GROQ_MODEL and try again.';
        }
        if (stripos($rawError, 'quota') !== false || stripos($rawError, 'rate') !== false) {
            return 'AI API quota exceeded. Your API key has reached its usage limit. Please check your plan/billing or try again later.';
        }
        if (stripos($rawError, 'invalid') !== false && stripos($rawError, 'key') !== false) {
            return 'Invalid AI API key. Please check your GROQ_API_KEY in the .env file.';
        }
        if (stripos($rawError, 'unauthorized') !== false || stripos($rawError, '401') !== false) {
            return 'AI API authentication failed. Please verify your API key.';
        }

        return 'AI service is temporarily unavailable. Please try again later.';
    }
}


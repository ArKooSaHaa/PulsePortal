<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Services\AiService;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;

class AiController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->middleware('auth:api');
        $this->aiService = $aiService;
    }

    /**
     * POST /api/patient/ai/chat
     * AI Health Assistant — general symptom guidance chatbot.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
        ]);

        $user    = auth()->user();
        $message = $request->input('message');
        $history = $request->input('history', []);

        // Gather database context
        $specializations = Doctor::where('is_available', true)
            ->distinct()
            ->pluck('specialization')
            ->toArray();

        $doctors = Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(fn($d) => "{$d->user->name} ({$d->specialization})")
            ->toArray();

        $systemPrompt = <<<PROMPT
You are a helpful AI Health Assistant for PulsePortal Hospital Management System.

Your role:
- Provide general health guidance based on symptoms described by the patient.
- Suggest what to do and what NOT to do for common symptoms.
- Recommend basic home treatments where appropriate.
- If symptoms sound serious or life-threatening, clearly advise the patient to seek IMMEDIATE medical attention at a hospital.
- Suggest which medical specialization the patient should visit.
- Be warm, empathetic, and clear in your responses.
- Keep responses concise (2-4 paragraphs max).

Available specializations at our hospital: {implSpecializations}
Available doctors: {implDoctors}

IMPORTANT RULES:
- You are NOT a doctor. You cannot diagnose or prescribe medication.
- Always recommend consulting a professional doctor for proper diagnosis.
- For emergencies (chest pain, difficulty breathing, severe bleeding, loss of consciousness), always advise calling emergency services or visiting the ER immediately.
- Only suggest doctors and specializations from the lists above.
PROMPT;

        $systemPrompt = str_replace(
            ['{implSpecializations}', '{implDoctors}'],
            [implode(', ', $specializations), implode(', ', $doctors)],
            $systemPrompt
        );

        try {
            $response = $this->aiService->chat($systemPrompt, $message, $history);

            return response()->json([
                'status'  => 'success',
                'data'    => [
                    'message' => $response,
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
     * Convert raw API error messages into user-friendly text.
     */
    private function getUserFriendlyError(string $rawError): string
    {
        if (stripos($rawError, 'quota') !== false || stripos($rawError, 'rate') !== false) {
            return 'AI API quota exceeded. Your API key has reached its usage limit. Please check your plan/billing or try again later.';
        }
        if (stripos($rawError, 'invalid') !== false && stripos($rawError, 'key') !== false) {
            return 'Invalid AI API key. Please check your AI_API_KEY in the .env file.';
        }
        if (stripos($rawError, 'unauthorized') !== false || stripos($rawError, '401') !== false) {
            return 'AI API authentication failed. Please verify your API key.';
        }

        return 'AI service is temporarily unavailable. Please try again later.';
    }
}

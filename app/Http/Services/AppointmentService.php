<?php

namespace App\Http\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Http\Services\AiService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function createAppointment(int $patientId, array $data): Appointment
    {
        $validatedData = Validator::make($data, [
            'doctor_id'        => 'required|exists:doctors,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required',
            'type'             => 'required|in:in_person,online',
            'symptoms'         => 'required|string|max:1000',
        ])->validate();

        return Appointment::create([
            'patient_id'       => $patientId,
            'doctor_id'        => $validatedData['doctor_id'],
            'appointment_date' => $validatedData['appointment_date'],
            'appointment_time' => $validatedData['appointment_time'],
            'type'             => $validatedData['type'],
            'symptoms'         => $validatedData['symptoms'],
            'status'           => 'pending',
        ]);
    }

    public function getPatientAppointments(int $patientId)
    {
        return Appointment::with(['doctor.user'])
            ->where('patient_id', $patientId)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get()
            ->map(fn($a) => $this->formatAppointment($a));
    }

    public function getDoctorAppointments(int $doctorId)
    {
        return Appointment::with(['patient.user'])
            ->where('doctor_id', $doctorId)
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(fn($a) => $this->formatAppointmentForDoctor($a));
    }

    public function updateAppointmentStatus(int $appointmentId, array $data, int $doctorId): ?Appointment
    {
        $validatedData = Validator::make($data, [
            'status' => 'required|in:confirmed,completed,cancelled',
        ])->validate();

        $appointment = Appointment::where('id', $appointmentId)
            ->where('doctor_id', $doctorId)
            ->first();

        if (!$appointment) return null;

        $appointment->update(['status' => $validatedData['status']]);

        // ── Auto-generate medical history when appointment is completed ──
        if ($validatedData['status'] === 'completed') {
            try {
                $this->regenerateMedicalHistory($appointment->patient_id);
            } catch (\Exception $e) {
                // Log but don't fail the status update if AI is unavailable
                Log::warning('AI medical history generation failed', [
                    'patient_id' => $appointment->patient_id,
                    'error'      => $e->getMessage(),
                ]);
            }
        }

        return $appointment;
    }

    /**
     * Regenerate the patient's medical_history field using AI.
     * Gathers all completed appointments and produces a concise summary.
     */
    private function regenerateMedicalHistory(int $patientId): void
    {
        $patient = Patient::find($patientId);
        if (!$patient) return;

        // Gather all completed appointments with their details
        $completedAppointments = Appointment::with(['doctor.user', 'visitNote', 'prescriptions'])
            ->where('patient_id', $patientId)
            ->where('status', 'completed')
            ->orderBy('appointment_date', 'asc')
            ->get();

        if ($completedAppointments->isEmpty()) return;

        // Build a context string from appointment data
        $appointmentSummaries = $completedAppointments->map(function ($appt) {
            $parts = [
                "Date: {$appt->appointment_date->format('Y-m-d')}",
                "Doctor: " . ($appt->doctor->user->name ?? 'Unknown'),
                "Specialization: " . ($appt->doctor->specialization ?? 'Unknown'),
                "Symptoms: {$appt->symptoms}",
            ];

            if ($appt->visitNote) {
                $parts[] = "Doctor Notes: {$appt->visitNote->doctor_notes}";
            }

            if ($appt->prescriptions->isNotEmpty()) {
                $meds = $appt->prescriptions->map(fn($p) =>
                    ($p->disease_or_problem ? "{$p->disease_or_problem}: " : '') . $p->medication
                )->implode('; ');
                $parts[] = "Prescriptions: {$meds}";
            }

            return implode(' | ', $parts);
        })->implode("\n");

        $systemPrompt = <<<PROMPT
You are a medical records assistant. Your job is to write a concise medical history summary for a patient based on their appointment records.

Guidelines:
- Write in third person (e.g., "Patient has a history of...")
- Keep it to 2-4 sentences maximum
- Highlight key conditions, recurring issues, and treatments
- Mention relevant specializations consulted
- Be factual and concise — this will be displayed on the patient's profile
- If the patient has had only one appointment, still summarize it meaningfully
- Do NOT include dates unless they are medically relevant
PROMPT;

        $userMessage = "Generate a medical history summary based on these appointment records:\n\n{$appointmentSummaries}";

        $aiService = app(AiService::class);
        $summary   = $aiService->chat($systemPrompt, $userMessage);

        // Update the patient's medical_history field
        $patient->update(['medical_history' => trim($summary)]);
    }

    public function cancelAppointment(int $appointmentId, int $patientId): ?Appointment
    {
        $appointment = Appointment::where('id', $appointmentId)
            ->where('patient_id', $patientId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if (!$appointment) return null;

        $appointment->update(['status' => 'cancelled']);
        return $appointment;
    }

    public function getBookedSlots(int $doctorId, string $date): array
    {
        return Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->pluck('appointment_time')
            ->map(function ($time) {
                // format back from HH:MM:SS to something easier if needed, or leave as is
                return $time;
            })
            ->toArray();
    }

    private function formatAppointment(Appointment $a): array
    {
        return [
            'id'               => $a->id,
            'doctor_id'        => $a->doctor_id,
            'doctor_name'      => $a->doctor->user->name ?? 'Unknown',
            'specialization'   => $a->doctor->specialization ?? '',
            'appointment_date' => $a->appointment_date,
            'appointment_time' => $a->appointment_time,
            'type'             => $a->type,
            'status'           => $a->status,
            'symptoms'         => $a->symptoms,
        ];
    }

    private function formatAppointmentForDoctor(Appointment $a): array
    {
        return [
            'id'               => $a->id,
            'patient_id'       => $a->patient_id,
            'patient_name'     => $a->patient->user->name ?? 'Unknown',
            'appointment_date' => $a->appointment_date,
            'appointment_time' => $a->appointment_time,
            'type'             => $a->type,
            'status'           => $a->status,
            'symptoms'         => $a->symptoms,
        ];
    }
}

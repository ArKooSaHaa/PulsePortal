<?php

namespace App\Http\Services;

use App\Models\Admin;
use App\Models\Appointment;
use Illuminate\Support\Facades\Mail;
use App\Events\AppointmentRequested;
use App\Mail\PatientAppointmentDetails;
use App\Events\AppointmentStatusUpdated;

class AppointmentService
{
    public function createAppointment(int $patientId, array $data): Appointment
    {
        $appointment = Appointment::create([
            'patient_id'       => $patientId,
            'doctor_id'        => $data['doctor_id'],
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'],
            'type'             => $data['type'],
            'symptoms'         => $data['symptoms'],
            'status'           => 'pending',
        ]);

        broadcast(new AppointmentRequested($appointment))->toOthers();
        
        $appointment->load(['patient.user', 'doctor.user']);
        Mail::to($appointment->patient->user->email)->send(new PatientAppointmentDetails($appointment));

        return $appointment;
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
            ->where('status', 'confirmed')
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(fn($a) => $this->formatAppointmentForDoctor($a));
    }

    /**
     * Get appointments filtered by the admin's department.
     */
    public function getDepartmentAppointments(Admin $admin)
    {
        $query = Appointment::with(['patient.user', 'doctor.user']);

        if ($admin->admin_role !== 'Super Admin' && $admin->department) {
            // Filter to only appointments for doctors in this department
            $query->whereHas('doctor', fn($q) => $q->where('department', $admin->department));
        }

        return $query
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get()
            ->map(fn($a) => $this->formatAppointmentForAdmin($a));
    }

    /**
     * Allow admin OR doctor to update appointment status.
     */
    public function updateAppointmentStatus(int $appointmentId, string $status, ?int $doctorId = null): ?Appointment
    {
        $query = Appointment::where('id', $appointmentId);

        // If doctorId is provided, restrict to that doctor's appointments (doctor workflow)
        if ($doctorId) {
            $query->where('doctor_id', $doctorId);
        }

        $appointment = $query->first();

        if (!$appointment) return null;

        $appointment->update(['status' => $status]);

        // Notify the patient via WebSocket
        broadcast(new AppointmentStatusUpdated($appointment))->toOthers();

        // Notify the patient via email for major status changes
        if (in_array($status, ['confirmed', 'cancelled'])) {
            $appointment->load(['patient.user', 'doctor.user']);
            Mail::to($appointment->patient->user->email)->send(new PatientAppointmentDetails($appointment));
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

        broadcast(new AppointmentStatusUpdated($appointment))->toOthers();

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
            'department'       => $a->doctor->department ?? '',
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

    private function formatAppointmentForAdmin(Appointment $a): array
    {
        return [
            'id'               => $a->id,
            'patient_name'     => $a->patient->user->name ?? 'Unknown',
            'doctor_name'      => $a->doctor->user->name ?? 'Unknown',
            'specialization'   => $a->doctor->specialization ?? '',
            'department'       => $a->doctor->department ?? '',
            'appointment_date' => $a->appointment_date,
            'appointment_time' => $a->appointment_time,
            'type'             => $a->type,
            'status'           => $a->status,
            'symptoms'         => $a->symptoms,
        ];
    }
}

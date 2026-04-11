<?php

namespace App\Http\Services;

use App\Models\Appointment;
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
        return $appointment;
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

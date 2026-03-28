<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Services\AppointmentService;

class AppointmentController extends Controller
{
    protected AppointmentService $appointmentService;

    public function __construct(AppointmentService $appointmentService)
    {
        $this->middleware('auth:api');
        $this->appointmentService = $appointmentService;
    }

    // POST /api/patient/appointments
    public function store(Request $request)
    {
        $data = $request->validate([
            'doctor_id'        => 'required|exists:doctors,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required',
            'type'             => 'required|in:in_person,online',
            'symptoms'         => 'required|string|max:1000',
        ]);

        $user    = auth()->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Patient profile not found.',
            ], 404);
        }

        $appointment = $this->appointmentService->createAppointment($patient->id, $data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Appointment booked successfully.',
            'data'    => $appointment,
        ], 201);
    }

    // GET /api/patient/appointments
    public function patientIndex()
    {
        $patient = auth()->user()->patient;

        if (!$patient) {
            return response()->json(['status' => 'error', 'message' => 'Patient profile not found.'], 404);
        }

        $appointments = $this->appointmentService->getPatientAppointments($patient->id);

        return response()->json([
            'status' => 'success',
            'data'   => $appointments,
        ]);
    }

    // GET /api/doctor/appointments
    public function doctorIndex()
    {
        $doctor = auth()->user()->doctor;

        if (!$doctor) {
            return response()->json(['status' => 'error', 'message' => 'Doctor profile not found.'], 404);
        }

        $appointments = $this->appointmentService->getDoctorAppointments($doctor->id);

        return response()->json([
            'status' => 'success',
            'data'   => $appointments,
        ]);
    }

    // PATCH /api/doctor/appointments/{id}/status
    public function updateStatus(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|in:confirmed,completed,cancelled',
        ]);

        $doctor      = auth()->user()->doctor;
        $appointment = $this->appointmentService->updateAppointmentStatus($id, $data['status'], $doctor->id);

        if (!$appointment) {
            return response()->json(['status' => 'error', 'message' => 'Appointment not found or unauthorized.'], 404);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Appointment status updated.',
            'data'    => $appointment,
        ]);
    }

    // PATCH /api/patient/appointments/{id}/cancel
    public function cancel($id)
    {
        $patient     = auth()->user()->patient;
        $appointment = $this->appointmentService->cancelAppointment($id, $patient->id);

        if (!$appointment) {
            return response()->json(['status' => 'error', 'message' => 'Appointment not found or unauthorized.'], 404);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Appointment cancelled.',
            'data'    => $appointment,
        ]);
    }
}

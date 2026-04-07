<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstPatientAppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class PatientAppointmentController extends Controller
{
    public function __construct(private readonly DatabaseFirstPatientAppointmentService $appointments)
    {
        $this->middleware('auth:api');
    }

    public function doctors(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
        ]);

        $doctors = $this->appointments->listDoctorsForBooking(
            $validated['search'] ?? null,
            $validated['department'] ?? null,
        );

        return response()->json([
            'doctors' => $doctors,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access appointments.',
            ], 403);
        }

        $appointments = $this->appointments->listPatientAppointments((int) $patient->id);

        return response()->json([
            'appointments' => $appointments,
        ]);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access upcoming appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $appointments = $this->appointments->listPatientUpcomingAppointments(
            (int) $patient->id,
            (int) ($validated['limit'] ?? 5),
        );

        return response()->json([
            'appointments' => $appointments,
        ]);
    }

    public function roomAdmissionsSummary(Request $request): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access room admission details.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        try {
            $summary = $this->appointments->getPatientRoomAdmissionsSummary(
                (int) $patient->id,
                (int) ($validated['limit'] ?? 5),
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'stats' => $summary['stats'],
            'room_admissions' => $summary['room_admissions'],
        ]);
    }

    public function roomAdmissionDetails(Request $request, int $admissionId): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access room admission details.',
            ], 403);
        }

        try {
            $admission = $this->appointments->getPatientRoomAdmissionDetails(
                (int) $patient->id,
                $admissionId,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }

        return response()->json([
            'room_admission' => $admission,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access appointment history.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $appointments = $this->appointments->listPatientRecentHistory(
            (int) $patient->id,
            (int) ($validated['limit'] ?? 5),
        );

        return response()->json([
            'appointments' => $appointments,
        ]);
    }

    public function show(Request $request, int $appointmentId): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access appointment details.',
            ], 403);
        }

        try {
            $appointment = $this->appointments->getPatientAppointmentDetails(
                (int) $patient->id,
                $appointmentId,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }

        return response()->json([
            'appointment' => $appointment,
        ]);
    }

    public function summary(Request $request, int $appointmentId): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access appointment summaries.',
            ], 403);
        }

        try {
            $appointment = $this->appointments->getPatientAppointmentSummary(
                (int) $patient->id,
                $appointmentId,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }

        return response()->json([
            'appointment' => $appointment,
        ]);
    }

    public function cancel(Request $request, int $appointmentId): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can cancel appointments.',
            ], 403);
        }

        try {
            $appointment = $this->appointments->cancelPatientAppointment(
                (int) $patient->id,
                $appointmentId,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }

        return response()->json([
            'message' => 'Appointment cancelled successfully.',
            'appointment' => $appointment,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can book appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'doctor_id' => ['required', 'integer', 'min:1'],
            'appointment_type' => ['required', 'string', 'in:online,in-person'],
            'appointment_date' => ['required', 'date', 'after:now'],
        ]);

        try {
            $appointment = $this->appointments->createPatientAppointment(
                (int) $patient->id,
                (int) $validated['doctor_id'],
                (string) $validated['appointment_date'],
                (string) $validated['appointment_type'],
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'appointment' => $appointment,
        ], 201);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstDoctorAppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class DoctorAppointmentController extends Controller
{
    public function __construct(private readonly DatabaseFirstDoctorAppointmentService $appointments)
    {
        $this->middleware('auth:doctor');
    }

    public function index(Request $request): JsonResponse
    {
        $doctor = $request->user();

        if (! $doctor || ($doctor->role ?? null) !== 'doctor') {
            return response()->json([
                'message' => 'Only doctors can access doctor appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,confirmed,completed,cancelled'],
            'scope' => ['nullable', 'string', 'in:all,upcoming,today'],
        ]);

        $scope = $validated['scope'] ?? 'all';

        try {
            $appointments = $this->appointments->listDoctorAppointments(
                (int) $doctor->id,
                $validated['status'] ?? null,
                $scope,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'appointments' => $appointments,
        ]);
    }

    public function updateStatus(Request $request, int $appointmentId): JsonResponse
    {
        $doctor = $request->user();

        if (! $doctor || ($doctor->role ?? null) !== 'doctor') {
            return response()->json([
                'message' => 'Only doctors can update appointment status.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,confirmed,completed,cancelled'],
        ]);

        try {
            $appointment = $this->appointments->updateDoctorAppointmentStatus(
                (int) $doctor->id,
                $appointmentId,
                (string) $validated['status'],
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Appointment status updated successfully.',
            'appointment' => $appointment,
        ]);
    }

    public function roomAdmissionsSummary(Request $request): JsonResponse
    {
        $doctor = $request->user();

        if (! $doctor || ($doctor->role ?? null) !== 'doctor') {
            return response()->json([
                'message' => 'Only doctors can access room admission summary.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        try {
            $summary = $this->appointments->getDoctorRoomAdmissionsSummary(
                (int) $doctor->id,
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
        $doctor = $request->user();

        if (! $doctor || ($doctor->role ?? null) !== 'doctor') {
            return response()->json([
                'message' => 'Only doctors can access room admission details.',
            ], 403);
        }

        try {
            $admission = $this->appointments->getDoctorRoomAdmissionDetails(
                (int) $doctor->id,
                $admissionId,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'room_admission' => $admission,
        ]);
    }
}
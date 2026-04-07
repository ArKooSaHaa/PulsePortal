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
}
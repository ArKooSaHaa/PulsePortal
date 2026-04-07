<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstAdminAppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AdminAppointmentController extends Controller
{
    public function __construct(private readonly DatabaseFirstAdminAppointmentService $appointments)
    {
        $this->middleware('auth:admin');
    }

    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $admin || ($admin->role ?? null) !== 'admin') {
            return response()->json([
                'message' => 'Only admins can access appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,confirmed,completed,cancelled'],
        ]);

        try {
            $appointments = $this->appointments->listAppointments($validated['status'] ?? null);
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
        $admin = $request->user();

        if (! $admin || ($admin->role ?? null) !== 'admin') {
            return response()->json([
                'message' => 'Only admins can update appointment status.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,confirmed,completed,cancelled'],
        ]);

        try {
            $appointment = $this->appointments->updateAppointmentStatus(
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

    public function dashboardSummary(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $admin || ($admin->role ?? null) !== 'admin') {
            return response()->json([
                'message' => 'Only admins can access dashboard summary.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        try {
            $summary = $this->appointments->getDashboardSummary((int) ($validated['limit'] ?? 5));
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'stats' => $summary['stats'],
            'recent_appointments' => $summary['recent_appointments'],
        ]);
    }
}
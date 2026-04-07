<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly DatabaseFirstNotificationService $notifications)
    {
    }

    public function patientNotifications(Request $request): JsonResponse
    {
        $patient = $request->user();

        if (! $patient || ($patient->role ?? null) !== 'patient') {
            return response()->json([
                'message' => 'Only patients can access notifications.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $rows = $this->notifications->listPatientNotifications(
            (int) $patient->id,
            (int) ($validated['limit'] ?? 8),
        );

        return response()->json([
            'notifications' => $rows,
        ]);
    }

    public function doctorNotifications(Request $request): JsonResponse
    {
        $doctor = $request->user();

        if (! $doctor || ($doctor->role ?? null) !== 'doctor') {
            return response()->json([
                'message' => 'Only doctors can access notifications.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $rows = $this->notifications->listDoctorNotifications(
            (int) $doctor->id,
            (int) ($validated['limit'] ?? 8),
        );

        return response()->json([
            'notifications' => $rows,
        ]);
    }

    public function adminNotifications(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $admin || ($admin->role ?? null) !== 'admin') {
            return response()->json([
                'message' => 'Only admins can access notifications.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $rows = $this->notifications->listAdminNotifications(
            (int) $admin->id,
            (int) ($validated['limit'] ?? 8),
        );

        return response()->json([
            'notifications' => $rows,
        ]);
    }
}

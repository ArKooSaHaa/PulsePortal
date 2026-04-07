<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstAdminRoomAdmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AdminRoomAdmissionController extends Controller
{
    public function __construct(private readonly DatabaseFirstAdminRoomAdmissionService $roomAdmissions)
    {
        $this->middleware('auth:admin');
    }

    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $this->canManageRoomAdmissions($admin)) {
            return response()->json([
                'message' => 'Only HR and Super Admin can access room admissions.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:admitted,discharged'],
        ]);

        try {
            $admissions = $this->roomAdmissions->listAdmissions($validated['status'] ?? null);
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'admissions' => $admissions,
        ]);
    }

    public function lookups(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $this->canManageRoomAdmissions($admin)) {
            return response()->json([
                'message' => 'Only HR and Super Admin can access room lookups.',
            ], 403);
        }

        try {
            $data = $this->roomAdmissions->getLookupData();
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $this->canManageRoomAdmissions($admin)) {
            return response()->json([
                'message' => 'Only HR and Super Admin can create room admissions.',
            ], 403);
        }

        $validated = $request->validate([
            'patient_id' => ['required', 'integer', 'min:1'],
            'room_id' => ['required', 'integer', 'min:1'],
            'doctor_id' => ['nullable', 'integer', 'min:1'],
            'admission_reason' => ['nullable', 'string', 'max:500'],
            'admission_notes' => ['nullable', 'string', 'max:1000'],
            'admitted_at' => ['nullable', 'date'],
            'expected_discharge_at' => ['nullable', 'date', 'after_or_equal:admitted_at'],
        ]);

        try {
            $admission = $this->roomAdmissions->createAdmission(
                (int) $validated['patient_id'],
                (int) $validated['room_id'],
                isset($validated['doctor_id']) ? (int) $validated['doctor_id'] : null,
                $validated['admission_reason'] ?? null,
                $validated['admission_notes'] ?? null,
                $validated['admitted_at'] ?? null,
                $validated['expected_discharge_at'] ?? null,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Patient admitted to room successfully.',
            'admission' => $admission,
        ], 201);
    }

    public function discharge(Request $request, int $admissionId): JsonResponse
    {
        $admin = $request->user();

        if (! $this->canManageRoomAdmissions($admin)) {
            return response()->json([
                'message' => 'Only HR and Super Admin can discharge admissions.',
            ], 403);
        }

        $validated = $request->validate([
            'discharge_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $admission = $this->roomAdmissions->dischargeAdmission(
                $admissionId,
                $validated['discharge_notes'] ?? null,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Room admission discharged successfully.',
            'admission' => $admission,
        ]);
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $admin = $request->user();

        if (! $this->canManageRoomAdmissions($admin)) {
            return response()->json([
                'message' => 'Only HR and Super Admin can access room dashboard summary.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        try {
            $summary = $this->roomAdmissions->getDashboardSummary((int) ($validated['limit'] ?? 5));
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'stats' => $summary['stats'],
            'recent_admissions' => $summary['recent_admissions'],
        ]);
    }

    private function canManageRoomAdmissions(mixed $admin): bool
    {
        if (! $admin || ($admin->role ?? null) !== 'admin') {
            return false;
        }

        return in_array(
            $this->normalizeAdminRole((string) ($admin->admin_role ?? '')),
            ['super', 'hr'],
            true,
        );
    }

    private function normalizeAdminRole(string $role): string
    {
        $value = strtolower(trim($role));

        return match ($value) {
            'super', 'super admin', 'super-admin', 'super_admin' => 'super',
            'hr' => 'hr',
            'manager' => 'manager',
            default => 'unknown',
        };
    }
}

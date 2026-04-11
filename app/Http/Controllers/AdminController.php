<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Services\AdminService;

class AdminController extends Controller
{
    protected AdminService $adminService;

    public function __construct(AdminService $adminService)
    {
        $this->middleware(['auth:api', 'role:admin']);
        $this->adminService = $adminService;
    }

    // POST /api/admin/doctors
    public function createDoctor(Request $request)
    {
        $result = $this->adminService->createDoctor($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Doctor account created successfully.',
            'data' => $result,
        ], 201);
    }

    // POST /api/admin/admins
    public function createAdmin(Request $request)
    {
        $result = $this->adminService->createAdmin($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Admin account created successfully.',
            'data' => $result,
        ], 201);
    }

    // GET /api/admin/doctors
    public function getDoctors()
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->adminService->getAllDoctors(),
        ]);
    }

    // GET /api/admin/patients
    public function getPatients()
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->adminService->getAllPatients(),
        ]);
    }

    // GET /api/admin/appointments
    public function getAppointments()
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->adminService->getAllAppointments(),
        ]);
    }

    // GET /api/admin/stats
    public function getStats()
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->adminService->getStats(),
        ]);
    }
}

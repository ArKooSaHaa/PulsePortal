<?php

namespace App\Http\Controllers;

use App\Models\Doctor;

class DoctorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    // GET /api/doctor/available
    public function index()
    {
        $doctors = Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(fn($d) => [
                'id'             => $d->id,
                'name'           => $d->user->name,
                'specialization' => $d->specialization,
                'bio'            => $d->bio,
                'fee'            => $d->consultation_fee,
                'availability'   => $d->availability,
            ]);

        return response()->json([
            'status' => 'success',
            'data'   => $doctors,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:admin');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:doctors,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'license_number' => ['nullable', 'string', 'max:255'],
            'available_days' => ['nullable', 'array'],
            'available_days.*' => ['string', 'max:10'],
            'photo' => ['nullable', 'file', 'image', 'max:2048'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('doctors', 'public');
        }

        $doctor = Doctor::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'role' => 'doctor',
            'department' => $validated['department'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'license_number' => $validated['license_number'] ?? null,
            'available_days' => $validated['available_days'] ?? [],
            'photo_path' => $photoPath,
        ]);

        return response()->json([
            'message' => 'Doctor account created successfully.',
            'doctor' => $doctor,
        ], 201);
    }
}

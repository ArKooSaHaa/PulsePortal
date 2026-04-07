<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstDoctorRegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class DoctorController extends Controller
{
    public function __construct(private readonly DatabaseFirstDoctorRegistrationService $doctorRegistration)
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

        try {
            $doctor = $this->doctorRegistration->createDoctor(
                (string) $validated['name'],
                (string) $validated['email'],
                (string) $validated['password'],
                $validated['phone'] ?? null,
                $validated['department'] ?? null,
                $validated['specialization'] ?? null,
                $validated['license_number'] ?? null,
                $validated['available_days'] ?? [],
                $photoPath,
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Doctor account created successfully.',
            'doctor' => $doctor,
        ], 201);
    }
}

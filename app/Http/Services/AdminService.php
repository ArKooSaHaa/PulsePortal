<?php

namespace App\Http\Services;

use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;
use App\Mail\WelcomeDoctorMail;
use App\Mail\AdminWelcomMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Mail;

class AdminService
{
    // Create a doctor account + doctor profile in one transaction
    public function createDoctor(array $data): array
    {
        $validatedData = Validator::make($data, [
            'name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\s\-\.]+$/u'],
            'email' => ['required', 'email', 'unique:users,email', 'regex:/^[a-zA-Z0-9._%+\-]+@(gmail\.com|yahoo\.com|outlook\.com|aust\.edu|pulseportal\.com)$/'],
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'specialization' => 'required|string|max:100',
            'bio' => 'nullable|string|max:1000',
            'phone' => 'nullable|string|max:20',
            'consultation_fee' => 'nullable|numeric|min:0',
            'availability_days' => 'nullable|array',
            'availability_days.*' => 'string|in:SUN,MON,TUE,WED,THU,FRI,SAT',
        ], [
            'email.regex' => 'Only gmail.com, yahoo.com, outlook.com, aust.edu, and pulseportal.com emails are allowed.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
            'name.regex' => 'Name can only contain letters, spaces, hyphens, and dots.',
        ])->validate();

        return DB::transaction(function () use ($validatedData, $data) {
            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'role' => 'doctor',
            ]);

            // Parse availability days into JSON
            $availability = null;
            if (!empty($validatedData['availability_days'])) {
                $availability = ['days' => $validatedData['availability_days']];
            }

            Doctor::create([
                'user_id'          => $user->id,
                'specialization'   => $data['specialization'],
                'department'       => $data['department'] ?? null,
                'bio'              => $data['bio'] ?? null,
                'phone'            => $data['phone'] ?? null,
                'consultation_fee' => $data['consultation_fee'] ?? 0,
                'availability'     => $availability,
                'is_available'     => true,
            ]);

            Mail::to($data['email'])->queue(new WelcomeDoctorMail($data['name'], $data['email'], $data['password']));

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'specialization' => $validatedData['specialization'],
            ];
        });
    }

    // Create an admin account + admin profile in one transaction
    public function createAdmin(array $data): array
    {
        $validatedData = Validator::make($data, [
            'name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\s\-\.]+$/u'],
            'email' => ['required', 'email', 'unique:users,email', 'regex:/^[a-zA-Z0-9._%+\-]+@(gmail\.com|yahoo\.com|outlook\.com|aust\.edu|pulseportal\.com)$/'],
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'phone' => 'nullable|string|max:20',
        ], [
            'email.regex' => 'Only gmail.com, yahoo.com, outlook.com, aust.edu, and pulseportal.com emails are allowed.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
            'name.regex' => 'Name can only contain letters, spaces, hyphens, and dots.',
        ])->validate();

        return DB::transaction(function () use ($validatedData, $data) {
            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'role' => 'admin',
            ]);

            Admin::create([
                'user_id' => $user->id,
                'admin_role' => $data['admin_role'],
                'department' => $data['department'],
            ]);

            Mail::to($data['email'])->queue(new AdminWelcomMail($data['name'], $data['email'], $data['admin_role'], $data['department'], $data['password']));

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];
        });
    }

    // Get all doctors
    public function getAllDoctors(): array
    {
        return \App\Models\Doctor::with('user')
            ->get()
            ->map(fn($d) => [
                'id'             => $d->id,
                'user_id'        => $d->user_id,
                'name'           => $d->user->name,
                'email'          => $d->user->email,
                'specialization' => $d->specialization,
                'department'     => $d->department,
                'phone'          => $d->phone,
                'fee'            => $d->consultation_fee,
                'is_available'   => $d->is_available,
                'availability'   => $d->availability,
            ])
            ->toArray();
    }

    // Get all patients
    public function getAllPatients(): array
    {
        return \App\Models\Patient::with('user')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'name' => $p->user->name,
                'email' => $p->user->email,
            ])
            ->toArray();
    }

    // Get all appointments for admin overview
    public function getAllAppointments(): array
    {
        return \App\Models\Appointment::with(['patient.user', 'doctor.user'])
            ->orderBy('appointment_date', 'desc')
            ->get()
            ->map(fn($a) => [
                'id'               => $a->id,
                'patient_name'     => $a->patient->user->name ?? 'Unknown',
                'doctor_name'      => $a->doctor->user->name ?? 'Unknown',
                'specialization'   => $a->doctor->specialization ?? '',
                'department'       => $a->doctor->department ?? '',
                'appointment_date' => $a->appointment_date,
                'appointment_time' => $a->appointment_time,
                'type'             => $a->type,
                'status'           => $a->status,
            ])
            ->toArray();
    }

    public function getStats(): array
    {
        $today = now()->toDateString();
        return [
            'total_doctors' => Doctor::count(),
            'total_patients' => Patient::count(),
            'appointments_today' => Appointment::whereDate('appointment_date', $today)->count(),
            'upcoming_appointments' => Appointment::whereIn('status', ['pending', 'confirmed'])->count(),
        ];
    }
}

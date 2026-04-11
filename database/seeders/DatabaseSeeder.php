<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Admin;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\VisitNote;
use Carbon\Carbon;
use Faker\Factory as Faker;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Super Admin (System Admin)
        $superAdminUser = User::create([
            'name'     => 'System Admin',
            'email'    => 'admin@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);
        Admin::create([
            'user_id'    => $superAdminUser->id,
            'admin_role' => 'Super Admin',
            'department' => null,
        ]);

        // 2. Department Admin: Cardiology
        $cardioAdminUser = User::create([
            'name'     => 'Cardio Admin',
            'email'    => 'cardio@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);
        Admin::create([
            'user_id'    => $cardioAdminUser->id,
            'admin_role' => 'Department Admin',
            'department' => 'Cardiology',
        ]);

        // 3. Department Admin: Neurology
        $neuroAdminUser = User::create([
            'name'     => 'Neuro Admin',
            'email'    => 'neuro@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);
        Admin::create([
            'user_id'    => $neuroAdminUser->id,
            'admin_role' => 'Department Admin',
            'department' => 'Neurology',
        ]);

        // 4. Doctor: Cardiology
        $doctorUser = User::create([
            'name'     => 'Dr. Maliha Khanam',
            'email'    => 'doctor@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'doctor',
        ]);
        $doctor = Doctor::create([
            'user_id'          => $doctorUser->id,
            'specialization'   => 'Cardiology',
            'department'       => 'Cardiology',
            'bio'              => 'Senior Cardiologist with 10+ years experience.',
            'phone'            => '01711000001',
            'consultation_fee' => 800.00,
            'is_available'     => true,
            'availability'     => [
                'tue' => ['09:00', '13:00'],
                'wed' => ['13:00', '17:00'],
                'thu' => ['09:00', '13:00'],
                'fri' => ['09:00', '13:00'],
            ],
            'license_number'   => 'BMDC-' . rand(10000, 99999),
            'rating'           => 4.9,
            'reviews_count'    => 120,
        ]);

        // 5. Doctor: Neurology
        $neuroDoctorUser = User::create([
            'name'     => 'Dr. James Wilson',
            'email'    => 'neuro_doc@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'doctor',
        ]);
        $neuroDoctor = Doctor::create([
            'user_id'          => $neuroDoctorUser->id,
            'specialization'   => 'Neurology',
            'department'       => 'Neurology',
            'bio'              => 'Specialist in neurological disorders.',
            'phone'            => '01711000004',
            'consultation_fee' => 1000.00,
            'is_available'     => true,
            'availability'     => [
                'mon' => ['10:00', '18:00'],
                'wed' => ['10:00', '18:00'],
                'fri' => ['10:00', '14:00'],
            ],
        ]);

        // 6. Patient
        $patientUser = User::create([
            'name'     => 'Rahim Uddin',
            'email'    => 'patient@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'patient',
        ]);
        $patient = Patient::create([
            'user_id'           => $patientUser->id,
            'dob'               => '1990-05-15',
            'blood_group'       => 'O+',
            'medical_history'   => 'Mild hypertension diagnosed 2022.',
            'phone'             => '01811000002',
            'address'           => 'Mirpur-10, Dhaka',
            'emergency_contact' => 'Karim Uddin',
            'emergency_phone'   => '01911000003',
        ]);

        // 7. Sample Appointments
        // Completed Cardiology appt
        $appointment = Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctor->id,
            'appointment_date' => now()->subDays(2)->toDateString(),
            'appointment_time' => '10:00:00',
            'type'             => 'in_person',
            'status'           => 'completed',
            'symptoms'         => 'Chest tightness and occasional shortness of breath.',
            'admin_notes'      => 'Scheduled at Room 204.',
        ]);

        // Pending Cardiology appt (should be visible to Cardio Admin)
        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctor->id,
            'appointment_date' => now()->addDays(1)->toDateString(),
            'appointment_time' => '09:00:00',
            'type'             => 'in_person',
            'status'           => 'pending',
            'symptoms'         => 'Headache and dizziness',
        ]);

        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctor->id,
            'appointment_date' => now()->addDays(3)->toDateString(),
            'appointment_time' => '10:30:00',
            'type'             => 'online',
            'status'           => 'confirmed',
            'symptoms'         => 'Follow-up on blood pressure medication.',
        ]);

        // Pending Neurology appt (should be visible to Neuro Admin)
        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $neuroDoctor->id,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '11:00:00',
            'type'             => 'online',
            'status'           => 'pending',
            'symptoms'         => 'Frequent tremors in hands.',
        ]);

        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $neuroDoctor->id,
            'appointment_date' => now()->addDays(4)->toDateString(),
            'appointment_time' => '14:00:00',
            'type'             => 'in_person',
            'status'           => 'pending',
            'symptoms'         => 'Persistent migraines for two weeks.',
        ]);

        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $neuroDoctor->id,
            'appointment_date' => now()->subDays(1)->toDateString(),
            'appointment_time' => '15:30:00',
            'type'             => 'in_person',
            'status'           => 'cancelled',
            'symptoms'         => 'Sleep disorder and insomnia.',
        ]);

        // 8. Visit Note
        VisitNote::create([
            'appointment_id' => $appointment->id,
            'doctor_notes'   => 'BP stable at 130/85. ECG normal. Prescribed Amlodipine 5mg once daily.',
        ]);
    }
}

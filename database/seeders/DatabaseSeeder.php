<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Admin;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\VisitNote;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $faker = Faker::create('en_US');
        $allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'aust.edu', 'pulseportal.com'];

        // --- 1. ADMINS (Super & Department Specific) ---
        $superAdminUser = User::firstOrCreate(
            ['email' => 'admin@pulseportal.com'],
            [
                'name'     => 'System Admin',
                'password' => Hash::make('Password123'),
                'role'     => 'admin',
            ]
        );
        Admin::firstOrCreate(
            ['user_id' => $superAdminUser->id],
            [
                'admin_role' => 'Super Admin',
                'department' => null,
            ]
        );

        $cardioAdminUser = User::firstOrCreate(
            ['email' => 'cardio@pulseportal.com'],
            [
                'name'     => 'Cardio Admin',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );
        Admin::firstOrCreate(
            ['user_id' => $cardioAdminUser->id],
            [
                'admin_role' => 'Department Admin',
                'department' => 'Cardiology',
            ]
        );

        $neuroAdminUser = User::firstOrCreate(
            ['email' => 'neuro@pulseportal.com'],
            [
                'name'     => 'Neuro Admin',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );
        Admin::firstOrCreate(
            ['user_id' => $neuroAdminUser->id],
            [
                'admin_role' => 'Department Admin',
                'department' => 'Neurology',
            ]
        );

        $moreDepts = ['Orthopedics', 'Paediatrics', 'OBGYN', 'Dermatology', 'Gastroenterology', 'Urology', 'Psychiatry'];
        foreach ($moreDepts as $dept) {
            $slug = strtolower(str_replace([' ', '&'], ['_', 'n'], $dept));
            $email = $slug . '_admin@pulseportal.com';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'     => $dept . ' Admin',
                    'password' => Hash::make('password123'),
                    'role'     => 'admin',
                ]
            );
            Admin::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'admin_role' => 'Department Admin',
                    'department' => $dept,
                ]
            );
        }

        // --- 2. SAMPLE PATIENT ---
        $patientUser = User::create([
            'name'     => 'Shahadat Hasan',
            'email'    => 'patient@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'patient',
        ]);
        $patient = Patient::create([
            'user_id'           => $patientUser->id,
            'dob'               => '2001-12-26',
            'blood_group'       => 'A+',
            'medical_history'   => 'Mild hypertension diagnosed 2022.',
            'phone'             => '01811000002',
            'address'           => 'Mirpur-2, Dhaka',
            'emergency_contact' => 'Karim Uddin',
            'emergency_phone'   => '01911000003',
        ]);

        // --- 3. SPECIFIC DOCTORS (Manual Entry) ---
        $doctorUser = User::create([
            'name'     => 'Dr. Maliha Khanam',
            'email'    => 'doctor@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'doctor',
        ]);
        $doctorCardio = Doctor::create([
            'user_id'          => $doctorUser->id,
            'specialization'   => 'Cardiology',
            'department'       => 'Cardiology',
            'bio'              => 'Senior Cardiologist with 10+ years experience.',
            'phone'            => '01711000001',
            'consultation_fee' => 800.00,
            'is_available'     => true,
            'availability'     => [
                'sun' => ['09:00', '13:00'],
                'tue' => ['09:00', '13:00'],
                'wed' => ['13:00', '17:00'],
                'thu' => ['09:00', '13:00'],
                'fri' => ['09:00', '13:00'],
            ],
            'license_number'   => 'BMDC-' . rand(10000, 99999),
            'rating'           => 4.9,
            'reviews_count'    => 120,
        ]);

        $neuroDoctorUser = User::create([
            'name'     => 'Dr. James Wilson',
            'email'    => 'neuro_doc@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'doctor',
        ]);
        $doctorNeuro = Doctor::create([
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
            'license_number'   => 'BMDC-' . rand(10000, 99999),
        ]);

        // --- 4. DYNAMIC DOCTOR GENERATION ---
        $specializations = [
            'Anesthesiology',
            'Cardiology',
            'Colorectal & Laparoscopic Surgery',
            'Diet and Nutrition',
            'Gastroenterology',
            'Internal Medicine',
            'Microbiology',
            'Neuro & Critical Care',
            'Neuromedicine',
            'Ophthalmology',
            'Paediatric Hemato-Oncology',
            'Paediatrics',
            'Plastic Surgery',
            'Respiratory Medicine',
            'Urology',
            'Breast Surgery',
            'Child Development',
            'Dental Care, Orthodontics & Maxillofacial Surgery',
            'Endocrinology',
            'General Surgery',
            'IVF',
            'Neonatology',
            'Neuro ICU',
            'OBGYN',
            'Orthopedics',
            'Paediatric Nephrology',
            'Pain Medicine',
            'Psychiatry',
            'Rheumatology',
            'Cardiac & Vascular Surgery',
            'Clinical Hematology',
            'Dermatology',
            'ENT, Head & Neck Surgery',
            'Gyne & Gyne Oncology',
            'Laboratory & Pathology Medicine',
            'Nephrology',
            'Neuro Surgery',
            'Oncology',
            'Paediatric Cardiology',
            'Paediatric Surgery',
            'Physical Medicine & Rehabilitation',
            'Radiology & Imaging',
            'Transfusion Medicine'
        ];

        $doctorsList = [$doctorCardio, $doctorNeuro];

        foreach ($specializations as $spec) {
            $count = rand(3, 4);
            for ($i = 0; $i < $count; $i++) {
                $cleanName = preg_replace('/[^a-zA-Z\s\-\.]/', '', $faker->name());
                $emailPrefix = explode('@', $faker->unique()->safeEmail())[0];
                $emailDomain = $allowedDomains[array_rand($allowedDomains)];

                $user = User::create([
                    'name'     => 'Dr. ' . $cleanName,
                    'email'    => $emailPrefix . '@' . $emailDomain,
                    'password' => Hash::make('password123'),
                    'role'     => 'doctor',
                ]);

                $availability = ['mon' => ['09:00', '13:00']];
                $days = ['tue', 'wed', 'thu', 'fri', 'sat'];
                foreach ($days as $day) {
                    if (rand(0, 1) == 0) {
                        $availability[$day] = rand(0, 1) ? ['09:00', '13:00'] : ['13:00', '17:00'];
                    }
                }

                $doctorsList[] = Doctor::create([
                    'user_id'          => $user->id,
                    'specialization'   => $spec,
                    'department'       => $spec,
                    'bio'              => $faker->text(200),
                    'phone'            => '017' . rand(10000000, 99999999),
                    'consultation_fee' => rand(5, 15) * 100,
                    'is_available'     => true,
                    'availability'     => $availability,
                    'license_number'   => 'BMDC-' . rand(10000, 99999),
                    'rating'           => rand(35, 50) / 10,
                    'reviews_count'    => rand(5, 500),
                ]);
            }
        }

        // --- 5. APPOINTMENTS (Manual + Random) ---
        // Completed Appointment with Visit Note
        $completedAppt = Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorCardio->id,
            'appointment_date' => now()->subDays(2)->toDateString(),
            'appointment_time' => '10:00:00',
            'type'             => 'in_person',
            'status'           => 'completed',
            'symptoms'         => 'Chest tightness and occasional shortness of breath.',
            'admin_notes'      => 'Scheduled at Room 204.',
        ]);

        VisitNote::create([
            'appointment_id' => $completedAppt->id,
            'doctor_notes'   => 'BP stable at 130/85. ECG normal. Prescribed Amlodipine 5mg once daily.',
        ]);

        // Specific Pending/Confirmed/Cancelled Entries
        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorCardio->id,
            'appointment_date' => now()->addDays(1)->toDateString(),
            'appointment_time' => '09:00:00',
            'type'             => 'in_person',
            'status'           => 'pending',
            'symptoms'         => 'Headache and dizziness',
        ]);

        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorNeuro->id,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '11:00:00',
            'type'             => 'online',
            'status'           => 'pending',
            'symptoms'         => 'Frequent tremors in hands.',
        ]);

        // Bulk Random Appointments
        $symptomsArr = ['Fever', 'Chest pain', 'Stomach ache', 'Checkup', 'Toothache', 'Migraine'];
        for ($i = 0; $i < 15; $i++) {
            $statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];
            $status = $statusOptions[array_rand($statusOptions)];
            $doc = $doctorsList[array_rand($doctorsList)];

            $appt = Appointment::create([
                'patient_id'       => $patient->id,
                'doctor_id'        => $doc->id,
                'appointment_date' => Carbon::now()->addDays(rand(-30, 30))->format('Y-m-d'),
                'appointment_time' => sprintf("%02d:00:00", rand(9, 16)),
                'type'             => rand(0, 1) ? 'in_person' : 'online',
                'status'           => $status,
                'symptoms'         => $symptomsArr[array_rand($symptomsArr)],
                'rating'           => $status === 'completed' ? rand(4, 5) : null,
            ]);

            if ($status === 'completed') {
                VisitNote::create([
                    'appointment_id' => $appt->id,
                    'doctor_notes'   => 'Patient examined and advised rest.',
                ]);
            }
        }

        // --- 6. ONLINE SETUP TEST DATA ---
        // 1. Confirmed Online Appointment (Today, Joinable)
        $confirmedOnline = Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorCardio->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => now()->addHour()->format('H:00:00'),
            'type'             => 'online',
            'status'           => 'confirmed',
            'symptoms'         => 'Test: Regular checkup for online setup validation.',
        ]);

        // 2. In-Progress Online Appointment (Active Room)
        $inProgressOnline = Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorNeuro->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => now()->subMinutes(10)->format('H:i:00'),
            'type'             => 'online',
            'status'           => 'in_progress',
            'symptoms'         => 'Test: Ongoing consultation test.',
        ]);

        Consultation::create([
            'appointment_id' => $inProgressOnline->id,
            'room_name'      => 'PP-' . Str::random(10) . '-' . $inProgressOnline->id,
            'started_at'     => now()->subMinutes(10),
        ]);

        // 3. Pending Online Appointment (Upcoming)
        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorCardio->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '14:00:00',
            'type'             => 'online',
            'status'           => 'pending',
            'symptoms'         => 'Test: Future online appointment.',
        ]);

        // 4. Confirmed In-Person Appointment (Today)
        Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorCardio->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '15:30:00',
            'type'             => 'in_person',
            'status'           => 'confirmed',
            'symptoms'         => 'Test: Offline (In-Person) today.',
        ]);

        // 5. Completed In-Person Appointment (Yesterday)
        $pastOffline = Appointment::create([
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorCardio->id,
            'appointment_date' => now()->subDay()->toDateString(),
            'appointment_time' => '11:00:00',
            'type'             => 'in_person',
            'status'           => 'completed',
            'symptoms'         => 'Test: Completed offline session.',
        ]);

        VisitNote::create([
            'appointment_id' => $pastOffline->id,
            'doctor_notes'   => 'Patient recovered well. Previous prescription effective.',
        ]);

        // 6. Multiple Confirmed Online for Today (Stress Test)
        foreach(['16:00:00', '17:00:00', '18:00:00'] as $time) {
            Appointment::create([
                'patient_id'       => $patient->id,
                'doctor_id'        => $doctorCardio->id,
                'appointment_date' => now()->toDateString(),
                'appointment_time' => $time,
                'type'             => 'online',
                'status'           => 'confirmed',
                'symptoms'         => "Test: Stacked online session at {$time}",
            ]);
        }
    }
}

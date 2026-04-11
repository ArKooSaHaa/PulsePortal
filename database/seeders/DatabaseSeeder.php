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
        $faker = Faker::create('en_US');
        $allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'aust.edu', 'pulseportal.com'];

        // 1. Admin
        $adminUser = User::create([
            'name'     => 'System Admin',
            'email'    => 'admin@pulseportal.com',
            'password' => Hash::make('Password123'),
            'role'     => 'admin',
        ]);
        Admin::create(['user_id' => $adminUser->id]);

        // 2. Sample Patient
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

        $doctorUser = User::create([
            'name'     => 'Dr. Maliha Khanam',
            'email'    => 'doctor@pulseportal.com',
            'password' => Hash::make('password123'),
            'role'     => 'doctor',
        ]);
        $doctor = Doctor::create([
            'user_id'          => $doctorUser->id,
            'specialization'   => 'Dental Care, Orthodontics & Maxillofacial Surgery',
            'bio'              => 'Senior Dentist with 4+ years experience.',
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

        // List of specializations as requested
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

        $doctorsList = [];

        // Generate doctors per specialization
        foreach ($specializations as $spec) {
            $count = rand(3, 4);

            for ($i = 0; $i < $count; $i++) {
                $cleanName = preg_replace('/[^a-zA-Z\s\-\.]/', '', $faker->name());
                $docName = 'Dr. ' . $cleanName;

                $rating = rand(35, 50) / 10; // 3.5 to 5.0
                $reviewsCount = rand(5, 500);

                $emailPrefix = explode('@', $faker->unique()->safeEmail())[0];
                $emailDomain = $allowedDomains[array_rand($allowedDomains)];

                $user = User::create([
                    'name'     => $docName,
                    'email'    => $emailPrefix . '@' . $emailDomain,
                    'password' => Hash::make('password123'),
                    'role'     => 'doctor',
                ]);

                // Create availability block
                $availability = [];
                $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                $availability['mon'] = ['09:00', '13:00'];
                foreach ($days as $day) {
                    if (rand(0, 1) == 1) {
                        continue;
                    }
                    if (rand(0, 1) == 1) {
                        $availability[$day] = ['09:00', '13:00'];
                    } else {
                        $availability[$day] = ['13:00', '17:00'];
                    }
                }

                $doctor = Doctor::create([
                    'user_id'          => $user->id,
                    'specialization'   => $spec,
                    'bio'              => $faker->text(200),
                    'phone'            => '017' . rand(10000000, 99999999),
                    'consultation_fee' => rand(5, 15) * 100, // 500 to 1500
                    'is_available'     => true,
                    'availability'     => $availability,
                    'license_number'   => 'BMDC-' . rand(10000, 99999),
                    'rating'           => $rating,
                    'reviews_count'    => $reviewsCount,
                ]);

                $doctorsList[] = $doctor;
            }
        }

        // Generate some sample appointments for the patient utilizing the first few doctors
        $symptomsArr = ['Fever and headache', 'Chest pain', 'Stomach ache', 'Routine checkup', 'Toothache', 'Skin allergy'];
        for ($i = 0; $i < 10; $i++) {
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
                'admin_notes'      => $status === 'completed' ? 'All good.' : null,
                'rating'           => $status === 'completed' ? rand(4, 5) : null,
            ]);

            if ($status === 'completed') {
                VisitNote::create([
                    'appointment_id' => $appt->id,
                    'doctor_notes'   => 'Patient examined and advised rest.',
                ]);
            }
        }
    }
}

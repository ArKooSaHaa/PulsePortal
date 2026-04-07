<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseFirstDoctorRegistrationService
{
    private bool $proceduresChecked = false;

    public function createDoctor(
        string $name,
        string $email,
        string $plainPassword,
        ?string $phone = null,
        ?string $department = null,
        ?string $specialization = null,
        ?string $licenseNumber = null,
        array $availableDays = [],
        ?string $photoPath = null,
    ): object {
        $normalizedEmail = strtolower(trim($email));
        $hashedPassword = Hash::make($plainPassword);
        $encodedDays = ! empty($availableDays) ? json_encode(array_values($availableDays)) : null;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $id = DB::table('doctors')->insertGetId([
                'name' => $name,
                'email' => $normalizedEmail,
                'password' => $hashedPassword,
                'phone' => $phone,
                'role' => 'doctor',
                'department' => $department,
                'specialization' => $specialization,
                'license_number' => $licenseNumber,
                'available_days' => $encodedDays,
                'photo_path' => $photoPath,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $row = DB::table('doctors')
                ->select([
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'department',
                    'specialization',
                    'license_number',
                    'available_days',
                    'photo_path',
                    'created_at',
                    'updated_at',
                ])
                ->where('id', $id)
                ->first();

            return $this->normalizeDoctorRow($row ?? (object) []);
        }

        $this->ensureDoctorProcedures();

        $rows = DB::select(
            'EXEC sp_create_doctor @name = ?, @email = ?, @password = ?, @phone = ?, @department = ?, @specialization = ?, @license_number = ?, @available_days = ?, @photo_path = ?',
            [
                $name,
                $normalizedEmail,
                $hashedPassword,
                $phone,
                $department,
                $specialization,
                $licenseNumber,
                $encodedDays,
                $photoPath,
            ],
        );

        return $this->normalizeDoctorRow($rows[0] ?? (object) []);
    }

    private function normalizeDoctorRow(object $row): object
    {
        if (isset($row->available_days) && is_string($row->available_days) && $row->available_days !== '') {
            $decoded = json_decode($row->available_days, true);
            if (is_array($decoded)) {
                $row->available_days = $decoded;
            }
        }

        return $row;
    }

    private function ensureDoctorProcedures(): void
    {
        if ($this->proceduresChecked) {
            return;
        }

        $this->proceduresChecked = true;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_create_doctor
    @name NVARCHAR(255),
    @email NVARCHAR(255),
    @password NVARCHAR(255),
    @phone NVARCHAR(50) = NULL,
    @department NVARCHAR(255) = NULL,
    @specialization NVARCHAR(255) = NULL,
    @license_number NVARCHAR(100) = NULL,
    @available_days NVARCHAR(MAX) = NULL,
    @photo_path NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO doctors (
        name,
        email,
        password,
        phone,
        role,
        department,
        specialization,
        license_number,
        available_days,
        photo_path,
        created_at,
        updated_at
    )
    VALUES (
        @name,
        @email,
        @password,
        @phone,
        'doctor',
        @department,
        @specialization,
        @license_number,
        @available_days,
        @photo_path,
        GETDATE(),
        GETDATE()
    );

    DECLARE @doctor_id BIGINT = SCOPE_IDENTITY();

    SELECT TOP 1
        id,
        name,
        email,
        phone,
        role,
        department,
        specialization,
        license_number,
        available_days,
        photo_path,
        created_at,
        updated_at
    FROM doctors
    WHERE id = @doctor_id;
END;
SQL);
    }
}
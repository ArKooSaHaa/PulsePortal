<?php

namespace App\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class DatabaseFirstDoctorRegistrationService
{
    private bool $proceduresChecked = false;

    public function createDoctor(
        int $actingAdminId,
        string $name,
        string $email,
        string $plainPassword,
        string $confirmPassword,
        ?string $phone = null,
        ?string $department = null,
        ?string $specialization = null,
        ?string $licenseNumber = null,
        array $availableDays = [],
        ?string $photoPath = null,
    ): object {
        $actingAdminRole = $this->resolveAdminRole($actingAdminId);

        if (! in_array($actingAdminRole, ['super', 'manager'], true)) {
            throw new \RuntimeException('Only super admins and managers can create doctor accounts.');
        }

        $normalizedName = trim($name);
        $normalizedEmail = strtolower(trim($email));

        $hashedPassword = Hash::make($plainPassword);
        $encodedDays = ! empty($availableDays) ? json_encode(array_values($availableDays)) : null;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            if ($plainPassword === '' || $confirmPassword === '') {
                throw ValidationException::withMessages([
                    'confirm_password' => ['Password and confirm password are required.'],
                ]);
            }

            if (strlen($plainPassword) < 6) {
                throw ValidationException::withMessages([
                    'password' => ['Password must be at least 6 characters.'],
                ]);
            }

            if (! hash_equals($plainPassword, $confirmPassword)) {
                throw ValidationException::withMessages([
                    'confirm_password' => ['Password and confirm password do not match.'],
                ]);
            }

            $emailExists = DB::table('patients')
                ->where('email', $normalizedEmail)
                ->whereNull('deleted_at')
                ->exists()
                || DB::table('doctors')
                    ->where('email', $normalizedEmail)
                    ->whereNull('deleted_at')
                    ->exists()
                || DB::table('admins')
                    ->where('email', $normalizedEmail)
                    ->whereNull('deleted_at')
                    ->exists();

            if ($emailExists) {
                throw ValidationException::withMessages([
                    'email' => ['The email has already been taken.'],
                ]);
            }

            $id = DB::table('doctors')->insertGetId([
                'name' => $normalizedName,
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

        try {
            $rows = DB::select(
                'EXEC sp_create_doctor @acting_admin_id = ?, @name = ?, @email = ?, @password = ?, @plain_password = ?, @confirm_password = ?, @phone = ?, @department = ?, @specialization = ?, @license_number = ?, @available_days = ?, @photo_path = ?',
                [
                    $actingAdminId,
                    $normalizedName,
                    $normalizedEmail,
                    $hashedPassword,
                    $plainPassword,
                    $confirmPassword,
                    $phone,
                    $department,
                    $specialization,
                    $licenseNumber,
                    $encodedDays,
                    $photoPath,
                ],
            );
        } catch (QueryException $exception) {
            $mapped = $this->mapCreateDoctorValidationException($exception);

            if ($mapped !== null) {
                throw $mapped;
            }

            throw $exception;
        }

        if (! $rows) {
            throw new \RuntimeException('Doctor could not be created.');
        }

        return $this->normalizeDoctorRow($rows[0]);
    }

    private function mapCreateDoctorValidationException(QueryException $exception): ?ValidationException
    {
        $message = strtolower($exception->getMessage());

        if (str_contains($message, 'password and confirm password are required')) {
            return ValidationException::withMessages([
                'confirm_password' => ['Password and confirm password are required.'],
            ]);
        }

        if (str_contains($message, 'password and confirm password do not match')) {
            return ValidationException::withMessages([
                'confirm_password' => ['Password and confirm password do not match.'],
            ]);
        }

        if (str_contains($message, 'password must be at least 6 characters')) {
            return ValidationException::withMessages([
                'password' => ['Password must be at least 6 characters.'],
            ]);
        }

        if (str_contains($message, 'email has already been taken')) {
            return ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        return null;
    }

    private function resolveAdminRole(int $adminId): string
    {
        $row = DB::table('admins')
            ->select('admin_role')
            ->where('id', $adminId)
            ->whereNull('deleted_at')
            ->first();

        if (! $row) {
            throw new \RuntimeException('Acting admin account was not found.');
        }

        $rawRole = strtolower(trim((string) ($row->admin_role ?? '')));

        return match ($rawRole) {
            'super', 'super admin', 'super-admin', 'super_admin' => 'super',
            'manager' => 'manager',
            'hr' => 'hr',
            default => 'unknown',
        };
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
    @acting_admin_id BIGINT,
    @name NVARCHAR(255),
    @email NVARCHAR(255),
    @password NVARCHAR(255),
    @plain_password NVARCHAR(255),
    @confirm_password NVARCHAR(255),
    @phone NVARCHAR(50) = NULL,
    @department NVARCHAR(255) = NULL,
    @specialization NVARCHAR(255) = NULL,
    @license_number NVARCHAR(100) = NULL,
    @available_days NVARCHAR(MAX) = NULL,
    @photo_path NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @name = LTRIM(RTRIM(@name));
    SET @email = LOWER(LTRIM(RTRIM(@email)));

    DECLARE @acting_admin_role NVARCHAR(100);

    SELECT TOP 1 @acting_admin_role = LOWER(LTRIM(RTRIM(ISNULL(admin_role, ''))))
    FROM admins
    WHERE id = @acting_admin_id
      AND deleted_at IS NULL;

    IF @acting_admin_role NOT IN ('super', 'super admin', 'super-admin', 'super_admin', 'manager')
    BEGIN
        RETURN;
    END

    IF ISNULL(LEN(@plain_password), 0) = 0 OR ISNULL(LEN(@confirm_password), 0) = 0
    BEGIN
        RAISERROR('Password and confirm password are required.', 16, 1);
        RETURN;
    END

    IF LEN(@plain_password) < 6
    BEGIN
        RAISERROR('Password must be at least 6 characters.', 16, 1);
        RETURN;
    END

    IF @plain_password <> @confirm_password
    BEGIN
        RAISERROR('Password and confirm password do not match.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM patients WHERE email = @email AND deleted_at IS NULL)
        OR EXISTS (SELECT 1 FROM doctors WHERE email = @email AND deleted_at IS NULL)
        OR EXISTS (SELECT 1 FROM admins WHERE email = @email AND deleted_at IS NULL)
    BEGIN
        RAISERROR('The email has already been taken.', 16, 1);
        RETURN;
    END

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
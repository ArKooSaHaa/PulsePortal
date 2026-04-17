<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tymon\JWTAuth\Facades\JWTAuth;

class DatabaseFirstAuthService
{
    private bool $proceduresChecked = false;

    public function registerPatient(
        string $name,
        string $email,
        string $plainPassword,
        string $confirmPassword,
    ): Patient
    {
        $this->ensureAuthProcedures();

        $normalizedName = trim($name);
        $normalizedEmail = strtolower(trim($email));
        $hashedPassword = Hash::make($plainPassword);

        try {
            DB::statement(
                'EXEC sp_create_patient @name = ?, @email = ?, @password = ?, @plain_password = ?, @confirm_password = ?',
                [$normalizedName, $normalizedEmail, $hashedPassword, $plainPassword, $confirmPassword],
            );
        } catch (QueryException $exception) {
            $mapped = $this->mapRegistrationValidationException($exception);

            if ($mapped !== null) {
                throw $mapped;
            }

            throw $exception;
        }

        $row = $this->fetchOne('sp_get_patient_by_email', ['@email' => $normalizedEmail]);

        if (! $row) {
            throw new RuntimeException('Patient was not returned by database after registration.');
        }

        $patient = $this->hydrateModel(Patient::class, $row);

        return $patient;
    }

    private function mapRegistrationValidationException(QueryException $exception): ?ValidationException
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

    public function emailExists(string $email): bool
    {
        $this->ensureAuthProcedures();

        $normalizedEmail = strtolower(trim($email));
        $row = $this->fetchOne('sp_email_exists', ['@email' => $normalizedEmail]);

        return (bool) ($row->email_exists ?? false);
    }

    public function login(string $email, string $plainPassword): ?array
    {
        $this->ensureAuthProcedures();

        $normalizedEmail = strtolower(trim($email));

        $lookup = [
            ['procedure' => 'sp_get_admin_by_email', 'model' => Admin::class],
            ['procedure' => 'sp_get_doctor_by_email', 'model' => Doctor::class],
            ['procedure' => 'sp_get_patient_by_email', 'model' => Patient::class],
        ];

        foreach ($lookup as $candidate) {
            $row = $this->fetchOne($candidate['procedure'], ['@email' => $normalizedEmail]);

            if (! $row) {
                continue;
            }

            $storedPassword = (string) ($row->password ?? '');
            if (! $this->passwordMatches($plainPassword, $storedPassword)) {
                return null;
            }

            $user = $this->hydrateModel($candidate['model'], $row);
            $token = JWTAuth::fromUser($user);

            return [
                'token' => $token,
                'user' => $user,
            ];
        }

        return null;
    }

    private function passwordMatches(string $plainPassword, string $storedPassword): bool
    {
        if ($storedPassword === '') {
            return false;
        }

        if (hash_equals($storedPassword, $plainPassword)) {
            return true;
        }

        try {
            return Hash::check($plainPassword, $storedPassword);
        } catch (RuntimeException) {
            return false;
        }
    }

    private function fetchOne(string $procedure, array $namedParameters): ?object
    {
        $assignments = [];

        foreach (array_keys($namedParameters) as $name) {
            $assignments[] = "{$name} = ?";
        }

        $sql = sprintf('EXEC %s %s', $procedure, implode(', ', $assignments));
        $rows = DB::select($sql, array_values($namedParameters));

        return $rows[0] ?? null;
    }

    private function ensureAuthProcedures(): void
    {
        if ($this->proceduresChecked) {
            return;
        }

        $this->proceduresChecked = true;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        // Keep stored procedure definitions synchronized with application code.
        // CREATE OR ALTER is idempotent, so this is safe to run repeatedly.

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_create_patient
    @name NVARCHAR(255),
    @email NVARCHAR(255),
    @password NVARCHAR(255),
    @plain_password NVARCHAR(255),
    @confirm_password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SET @name = LTRIM(RTRIM(@name));
    SET @email = LOWER(LTRIM(RTRIM(@email)));

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

    INSERT INTO patients (name, email, password, role, created_at, updated_at)
    VALUES (@name, @email, @password, 'patient', GETDATE(), GETDATE());
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_email_exists
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM patients WHERE email = @email AND deleted_at IS NULL)
            OR EXISTS (SELECT 1 FROM doctors WHERE email = @email AND deleted_at IS NULL)
            OR EXISTS (SELECT 1 FROM admins WHERE email = @email AND deleted_at IS NULL)
        THEN 1
        ELSE 0
    END AS email_exists;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_patient_by_email
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM patients
    WHERE email = @email AND deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_doctor_by_email
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM doctors
    WHERE email = @email AND deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_by_email
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM admins
    WHERE email = @email AND deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_login_patient
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM patients
    WHERE email = @email AND deleted_at IS NULL;
END;
SQL);
    }

    private function hydrateModel(string $modelClass, object $row): Admin|Doctor|Patient
    {
        $model = new $modelClass();
        $model->setRawAttributes((array) $row, true);
        $model->exists = true;

        return $model;
    }
}

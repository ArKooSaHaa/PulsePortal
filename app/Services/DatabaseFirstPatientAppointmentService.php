<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class DatabaseFirstPatientAppointmentService
{
    private const DEFAULT_UPCOMING_LIMIT = 5;
    private const DEFAULT_HISTORY_LIMIT = 5;

    private bool $proceduresChecked = false;

    public function listDoctorsForBooking(?string $search = null, ?string $department = null): array
    {
        $normalizedSearch = trim((string) $search);
        $normalizedDepartment = trim((string) $department);

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $query = DB::table('doctors')
                ->select(['id', 'name', 'department', 'specialization', 'photo_path'])
                ->where('role', 'doctor')
                ->whereNull('deleted_at');

            if ($normalizedDepartment !== '') {
                $query->where('department', $normalizedDepartment);
            }

            if ($normalizedSearch !== '') {
                $query->where(function ($q) use ($normalizedSearch): void {
                    $q->where('name', 'like', "%{$normalizedSearch}%")
                        ->orWhere('specialization', 'like', "%{$normalizedSearch}%")
                        ->orWhere('department', 'like', "%{$normalizedSearch}%");
                });
            }

            return $query->orderBy('name')->get()->all();
        }

        $this->ensureAppointmentProcedures();

        return DB::select(
            'EXEC sp_get_doctors_for_booking @search = ?, @department = ?',
            [
                $normalizedSearch !== '' ? $normalizedSearch : null,
                $normalizedDepartment !== '' ? $normalizedDepartment : null,
            ],
        );
    }

    public function createPatientAppointment(
        int $patientId,
        int $doctorId,
        string $appointmentDate,
        string $appointmentType,
    ): object {
        if (! $this->patientExists($patientId)) {
            throw new RuntimeException('Patient account not found. Please sign in again.');
        }

        if (! $this->doctorExists($doctorId)) {
            throw new RuntimeException('Selected doctor is not available.');
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $payload = [
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'appointment_date' => $appointmentDate,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if ($hasTypeColumn) {
                $payload['appointment_type'] = $appointmentType;
            }

            $id = DB::table('appointments')->insertGetId($payload);

            $query = DB::table('appointments as a')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'd.name as doctor_name',
                    'd.specialization as doctor_specialization',
                    'd.department as doctor_department',
                ])
                ->where('a.id', $id);

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            $row = $query->first();

            if (! $row) {
                throw new RuntimeException('Appointment could not be created.');
            }

            return $row;
        }

        $this->ensureAppointmentProcedures();

        $rows = DB::select(
            'EXEC sp_create_appointment @patient_id = ?, @doctor_id = ?, @appointment_date = ?, @appointment_type = ?',
            [$patientId, $doctorId, $appointmentDate, $appointmentType],
        );

        if (! $rows) {
            throw new RuntimeException('Appointment could not be created.');
        }

        return $rows[0];
    }

    public function listPatientAppointments(int $patientId): array
    {
        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'd.name as doctor_name',
                    'd.specialization as doctor_specialization',
                    'd.department as doctor_department',
                ])
                ->where('a.patient_id', $patientId)
                ->orderByDesc('a.appointment_date');

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            return $query->get()->all();
        }

        $this->ensureAppointmentProcedures();

        return DB::select(
            'EXEC sp_get_patient_appointments @patient_id = ?',
            [$patientId],
        );
    }

    public function listPatientUpcomingAppointments(int $patientId, int $limit = self::DEFAULT_UPCOMING_LIMIT): array
    {
        $normalizedLimit = $limit > 0 ? $limit : self::DEFAULT_UPCOMING_LIMIT;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'd.name as doctor_name',
                    'd.specialization as doctor_specialization',
                    'd.department as doctor_department',
                ])
                ->where('a.patient_id', $patientId)
                ->where('a.appointment_date', '>=', now())
                ->where('a.status', '!=', 'cancelled')
                ->orderBy('a.appointment_date')
                ->limit($normalizedLimit);

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            return $query->get()->all();
        }

        $this->ensureAppointmentProcedures();

        return DB::select(
            'EXEC sp_get_patient_upcoming_appointments @patient_id = ?, @limit = ?',
            [$patientId, $normalizedLimit],
        );
    }

    public function listPatientRecentHistory(int $patientId, int $limit = self::DEFAULT_HISTORY_LIMIT): array
    {
        $normalizedLimit = $limit > 0 ? $limit : self::DEFAULT_HISTORY_LIMIT;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'd.name as doctor_name',
                    'd.specialization as doctor_specialization',
                    'd.department as doctor_department',
                ])
                ->where('a.patient_id', $patientId)
                ->where('a.appointment_date', '<', now())
                ->orderByDesc('a.appointment_date')
                ->limit($normalizedLimit);

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            return $query->get()->all();
        }

        $this->ensureAppointmentProcedures();

        return DB::select(
            'EXEC sp_get_patient_recent_history @patient_id = ?, @limit = ?',
            [$patientId, $normalizedLimit],
        );
    }

    public function getPatientAppointmentDetails(int $patientId, int $appointmentId): object
    {
        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'd.name as doctor_name',
                    'd.specialization as doctor_specialization',
                    'd.department as doctor_department',
                ])
                ->where('a.patient_id', $patientId)
                ->where('a.id', $appointmentId);

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            $row = $query->first();

            if (! $row) {
                throw new RuntimeException('Appointment not found.');
            }

            return $row;
        }

        $this->ensureAppointmentProcedures();

        $rows = DB::select(
            'EXEC sp_get_patient_appointment_details @patient_id = ?, @appointment_id = ?',
            [$patientId, $appointmentId],
        );

        if (! $rows) {
            throw new RuntimeException('Appointment not found.');
        }

        return $rows[0];
    }

    public function cancelPatientAppointment(int $patientId, int $appointmentId): object
    {
        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $row = DB::table('appointments')
                ->select(['id', 'status'])
                ->where('patient_id', $patientId)
                ->where('id', $appointmentId)
                ->first();

            if (! $row) {
                throw new RuntimeException('Appointment not found.');
            }

            if (strtolower((string) ($row->status ?? '')) !== 'cancelled') {
                DB::table('appointments')
                    ->where('id', $appointmentId)
                    ->where('patient_id', $patientId)
                    ->update([
                        'status' => 'cancelled',
                        'updated_at' => now(),
                    ]);
            }

            return $this->getPatientAppointmentDetails($patientId, $appointmentId);
        }

        $this->ensureAppointmentProcedures();

        $rows = DB::select(
            'EXEC sp_cancel_patient_appointment @patient_id = ?, @appointment_id = ?',
            [$patientId, $appointmentId],
        );

        if (! $rows) {
            throw new RuntimeException('Appointment not found.');
        }

        return $rows[0];
    }

    private function patientExists(int $patientId): bool
    {
        $row = DB::table('patients')
            ->select('id')
            ->where('id', $patientId)
            ->whereNull('deleted_at')
            ->first();

        return (bool) $row;
    }

    private function doctorExists(int $doctorId): bool
    {
        $row = DB::table('doctors')
            ->select('id')
            ->where('id', $doctorId)
            ->whereNull('deleted_at')
            ->first();

        return (bool) $row;
    }

    private function ensureAppointmentProcedures(): void
    {
        if ($this->proceduresChecked) {
            return;
        }

        $this->proceduresChecked = true;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        DB::unprepared("IF COL_LENGTH('appointments', 'appointment_type') IS NULL ALTER TABLE appointments ADD appointment_type NVARCHAR(30) NULL;");

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_doctors_for_booking
    @search NVARCHAR(255) = NULL,
    @department NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id,
        name,
        department,
        specialization,
        photo_path
    FROM doctors
        WHERE role = 'doctor'
            AND deleted_at IS NULL
      AND (
            @department IS NULL
            OR LTRIM(RTRIM(@department)) = ''
            OR department = @department
      )
      AND (
            @search IS NULL
            OR LTRIM(RTRIM(@search)) = ''
            OR name LIKE '%' + @search + '%'
            OR specialization LIKE '%' + @search + '%'
            OR department LIKE '%' + @search + '%'
      )
    ORDER BY name ASC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_create_appointment
    @patient_id BIGINT,
    @doctor_id BIGINT,
    @appointment_date DATETIME,
    @appointment_type NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO appointments (
        patient_id,
        doctor_id,
        appointment_date,
        appointment_type,
        status,
        created_at,
        updated_at
    )
    VALUES (
        @patient_id,
        @doctor_id,
        @appointment_date,
        @appointment_type,
        'pending',
        GETDATE(),
        GETDATE()
    );

    DECLARE @appointment_id BIGINT = SCOPE_IDENTITY();

    SELECT TOP 1
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.department AS doctor_department
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.id = @appointment_id;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_patient_appointments
    @patient_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.department AS doctor_department
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = @patient_id
    ORDER BY a.appointment_date DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_patient_upcoming_appointments
    @patient_id BIGINT,
    @limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 5;
    END

    SELECT TOP (@limit)
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        ISNULL(a.appointment_type, 'in-person') AS appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.department AS doctor_department
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = @patient_id
      AND a.appointment_date >= GETDATE()
      AND a.status <> 'cancelled'
    ORDER BY a.appointment_date ASC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_patient_recent_history
    @patient_id BIGINT,
    @limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 5;
    END

    SELECT TOP (@limit)
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        ISNULL(a.appointment_type, 'in-person') AS appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.department AS doctor_department
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = @patient_id
      AND a.appointment_date < GETDATE()
    ORDER BY a.appointment_date DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_patient_appointment_details
    @patient_id BIGINT,
    @appointment_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        ISNULL(a.appointment_type, 'in-person') AS appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.department AS doctor_department
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = @patient_id
      AND a.id = @appointment_id;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_cancel_patient_appointment
    @patient_id BIGINT,
    @appointment_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM appointments
        WHERE id = @appointment_id
          AND patient_id = @patient_id
    )
    BEGIN
        RETURN;
    END

    UPDATE appointments
    SET status = 'cancelled',
        updated_at = GETDATE()
    WHERE id = @appointment_id
      AND patient_id = @patient_id
      AND status <> 'cancelled';

    SELECT TOP 1
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        ISNULL(a.appointment_type, 'in-person') AS appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.department AS doctor_department
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = @patient_id
      AND a.id = @appointment_id;
END;
SQL);
    }
}

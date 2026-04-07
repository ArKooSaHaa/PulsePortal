<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class DatabaseFirstDoctorAppointmentService
{
    private const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
    private const ALLOWED_SCOPES = ['all', 'upcoming', 'today'];
    private const DEFAULT_ROOM_ADMISSION_LIMIT = 5;

    private bool $proceduresChecked = false;

    public function listDoctorAppointments(int $doctorId, ?string $status = null, string $scope = 'all'): array
    {
        $normalizedStatus = strtolower(trim((string) $status));
        $normalizedScope = strtolower(trim($scope));

        if ($normalizedStatus !== '' && ! in_array($normalizedStatus, self::ALLOWED_STATUSES, true)) {
            throw new RuntimeException('Invalid appointment status filter.');
        }

        if (! in_array($normalizedScope, self::ALLOWED_SCOPES, true)) {
            throw new RuntimeException('Invalid appointment scope filter.');
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'p.name as patient_name',
                    'p.email as patient_email',
                ])
                ->where('a.doctor_id', $doctorId)
                ->whereNull('p.deleted_at')
                ->orderBy('a.appointment_date');

            if ($normalizedStatus !== '') {
                $query->where('a.status', $normalizedStatus);
            }

            if ($normalizedScope === 'upcoming') {
                $query->where('a.appointment_date', '>', now());
            }

            if ($normalizedScope === 'today') {
                $query->whereDate('a.appointment_date', now()->toDateString());
            }

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            return $query->get()->all();
        }

        $this->ensureDoctorAppointmentProcedures();

        return DB::select(
            'EXEC sp_get_doctor_appointments @doctor_id = ?, @status = ?, @scope = ?',
            [$doctorId, $normalizedStatus !== '' ? $normalizedStatus : null, $normalizedScope],
        );
    }

    public function updateDoctorAppointmentStatus(int $doctorId, int $appointmentId, string $status): object
    {
        $normalizedStatus = strtolower(trim($status));

        if (! in_array($normalizedStatus, self::ALLOWED_STATUSES, true)) {
            throw new RuntimeException('Invalid appointment status.');
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $updated = DB::table('appointments')
                ->where('id', $appointmentId)
                ->where('doctor_id', $doctorId)
                ->update([
                    'status' => $normalizedStatus,
                    'updated_at' => now(),
                ]);

            if (! $updated) {
                throw new RuntimeException('Appointment not found for this doctor.');
            }

            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->select([
                    'a.id',
                    'a.patient_id',
                    'a.doctor_id',
                    'a.appointment_date',
                    'a.status',
                    'a.created_at',
                    'a.updated_at',
                    'p.name as patient_name',
                    'p.email as patient_email',
                ])
                ->where('a.id', $appointmentId)
                ->where('a.doctor_id', $doctorId)
                ->whereNull('p.deleted_at');

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            $row = $query->first();

            if (! $row) {
                throw new RuntimeException('Appointment could not be returned after update.');
            }

            return $row;
        }

        $this->ensureDoctorAppointmentProcedures();

        $rows = DB::select(
            'EXEC sp_update_doctor_appointment_status @doctor_id = ?, @appointment_id = ?, @status = ?',
            [$doctorId, $appointmentId, $normalizedStatus],
        );

        if (! $rows) {
            throw new RuntimeException('Appointment not found for this doctor.');
        }

        return $rows[0];
    }

    public function getDoctorRoomAdmissionsSummary(int $doctorId, int $limit = self::DEFAULT_ROOM_ADMISSION_LIMIT): array
    {
        $normalizedLimit = $limit > 0 ? $limit : self::DEFAULT_ROOM_ADMISSION_LIMIT;

        if (
            ! Schema::hasTable('room_admissions')
            || ! Schema::hasTable('hospital_rooms')
            || ! Schema::hasTable('patients')
        ) {
            return [
                'stats' => (object) [
                    'active_room_admissions' => 0,
                    'total_room_admissions' => 0,
                ],
                'room_admissions' => [],
            ];
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $stats = DB::table('room_admissions')
                ->selectRaw("SUM(CASE WHEN status = 'admitted' AND discharged_at IS NULL THEN 1 ELSE 0 END) AS active_room_admissions")
                ->selectRaw('COUNT(*) AS total_room_admissions')
                ->where('doctor_id', $doctorId)
                ->first();

            $roomAdmissions = DB::table('room_admissions as ra')
                ->join('hospital_rooms as hr', 'hr.id', '=', 'ra.room_id')
                ->join('patients as p', 'p.id', '=', 'ra.patient_id')
                ->select([
                    'ra.id',
                    'ra.room_id',
                    'ra.patient_id',
                    'ra.doctor_id',
                    'ra.status',
                    'ra.admission_reason',
                    'ra.admission_notes',
                    'ra.discharge_notes',
                    'ra.admitted_at',
                    'ra.expected_discharge_at',
                    'ra.discharged_at',
                    'ra.created_at',
                    'ra.updated_at',
                    'hr.room_number',
                    'hr.room_type',
                    'hr.floor_number',
                    'p.name as patient_name',
                    'p.email as patient_email',
                ])
                ->where('ra.doctor_id', $doctorId)
                ->whereNull('p.deleted_at')
                ->orderByRaw("CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN 0 ELSE 1 END")
                ->orderByDesc('ra.admitted_at')
                ->limit($normalizedLimit)
                ->get()
                ->all();

            return [
                'stats' => (object) [
                    'active_room_admissions' => (int) ($stats->active_room_admissions ?? 0),
                    'total_room_admissions' => (int) ($stats->total_room_admissions ?? 0),
                ],
                'room_admissions' => $roomAdmissions,
            ];
        }

        $this->ensureDoctorAppointmentProcedures();

        $statsRows = DB::select(
            'EXEC sp_get_doctor_room_admission_stats @doctor_id = ?',
            [$doctorId],
        );

        $roomAdmissionRows = DB::select(
            'EXEC sp_get_doctor_room_admissions @doctor_id = ?, @limit = ?',
            [$doctorId, $normalizedLimit],
        );

        return [
            'stats' => $statsRows[0] ?? (object) [
                'active_room_admissions' => 0,
                'total_room_admissions' => 0,
            ],
            'room_admissions' => $roomAdmissionRows,
        ];
    }

    public function getDoctorRoomAdmissionDetails(int $doctorId, int $admissionId): object
    {
        if (
            ! Schema::hasTable('room_admissions')
            || ! Schema::hasTable('hospital_rooms')
            || ! Schema::hasTable('patients')
        ) {
            throw new RuntimeException('Room admission not found for this doctor.');
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $row = DB::table('room_admissions as ra')
                ->join('hospital_rooms as hr', 'hr.id', '=', 'ra.room_id')
                ->join('patients as p', 'p.id', '=', 'ra.patient_id')
                ->leftJoin('doctors as d', 'd.id', '=', 'ra.doctor_id')
                ->select([
                    'ra.id',
                    'ra.room_id',
                    'ra.patient_id',
                    'ra.doctor_id',
                    'ra.status',
                    'ra.admission_reason',
                    'ra.admission_notes',
                    'ra.discharge_notes',
                    'ra.admitted_at',
                    'ra.expected_discharge_at',
                    'ra.discharged_at',
                    'ra.created_at',
                    'ra.updated_at',
                    'hr.room_number',
                    'hr.room_type',
                    'hr.floor_number',
                    'p.name as patient_name',
                    'p.email as patient_email',
                    'd.name as doctor_name',
                    'd.department as doctor_department',
                ])
                ->where('ra.id', $admissionId)
                ->where('ra.doctor_id', $doctorId)
                ->whereNull('p.deleted_at')
                ->first();

            if (! $row) {
                throw new RuntimeException('Room admission not found for this doctor.');
            }

            return $row;
        }

        $this->ensureDoctorAppointmentProcedures();

        $rows = DB::select(
            'EXEC sp_get_doctor_room_admission_details @doctor_id = ?, @admission_id = ?',
            [$doctorId, $admissionId],
        );

        if (! $rows) {
            throw new RuntimeException('Room admission not found for this doctor.');
        }

        return $rows[0];
    }

    private function ensureDoctorAppointmentProcedures(): void
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
CREATE OR ALTER PROCEDURE sp_get_doctor_appointments
    @doctor_id BIGINT,
    @status NVARCHAR(50) = NULL,
    @scope NVARCHAR(20) = 'all'
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        ISNULL(a.appointment_type, 'in-person') AS appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        p.name AS patient_name,
        p.email AS patient_email
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.doctor_id = @doctor_id
      AND p.deleted_at IS NULL
      AND (
            @status IS NULL
            OR LTRIM(RTRIM(@status)) = ''
            OR a.status = @status
      )
    AND (
        @scope = 'all'
        OR (@scope = 'upcoming' AND a.appointment_date > GETDATE())
        OR (@scope = 'today' AND CAST(a.appointment_date AS DATE) = CAST(GETDATE() AS DATE))
    )
    ORDER BY a.appointment_date ASC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_update_doctor_appointment_status
    @doctor_id BIGINT,
    @appointment_id BIGINT,
    @status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE appointments
    SET status = @status,
        updated_at = GETDATE()
    WHERE id = @appointment_id
      AND doctor_id = @doctor_id;

    IF @@ROWCOUNT = 0
    BEGIN
        RETURN;
    END

    SELECT TOP 1
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        ISNULL(a.appointment_type, 'in-person') AS appointment_type,
        a.status,
        a.created_at,
        a.updated_at,
        p.name AS patient_name,
        p.email AS patient_email
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.id = @appointment_id
      AND a.doctor_id = @doctor_id
      AND p.deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_doctor_room_admission_stats
    @doctor_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF OBJECT_ID('room_admissions', 'U') IS NULL
    BEGIN
        SELECT
            CAST(0 AS INT) AS active_room_admissions,
            CAST(0 AS INT) AS total_room_admissions;
        RETURN;
    END

    SELECT
        ISNULL(SUM(CASE WHEN status = 'admitted' AND discharged_at IS NULL THEN 1 ELSE 0 END), 0) AS active_room_admissions,
        COUNT(*) AS total_room_admissions
    FROM room_admissions
    WHERE doctor_id = @doctor_id;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_doctor_room_admissions
    @doctor_id BIGINT,
    @limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 5;
    END

    IF OBJECT_ID('room_admissions', 'U') IS NULL
       OR OBJECT_ID('hospital_rooms', 'U') IS NULL
       OR OBJECT_ID('patients', 'U') IS NULL
    BEGIN
        SELECT TOP (0)
            CAST(NULL AS BIGINT) AS id,
            CAST(NULL AS BIGINT) AS room_id,
            CAST(NULL AS BIGINT) AS patient_id,
            CAST(NULL AS BIGINT) AS doctor_id,
            CAST(NULL AS NVARCHAR(30)) AS status,
            CAST(NULL AS NVARCHAR(500)) AS admission_reason,
            CAST(NULL AS NVARCHAR(MAX)) AS admission_notes,
            CAST(NULL AS NVARCHAR(MAX)) AS discharge_notes,
            CAST(NULL AS DATETIME) AS admitted_at,
            CAST(NULL AS DATETIME) AS expected_discharge_at,
            CAST(NULL AS DATETIME) AS discharged_at,
            CAST(NULL AS DATETIME) AS created_at,
            CAST(NULL AS DATETIME) AS updated_at,
            CAST(NULL AS NVARCHAR(50)) AS room_number,
            CAST(NULL AS NVARCHAR(100)) AS room_type,
            CAST(NULL AS INT) AS floor_number,
            CAST(NULL AS NVARCHAR(255)) AS patient_name,
            CAST(NULL AS NVARCHAR(255)) AS patient_email;
        RETURN;
    END

    SELECT TOP (@limit)
        ra.id,
        ra.room_id,
        ra.patient_id,
        ra.doctor_id,
        ra.status,
        ra.admission_reason,
        ra.admission_notes,
        ra.discharge_notes,
        ra.admitted_at,
        ra.expected_discharge_at,
        ra.discharged_at,
        ra.created_at,
        ra.updated_at,
        hr.room_number,
        hr.room_type,
        hr.floor_number,
        p.name AS patient_name,
        p.email AS patient_email
    FROM room_admissions ra
    JOIN hospital_rooms hr ON hr.id = ra.room_id
    JOIN patients p ON p.id = ra.patient_id
    WHERE ra.doctor_id = @doctor_id
      AND p.deleted_at IS NULL
    ORDER BY
        CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN 0 ELSE 1 END,
        CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN ra.admitted_at END DESC,
        CASE WHEN ra.status <> 'admitted' OR ra.discharged_at IS NOT NULL THEN ISNULL(ra.discharged_at, ra.updated_at) END DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_doctor_room_admission_details
    @doctor_id BIGINT,
    @admission_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF OBJECT_ID('room_admissions', 'U') IS NULL
       OR OBJECT_ID('hospital_rooms', 'U') IS NULL
       OR OBJECT_ID('patients', 'U') IS NULL
    BEGIN
        RETURN;
    END

    SELECT TOP 1
        ra.id,
        ra.room_id,
        ra.patient_id,
        ra.doctor_id,
        ra.status,
        ra.admission_reason,
        ra.admission_notes,
        ra.discharge_notes,
        ra.admitted_at,
        ra.expected_discharge_at,
        ra.discharged_at,
        ra.created_at,
        ra.updated_at,
        hr.room_number,
        hr.room_type,
        hr.floor_number,
        p.name AS patient_name,
        p.email AS patient_email,
        d.name AS doctor_name,
        d.department AS doctor_department
    FROM room_admissions ra
    JOIN hospital_rooms hr ON hr.id = ra.room_id
    JOIN patients p ON p.id = ra.patient_id
    LEFT JOIN doctors d ON d.id = ra.doctor_id
    WHERE ra.id = @admission_id
      AND ra.doctor_id = @doctor_id
      AND p.deleted_at IS NULL;
END;
SQL);
    }
}
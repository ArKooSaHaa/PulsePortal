<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class DatabaseFirstAdminAppointmentService
{
    private const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
    private const DEFAULT_RECENT_LIMIT = 5;

    private bool $proceduresChecked = false;

    public function listAppointments(?string $status = null): array
    {
        $normalizedStatus = strtolower(trim((string) $status));

        if ($normalizedStatus !== '' && ! in_array($normalizedStatus, self::ALLOWED_STATUSES, true)) {
            throw new RuntimeException('Invalid appointment status filter.');
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
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
                    'd.name as doctor_name',
                    'd.department as doctor_department',
                    'd.specialization as doctor_specialization',
                ])
                ->whereNull('p.deleted_at')
                ->whereNull('d.deleted_at')
                ->orderByDesc('a.appointment_date');

            if ($normalizedStatus !== '') {
                $query->where('a.status', $normalizedStatus);
            }

            if ($hasTypeColumn) {
                $query->addSelect('a.appointment_type');
            } else {
                $query->selectRaw("'in-person' AS appointment_type");
            }

            return $query->get()->all();
        }

        $this->ensureAdminAppointmentProcedures();

        return DB::select(
            'EXEC sp_get_admin_appointments @status = ?',
            [$normalizedStatus !== '' ? $normalizedStatus : null],
        );
    }

    public function updateAppointmentStatus(int $appointmentId, string $status): object
    {
        $normalizedStatus = strtolower(trim($status));

        if (! in_array($normalizedStatus, self::ALLOWED_STATUSES, true)) {
            throw new RuntimeException('Invalid appointment status.');
        }

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $updated = DB::table('appointments')
                ->where('id', $appointmentId)
                ->update([
                    'status' => $normalizedStatus,
                    'updated_at' => now(),
                ]);

            if (! $updated) {
                throw new RuntimeException('Appointment not found.');
            }

            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $query = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
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
                    'd.name as doctor_name',
                    'd.department as doctor_department',
                    'd.specialization as doctor_specialization',
                ])
                ->where('a.id', $appointmentId)
                ->whereNull('p.deleted_at')
                ->whereNull('d.deleted_at');

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

        $this->ensureAdminAppointmentProcedures();

        $rows = DB::select(
            'EXEC sp_update_admin_appointment_status @appointment_id = ?, @status = ?',
            [$appointmentId, $normalizedStatus],
        );

        if (! $rows) {
            throw new RuntimeException('Appointment not found.');
        }

        return $rows[0];
    }

    public function getDashboardSummary(int $recentLimit = self::DEFAULT_RECENT_LIMIT): array
    {
        $limit = $recentLimit > 0 ? $recentLimit : self::DEFAULT_RECENT_LIMIT;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $baseAppointments = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->whereNull('p.deleted_at')
                ->whereNull('d.deleted_at');

            $stats = (object) [
                'appointments_today' => (clone $baseAppointments)
                    ->whereDate('a.appointment_date', now()->toDateString())
                    ->count(),
                'upcoming_appointments' => (clone $baseAppointments)
                    ->where('a.appointment_date', '>', now())
                    ->count(),
                'total_appointments' => (clone $baseAppointments)->count(),
                'total_doctors' => DB::table('doctors')
                    ->whereNull('deleted_at')
                    ->count(),
                'total_patients' => DB::table('patients')
                    ->whereNull('deleted_at')
                    ->count(),
            ];

            $hasTypeColumn = Schema::hasColumn('appointments', 'appointment_type');

            $recentQuery = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
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
                    'd.name as doctor_name',
                    'd.department as doctor_department',
                    'd.specialization as doctor_specialization',
                ])
                ->whereNull('p.deleted_at')
                ->whereNull('d.deleted_at')
                ->orderByDesc('a.appointment_date')
                ->limit($limit);

            if ($hasTypeColumn) {
                $recentQuery->addSelect('a.appointment_type');
            } else {
                $recentQuery->selectRaw("'in-person' AS appointment_type");
            }

            return [
                'stats' => $stats,
                'recent_appointments' => $recentQuery->get()->all(),
            ];
        }

        $this->ensureAdminAppointmentProcedures();

        $statsRows = DB::select('EXEC sp_get_admin_dashboard_stats');
        $recentRows = DB::select(
            'EXEC sp_get_admin_recent_appointments @limit = ?',
            [$limit],
        );

        return [
            'stats' => $statsRows[0] ?? (object) [
                'appointments_today' => 0,
                'upcoming_appointments' => 0,
                'total_appointments' => 0,
                'total_doctors' => 0,
                'total_patients' => 0,
            ],
            'recent_appointments' => $recentRows,
        ];
    }

    private function ensureAdminAppointmentProcedures(): void
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
CREATE OR ALTER PROCEDURE sp_get_admin_appointments
    @status NVARCHAR(50) = NULL
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
        p.email AS patient_email,
        d.name AS doctor_name,
        d.department AS doctor_department,
        d.specialization AS doctor_specialization
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    WHERE p.deleted_at IS NULL
      AND d.deleted_at IS NULL
      AND (
            @status IS NULL
            OR LTRIM(RTRIM(@status)) = ''
            OR a.status = @status
      )
    ORDER BY a.appointment_date DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_update_admin_appointment_status
    @appointment_id BIGINT,
    @status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE appointments
    SET status = @status,
        updated_at = GETDATE()
    WHERE id = @appointment_id;

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
        p.email AS patient_email,
        d.name AS doctor_name,
        d.department AS doctor_department,
        d.specialization AS doctor_specialization
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.id = @appointment_id
      AND p.deleted_at IS NULL
      AND d.deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_dashboard_stats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ISNULL(SUM(CASE WHEN CAST(a.appointment_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END), 0) AS appointments_today,
        ISNULL(SUM(CASE WHEN a.appointment_date > GETDATE() THEN 1 ELSE 0 END), 0) AS upcoming_appointments,
        COUNT(*) AS total_appointments,
        (SELECT COUNT(*) FROM doctors WHERE deleted_at IS NULL) AS total_doctors,
        (SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL) AS total_patients
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    WHERE p.deleted_at IS NULL
      AND d.deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_recent_appointments
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
        p.name AS patient_name,
        p.email AS patient_email,
        d.name AS doctor_name,
        d.department AS doctor_department,
        d.specialization AS doctor_specialization
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    WHERE p.deleted_at IS NULL
      AND d.deleted_at IS NULL
    ORDER BY a.appointment_date DESC;
END;
SQL);
    }
}
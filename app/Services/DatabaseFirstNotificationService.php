<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseFirstNotificationService
{
    private const DEFAULT_LIMIT = 8;

    private bool $proceduresChecked = false;

    public function listPatientNotifications(int $patientId, int $limit = self::DEFAULT_LIMIT): array
    {
        $normalizedLimit = $this->normalizeLimit($limit);

        if (DB::connection()->getDriverName() === 'sqlsrv') {
            $this->ensureNotificationProcedures();

            $rows = DB::select(
                'EXEC sp_get_patient_notifications @patient_id = ?, @limit = ?',
                [$patientId, $normalizedLimit],
            );

            return $this->normalizeRows($rows);
        }

        return $this->buildPatientNotificationsFallback($patientId, $normalizedLimit);
    }

    public function listDoctorNotifications(int $doctorId, int $limit = self::DEFAULT_LIMIT): array
    {
        $normalizedLimit = $this->normalizeLimit($limit);

        if (DB::connection()->getDriverName() === 'sqlsrv') {
            $this->ensureNotificationProcedures();

            $rows = DB::select(
                'EXEC sp_get_doctor_notifications @doctor_id = ?, @limit = ?',
                [$doctorId, $normalizedLimit],
            );

            return $this->normalizeRows($rows);
        }

        return $this->buildDoctorNotificationsFallback($doctorId, $normalizedLimit);
    }

    public function listAdminNotifications(int $adminId, int $limit = self::DEFAULT_LIMIT): array
    {
        $normalizedLimit = $this->normalizeLimit($limit);

        if (DB::connection()->getDriverName() === 'sqlsrv') {
            $this->ensureNotificationProcedures();

            $rows = DB::select(
                'EXEC sp_get_admin_notifications @admin_id = ?, @limit = ?',
                [$adminId, $normalizedLimit],
            );

            return $this->normalizeRows($rows);
        }

        return $this->buildAdminNotificationsFallback($normalizedLimit);
    }

    private function buildPatientNotificationsFallback(int $patientId, int $limit): array
    {
        $notifications = [];

        if (Schema::hasTable('appointments') && Schema::hasTable('doctors')) {
            $appointmentRows = DB::table('appointments as a')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.status',
                    'a.appointment_date',
                    'a.created_at',
                    'a.updated_at',
                    'd.name as doctor_name',
                ])
                ->where('a.patient_id', $patientId)
                ->orderByRaw('COALESCE(a.updated_at, a.created_at, a.appointment_date) DESC')
                ->limit($limit)
                ->get();

            foreach ($appointmentRows as $row) {
                $createdAt = $row->updated_at ?? $row->created_at ?? $row->appointment_date;
                $notifications[] = $this->makeNotification(
                    'patient-appointment-'.$row->id,
                    'appointment',
                    'Appointment Update',
                    $this->buildPatientAppointmentMessage($row),
                    $createdAt,
                    '/patient/appointments',
                );
            }
        }

        if (
            Schema::hasTable('room_admissions')
            && Schema::hasTable('hospital_rooms')
            && Schema::hasTable('patients')
        ) {
            $roomRows = DB::table('room_admissions as ra')
                ->join('hospital_rooms as hr', 'hr.id', '=', 'ra.room_id')
                ->join('patients as p', 'p.id', '=', 'ra.patient_id')
                ->leftJoin('doctors as d', 'd.id', '=', 'ra.doctor_id')
                ->select([
                    'ra.id',
                    'ra.status',
                    'ra.created_at',
                    'ra.updated_at',
                    'ra.admitted_at',
                    'ra.discharged_at',
                    'hr.room_number',
                    'd.name as doctor_name',
                ])
                ->where('ra.patient_id', $patientId)
                ->whereNull('p.deleted_at')
                ->orderByRaw('COALESCE(ra.updated_at, ra.created_at, ra.admitted_at) DESC')
                ->limit($limit)
                ->get();

            foreach ($roomRows as $row) {
                $createdAt = $row->updated_at ?? $row->created_at ?? $row->admitted_at ?? $row->discharged_at;
                $notifications[] = $this->makeNotification(
                    'patient-room-'.$row->id,
                    'room_admission',
                    'Room Admission Update',
                    $this->buildPatientRoomMessage($row),
                    $createdAt,
                    '/patient/room-admissions/'.$row->id,
                );
            }
        }

        return $this->sortAndLimit($notifications, $limit);
    }

    private function buildDoctorNotificationsFallback(int $doctorId, int $limit): array
    {
        $notifications = [];

        if (Schema::hasTable('appointments') && Schema::hasTable('patients')) {
            $appointmentRows = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->select([
                    'a.id',
                    'a.status',
                    'a.appointment_date',
                    'a.created_at',
                    'a.updated_at',
                    'p.name as patient_name',
                ])
                ->where('a.doctor_id', $doctorId)
                ->whereNull('p.deleted_at')
                ->orderByRaw('COALESCE(a.updated_at, a.created_at, a.appointment_date) DESC')
                ->limit($limit)
                ->get();

            foreach ($appointmentRows as $row) {
                $createdAt = $row->updated_at ?? $row->created_at ?? $row->appointment_date;
                $notifications[] = $this->makeNotification(
                    'doctor-appointment-'.$row->id,
                    'appointment',
                    'Appointment Update',
                    $this->buildDoctorAppointmentMessage($row),
                    $createdAt,
                    '/doctor/doc-appointments',
                );
            }
        }

        if (
            Schema::hasTable('room_admissions')
            && Schema::hasTable('hospital_rooms')
            && Schema::hasTable('patients')
        ) {
            $roomRows = DB::table('room_admissions as ra')
                ->join('hospital_rooms as hr', 'hr.id', '=', 'ra.room_id')
                ->join('patients as p', 'p.id', '=', 'ra.patient_id')
                ->select([
                    'ra.id',
                    'ra.status',
                    'ra.created_at',
                    'ra.updated_at',
                    'ra.admitted_at',
                    'ra.discharged_at',
                    'hr.room_number',
                    'p.name as patient_name',
                ])
                ->where('ra.doctor_id', $doctorId)
                ->whereNull('p.deleted_at')
                ->orderByRaw('COALESCE(ra.updated_at, ra.created_at, ra.admitted_at) DESC')
                ->limit($limit)
                ->get();

            foreach ($roomRows as $row) {
                $createdAt = $row->updated_at ?? $row->created_at ?? $row->admitted_at ?? $row->discharged_at;
                $notifications[] = $this->makeNotification(
                    'doctor-room-'.$row->id,
                    'room_admission',
                    'Room Admission Update',
                    $this->buildDoctorRoomMessage($row),
                    $createdAt,
                    '/doctor/room-admissions/'.$row->id,
                );
            }
        }

        return $this->sortAndLimit($notifications, $limit);
    }

    private function buildAdminNotificationsFallback(int $limit): array
    {
        $notifications = [];

        if (
            Schema::hasTable('appointments')
            && Schema::hasTable('patients')
            && Schema::hasTable('doctors')
        ) {
            $appointmentRows = DB::table('appointments as a')
                ->join('patients as p', 'p.id', '=', 'a.patient_id')
                ->join('doctors as d', 'd.id', '=', 'a.doctor_id')
                ->select([
                    'a.id',
                    'a.status',
                    'a.appointment_date',
                    'a.created_at',
                    'a.updated_at',
                    'p.name as patient_name',
                    'd.name as doctor_name',
                ])
                ->whereNull('p.deleted_at')
                ->whereNull('d.deleted_at')
                ->orderByRaw('COALESCE(a.updated_at, a.created_at, a.appointment_date) DESC')
                ->limit($limit)
                ->get();

            foreach ($appointmentRows as $row) {
                $createdAt = $row->updated_at ?? $row->created_at ?? $row->appointment_date;
                $notifications[] = $this->makeNotification(
                    'admin-appointment-'.$row->id,
                    'appointment',
                    'Appointment Queue',
                    $this->buildAdminAppointmentMessage($row),
                    $createdAt,
                    '/admin/all-appointments',
                );
            }
        }

        if (
            Schema::hasTable('room_admissions')
            && Schema::hasTable('hospital_rooms')
            && Schema::hasTable('patients')
        ) {
            $roomRows = DB::table('room_admissions as ra')
                ->join('hospital_rooms as hr', 'hr.id', '=', 'ra.room_id')
                ->join('patients as p', 'p.id', '=', 'ra.patient_id')
                ->select([
                    'ra.id',
                    'ra.status',
                    'ra.created_at',
                    'ra.updated_at',
                    'ra.admitted_at',
                    'ra.discharged_at',
                    'hr.room_number',
                    'p.name as patient_name',
                ])
                ->whereNull('p.deleted_at')
                ->orderByRaw('COALESCE(ra.updated_at, ra.created_at, ra.admitted_at) DESC')
                ->limit($limit)
                ->get();

            foreach ($roomRows as $row) {
                $createdAt = $row->updated_at ?? $row->created_at ?? $row->admitted_at ?? $row->discharged_at;
                $notifications[] = $this->makeNotification(
                    'admin-room-'.$row->id,
                    'room_admission',
                    'Room Admission Queue',
                    $this->buildAdminRoomMessage($row),
                    $createdAt,
                    '/admin/room-admissions',
                );
            }
        }

        return $this->sortAndLimit($notifications, $limit);
    }

    private function buildPatientAppointmentMessage(object $row): string
    {
        $doctorName = $row->doctor_name ?: 'the doctor';
        $status = strtolower((string) ($row->status ?? 'pending'));

        return match ($status) {
            'confirmed' => "Your appointment with {$doctorName} is confirmed.",
            'completed' => "Your appointment with {$doctorName} has been completed.",
            'cancelled' => "Your appointment with {$doctorName} was cancelled.",
            default => "Your appointment request with {$doctorName} is pending.",
        };
    }

    private function buildPatientRoomMessage(object $row): string
    {
        $roomNumber = $row->room_number ?: 'your assigned room';
        $status = strtolower((string) ($row->status ?? 'admitted'));

        if ($status === 'discharged' || ! empty($row->discharged_at)) {
            return "You have been discharged from Room {$roomNumber}.";
        }

        $doctorName = $row->doctor_name ? " under {$row->doctor_name}" : '';

        return "You are admitted in Room {$roomNumber}{$doctorName}.";
    }

    private function buildDoctorAppointmentMessage(object $row): string
    {
        $patientName = $row->patient_name ?: 'a patient';
        $status = strtolower((string) ($row->status ?? 'pending'));

        return match ($status) {
            'pending' => "New appointment request from {$patientName}.",
            'confirmed' => "Appointment with {$patientName} is confirmed.",
            'completed' => "Appointment with {$patientName} marked completed.",
            'cancelled' => "Appointment with {$patientName} was cancelled.",
            default => "Appointment update received for {$patientName}.",
        };
    }

    private function buildDoctorRoomMessage(object $row): string
    {
        $patientName = $row->patient_name ?: 'Patient';
        $roomNumber = $row->room_number ?: '-';
        $status = strtolower((string) ($row->status ?? 'admitted'));

        if ($status === 'discharged' || ! empty($row->discharged_at)) {
            return "{$patientName} has been discharged from Room {$roomNumber}.";
        }

        return "{$patientName} has been admitted to Room {$roomNumber}.";
    }

    private function buildAdminAppointmentMessage(object $row): string
    {
        $patientName = $row->patient_name ?: 'Patient';
        $doctorName = $row->doctor_name ?: 'Doctor';
        $status = strtolower((string) ($row->status ?? 'pending'));

        return match ($status) {
            'pending' => "Pending appointment: {$patientName} with {$doctorName}.",
            'confirmed' => "Confirmed appointment: {$patientName} with {$doctorName}.",
            'completed' => "Completed appointment: {$patientName} with {$doctorName}.",
            'cancelled' => "Cancelled appointment: {$patientName} with {$doctorName}.",
            default => "Appointment update: {$patientName} with {$doctorName}.",
        };
    }

    private function buildAdminRoomMessage(object $row): string
    {
        $patientName = $row->patient_name ?: 'Patient';
        $roomNumber = $row->room_number ?: '-';
        $status = strtolower((string) ($row->status ?? 'admitted'));

        if ($status === 'discharged' || ! empty($row->discharged_at)) {
            return "Discharged: {$patientName} from Room {$roomNumber}.";
        }

        return "Active admission: {$patientName} in Room {$roomNumber}.";
    }

    private function normalizeRows(array $rows): array
    {
        return array_map(function (object $row, int $index): object {
            return (object) [
                'notification_key' => (string) ($row->notification_key ?? 'notification-'.$index),
                'notification_type' => (string) ($row->notification_type ?? 'general'),
                'title' => (string) ($row->title ?? 'Notification'),
                'message' => (string) ($row->message ?? ''),
                'created_at' => $row->created_at ?? null,
                'target_path' => (string) ($row->target_path ?? ''),
            ];
        }, $rows, array_keys($rows));
    }

    private function makeNotification(
        string $key,
        string $type,
        string $title,
        string $message,
        mixed $createdAt,
        string $targetPath,
    ): object {
        return (object) [
            'notification_key' => $key,
            'notification_type' => $type,
            'title' => $title,
            'message' => $message,
            'created_at' => $createdAt,
            'target_path' => $targetPath,
        ];
    }

    private function sortAndLimit(array $notifications, int $limit): array
    {
        usort($notifications, function (object $a, object $b): int {
            return $this->toTimestamp($b->created_at ?? null) <=> $this->toTimestamp($a->created_at ?? null);
        });

        return array_slice($notifications, 0, $limit);
    }

    private function toTimestamp(mixed $value): int
    {
        if (! $value) {
            return 0;
        }

        $parsed = strtotime((string) $value);

        return $parsed === false ? 0 : $parsed;
    }

    private function normalizeLimit(int $limit): int
    {
        if ($limit <= 0) {
            return self::DEFAULT_LIMIT;
        }

        return min($limit, 20);
    }

    private function ensureNotificationProcedures(): void
    {
        if ($this->proceduresChecked) {
            return;
        }

        $this->proceduresChecked = true;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_patient_notifications
    @patient_id BIGINT,
    @limit INT = 8
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 8;
    END

    DECLARE @notifications TABLE (
        notification_key NVARCHAR(120),
        notification_type NVARCHAR(30),
        title NVARCHAR(100),
        message NVARCHAR(500),
        created_at DATETIME,
        target_path NVARCHAR(255)
    );

    IF OBJECT_ID('appointments', 'U') IS NOT NULL
       AND OBJECT_ID('doctors', 'U') IS NOT NULL
    BEGIN
        INSERT INTO @notifications (notification_key, notification_type, title, message, created_at, target_path)
        SELECT
            CONCAT('patient-appointment-', CAST(a.id AS NVARCHAR(50))),
            'appointment',
            'Appointment Update',
            CASE LOWER(ISNULL(a.status, 'pending'))
                WHEN 'confirmed' THEN CONCAT('Your appointment with ', ISNULL(d.name, 'the doctor'), ' is confirmed.')
                WHEN 'completed' THEN CONCAT('Your appointment with ', ISNULL(d.name, 'the doctor'), ' has been completed.')
                WHEN 'cancelled' THEN CONCAT('Your appointment with ', ISNULL(d.name, 'the doctor'), ' was cancelled.')
                ELSE CONCAT('Your appointment request with ', ISNULL(d.name, 'the doctor'), ' is pending.')
            END,
            ISNULL(a.updated_at, ISNULL(a.created_at, a.appointment_date)),
            '/patient/appointments'
        FROM appointments a
        JOIN doctors d ON d.id = a.doctor_id
        WHERE a.patient_id = @patient_id;
    END

    IF OBJECT_ID('room_admissions', 'U') IS NOT NULL
       AND OBJECT_ID('hospital_rooms', 'U') IS NOT NULL
       AND OBJECT_ID('patients', 'U') IS NOT NULL
    BEGIN
        INSERT INTO @notifications (notification_key, notification_type, title, message, created_at, target_path)
        SELECT
            CONCAT('patient-room-', CAST(ra.id AS NVARCHAR(50))),
            'room_admission',
            'Room Admission Update',
            CASE
                WHEN LOWER(ISNULL(ra.status, 'admitted')) = 'discharged' OR ra.discharged_at IS NOT NULL
                    THEN CONCAT('You have been discharged from Room ', ISNULL(hr.room_number, '-'), '.')
                WHEN d.name IS NULL OR LTRIM(RTRIM(d.name)) = ''
                    THEN CONCAT('You are admitted in Room ', ISNULL(hr.room_number, '-'), '.')
                ELSE CONCAT('You are admitted in Room ', ISNULL(hr.room_number, '-'), ' under ', d.name, '.')
            END,
            ISNULL(ra.updated_at, ISNULL(ra.created_at, ISNULL(ra.admitted_at, ra.discharged_at))),
            CONCAT('/patient/room-admissions/', CAST(ra.id AS NVARCHAR(50)))
        FROM room_admissions ra
        JOIN hospital_rooms hr ON hr.id = ra.room_id
        JOIN patients p ON p.id = ra.patient_id
        LEFT JOIN doctors d ON d.id = ra.doctor_id
        WHERE ra.patient_id = @patient_id
          AND p.deleted_at IS NULL;
    END

    SELECT TOP (@limit)
        notification_key,
        notification_type,
        title,
        message,
        created_at,
        target_path
    FROM @notifications
    ORDER BY created_at DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_doctor_notifications
    @doctor_id BIGINT,
    @limit INT = 8
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 8;
    END

    DECLARE @notifications TABLE (
        notification_key NVARCHAR(120),
        notification_type NVARCHAR(30),
        title NVARCHAR(100),
        message NVARCHAR(500),
        created_at DATETIME,
        target_path NVARCHAR(255)
    );

    IF OBJECT_ID('appointments', 'U') IS NOT NULL
       AND OBJECT_ID('patients', 'U') IS NOT NULL
    BEGIN
        INSERT INTO @notifications (notification_key, notification_type, title, message, created_at, target_path)
        SELECT
            CONCAT('doctor-appointment-', CAST(a.id AS NVARCHAR(50))),
            'appointment',
            'Appointment Update',
            CASE LOWER(ISNULL(a.status, 'pending'))
                WHEN 'pending' THEN CONCAT('New appointment request from ', ISNULL(p.name, 'a patient'), '.')
                WHEN 'confirmed' THEN CONCAT('Appointment with ', ISNULL(p.name, 'a patient'), ' is confirmed.')
                WHEN 'completed' THEN CONCAT('Appointment with ', ISNULL(p.name, 'a patient'), ' marked completed.')
                WHEN 'cancelled' THEN CONCAT('Appointment with ', ISNULL(p.name, 'a patient'), ' was cancelled.')
                ELSE CONCAT('Appointment update received for ', ISNULL(p.name, 'a patient'), '.')
            END,
            ISNULL(a.updated_at, ISNULL(a.created_at, a.appointment_date)),
            '/doctor/doc-appointments'
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        WHERE a.doctor_id = @doctor_id
          AND p.deleted_at IS NULL;
    END

    IF OBJECT_ID('room_admissions', 'U') IS NOT NULL
       AND OBJECT_ID('hospital_rooms', 'U') IS NOT NULL
       AND OBJECT_ID('patients', 'U') IS NOT NULL
    BEGIN
        INSERT INTO @notifications (notification_key, notification_type, title, message, created_at, target_path)
        SELECT
            CONCAT('doctor-room-', CAST(ra.id AS NVARCHAR(50))),
            'room_admission',
            'Room Admission Update',
            CASE
                WHEN LOWER(ISNULL(ra.status, 'admitted')) = 'discharged' OR ra.discharged_at IS NOT NULL
                    THEN CONCAT(ISNULL(p.name, 'Patient'), ' has been discharged from Room ', ISNULL(hr.room_number, '-'), '.')
                ELSE CONCAT(ISNULL(p.name, 'Patient'), ' has been admitted to Room ', ISNULL(hr.room_number, '-'), '.')
            END,
            ISNULL(ra.updated_at, ISNULL(ra.created_at, ISNULL(ra.admitted_at, ra.discharged_at))),
            CONCAT('/doctor/room-admissions/', CAST(ra.id AS NVARCHAR(50)))
        FROM room_admissions ra
        JOIN hospital_rooms hr ON hr.id = ra.room_id
        JOIN patients p ON p.id = ra.patient_id
        WHERE ra.doctor_id = @doctor_id
          AND p.deleted_at IS NULL;
    END

    SELECT TOP (@limit)
        notification_key,
        notification_type,
        title,
        message,
        created_at,
        target_path
    FROM @notifications
    ORDER BY created_at DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_notifications
    @admin_id BIGINT,
    @limit INT = 8
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 8;
    END

    DECLARE @notifications TABLE (
        notification_key NVARCHAR(120),
        notification_type NVARCHAR(30),
        title NVARCHAR(100),
        message NVARCHAR(500),
        created_at DATETIME,
        target_path NVARCHAR(255)
    );

    IF OBJECT_ID('appointments', 'U') IS NOT NULL
       AND OBJECT_ID('patients', 'U') IS NOT NULL
       AND OBJECT_ID('doctors', 'U') IS NOT NULL
    BEGIN
        INSERT INTO @notifications (notification_key, notification_type, title, message, created_at, target_path)
        SELECT
            CONCAT('admin-appointment-', CAST(a.id AS NVARCHAR(50))),
            'appointment',
            'Appointment Queue',
            CASE LOWER(ISNULL(a.status, 'pending'))
                WHEN 'pending' THEN CONCAT('Pending appointment: ', ISNULL(p.name, 'Patient'), ' with ', ISNULL(d.name, 'Doctor'), '.')
                WHEN 'confirmed' THEN CONCAT('Confirmed appointment: ', ISNULL(p.name, 'Patient'), ' with ', ISNULL(d.name, 'Doctor'), '.')
                WHEN 'completed' THEN CONCAT('Completed appointment: ', ISNULL(p.name, 'Patient'), ' with ', ISNULL(d.name, 'Doctor'), '.')
                WHEN 'cancelled' THEN CONCAT('Cancelled appointment: ', ISNULL(p.name, 'Patient'), ' with ', ISNULL(d.name, 'Doctor'), '.')
                ELSE CONCAT('Appointment update: ', ISNULL(p.name, 'Patient'), ' with ', ISNULL(d.name, 'Doctor'), '.')
            END,
            ISNULL(a.updated_at, ISNULL(a.created_at, a.appointment_date)),
            '/admin/all-appointments'
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        JOIN doctors d ON d.id = a.doctor_id
        WHERE p.deleted_at IS NULL
          AND d.deleted_at IS NULL;
    END

    IF OBJECT_ID('room_admissions', 'U') IS NOT NULL
       AND OBJECT_ID('hospital_rooms', 'U') IS NOT NULL
       AND OBJECT_ID('patients', 'U') IS NOT NULL
    BEGIN
        INSERT INTO @notifications (notification_key, notification_type, title, message, created_at, target_path)
        SELECT
            CONCAT('admin-room-', CAST(ra.id AS NVARCHAR(50))),
            'room_admission',
            'Room Admission Queue',
            CASE
                WHEN LOWER(ISNULL(ra.status, 'admitted')) = 'discharged' OR ra.discharged_at IS NOT NULL
                    THEN CONCAT('Discharged: ', ISNULL(p.name, 'Patient'), ' from Room ', ISNULL(hr.room_number, '-'), '.')
                ELSE CONCAT('Active admission: ', ISNULL(p.name, 'Patient'), ' in Room ', ISNULL(hr.room_number, '-'), '.')
            END,
            ISNULL(ra.updated_at, ISNULL(ra.created_at, ISNULL(ra.admitted_at, ra.discharged_at))),
            '/admin/room-admissions'
        FROM room_admissions ra
        JOIN hospital_rooms hr ON hr.id = ra.room_id
        JOIN patients p ON p.id = ra.patient_id
        WHERE p.deleted_at IS NULL;
    END

    SELECT TOP (@limit)
        notification_key,
        notification_type,
        title,
        message,
        created_at,
        target_path
    FROM @notifications
    ORDER BY created_at DESC;
END;
SQL);
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class DatabaseFirstPatientAppointmentService
{
    private bool $proceduresChecked = false;

    public function listDoctorsForBooking(?string $search = null, ?string $department = null): array
    {
        $normalizedSearch = trim((string) $search);
        $normalizedDepartment = trim((string) $department);

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $query = DB::table('doctors')
                ->select(['id', 'name', 'department', 'specialization', 'photo_path'])
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
    WHERE deleted_at IS NULL
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
    }
}

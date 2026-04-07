<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use RuntimeException;

class DatabaseFirstAdminRoomAdmissionService
{
    private const ALLOWED_STATUSES = ['admitted', 'discharged'];
    private const DEFAULT_RECENT_LIMIT = 5;

    private bool $infrastructureChecked = false;
    private bool $proceduresChecked = false;

    public function listAdmissions(?string $status = null): array
    {
        $normalizedStatus = strtolower(trim((string) $status));

        if ($normalizedStatus !== '' && ! in_array($normalizedStatus, self::ALLOWED_STATUSES, true)) {
            throw new RuntimeException('Invalid room admission status filter.');
        }

        $this->ensureRoomInfrastructure();

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $query = DB::table('room_admissions as ra')
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
                ->whereNull('p.deleted_at')
                ->orderByRaw("CASE WHEN ra.status = 'admitted' THEN 0 ELSE 1 END")
                ->orderByDesc('ra.admitted_at');

            if ($normalizedStatus !== '') {
                $query->where('ra.status', $normalizedStatus);
            }

            return $query->get()->all();
        }

        $this->ensureRoomProcedures();

        return DB::select(
            'EXEC sp_get_admin_room_admissions @status = ?',
            [$normalizedStatus !== '' ? $normalizedStatus : null],
        );
    }

    public function getLookupData(): array
    {
        $this->ensureRoomInfrastructure();

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $patients = DB::table('patients')
                ->select(['id', 'name', 'email'])
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get()
                ->all();

            $doctors = DB::table('doctors')
                ->select(['id', 'name', 'department', 'specialization'])
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get()
                ->all();

            $availableRooms = DB::table('hospital_rooms as hr')
                ->select([
                    'hr.id',
                    'hr.room_number',
                    'hr.room_type',
                    'hr.floor_number',
                    'hr.status',
                ])
                ->where('hr.status', 'available')
                ->whereNotExists(function ($query): void {
                    $query->select(DB::raw(1))
                        ->from('room_admissions as ra')
                        ->whereColumn('ra.room_id', 'hr.id')
                        ->where('ra.status', 'admitted')
                        ->whereNull('ra.discharged_at');
                })
                ->orderBy('hr.floor_number')
                ->orderBy('hr.room_number')
                ->get()
                ->all();

            return [
                'patients' => $patients,
                'doctors' => $doctors,
                'available_rooms' => $availableRooms,
            ];
        }

        $this->ensureRoomProcedures();

        return [
            'patients' => DB::select('EXEC sp_get_admin_room_lookup_patients'),
            'doctors' => DB::select('EXEC sp_get_admin_room_lookup_doctors'),
            'available_rooms' => DB::select('EXEC sp_get_admin_available_rooms'),
        ];
    }

    public function createAdmission(
        int $patientId,
        int $roomId,
        ?int $doctorId = null,
        ?string $admissionReason = null,
        ?string $admissionNotes = null,
        ?string $admittedAt = null,
        ?string $expectedDischargeAt = null,
    ): object {
        $this->ensureRoomInfrastructure();

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return DB::transaction(function () use (
                $patientId,
                $roomId,
                $doctorId,
                $admissionReason,
                $admissionNotes,
                $admittedAt,
                $expectedDischargeAt,
            ): object {
                $patientExists = DB::table('patients')
                    ->where('id', $patientId)
                    ->whereNull('deleted_at')
                    ->exists();

                if (! $patientExists) {
                    throw new RuntimeException('Patient account not found.');
                }

                if ($doctorId !== null) {
                    $doctorExists = DB::table('doctors')
                        ->where('id', $doctorId)
                        ->whereNull('deleted_at')
                        ->exists();

                    if (! $doctorExists) {
                        throw new RuntimeException('Selected doctor was not found.');
                    }
                }

                $room = DB::table('hospital_rooms')
                    ->select(['id', 'status'])
                    ->where('id', $roomId)
                    ->first();

                if (! $room) {
                    throw new RuntimeException('Selected room was not found.');
                }

                if (strtolower((string) ($room->status ?? '')) !== 'available') {
                    throw new RuntimeException('Selected room is not available for admission.');
                }

                $hasActiveAdmission = DB::table('room_admissions')
                    ->where('patient_id', $patientId)
                    ->where('status', 'admitted')
                    ->whereNull('discharged_at')
                    ->exists();

                if ($hasActiveAdmission) {
                    throw new RuntimeException('This patient already has an active room admission.');
                }

                $roomOccupied = DB::table('room_admissions')
                    ->where('room_id', $roomId)
                    ->where('status', 'admitted')
                    ->whereNull('discharged_at')
                    ->exists();

                if ($roomOccupied) {
                    throw new RuntimeException('This room is currently occupied.');
                }

                $id = DB::table('room_admissions')->insertGetId([
                    'room_id' => $roomId,
                    'patient_id' => $patientId,
                    'doctor_id' => $doctorId,
                    'status' => 'admitted',
                    'admission_reason' => $admissionReason,
                    'admission_notes' => $admissionNotes,
                    'admitted_at' => $admittedAt ?: now(),
                    'expected_discharge_at' => $expectedDischargeAt,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return $this->getAdmissionById($id);
            });
        }

        $this->ensureRoomProcedures();

        $rows = DB::select(
            'EXEC sp_create_room_admission @patient_id = ?, @room_id = ?, @doctor_id = ?, @admission_reason = ?, @admission_notes = ?, @admitted_at = ?, @expected_discharge_at = ?',
            [
                $patientId,
                $roomId,
                $doctorId,
                $admissionReason,
                $admissionNotes,
                $admittedAt,
                $expectedDischargeAt,
            ],
        );

        if (! $rows) {
            throw new RuntimeException('Room admission could not be created.');
        }

        return $rows[0];
    }

    public function dischargeAdmission(int $admissionId, ?string $dischargeNotes = null): object
    {
        $this->ensureRoomInfrastructure();

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $row = DB::table('room_admissions')
                ->select(['id', 'status'])
                ->where('id', $admissionId)
                ->first();

            if (! $row) {
                throw new RuntimeException('Room admission not found.');
            }

            if (strtolower((string) ($row->status ?? '')) !== 'admitted') {
                throw new RuntimeException('Only admitted records can be discharged.');
            }

            DB::table('room_admissions')
                ->where('id', $admissionId)
                ->update([
                    'status' => 'discharged',
                    'discharged_at' => now(),
                    'discharge_notes' => $dischargeNotes,
                    'updated_at' => now(),
                ]);

            return $this->getAdmissionById($admissionId);
        }

        $this->ensureRoomProcedures();

        $rows = DB::select(
            'EXEC sp_discharge_room_admission @admission_id = ?, @discharge_notes = ?',
            [$admissionId, $dischargeNotes],
        );

        if (! $rows) {
            throw new RuntimeException('Room admission not found.');
        }

        return $rows[0];
    }

    public function getDashboardSummary(int $recentLimit = self::DEFAULT_RECENT_LIMIT): array
    {
        $limit = $recentLimit > 0 ? $recentLimit : self::DEFAULT_RECENT_LIMIT;

        $this->ensureRoomInfrastructure();

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            $totalRooms = DB::table('hospital_rooms')
                ->whereIn('status', ['available', 'maintenance'])
                ->count();

            $occupiedRooms = DB::table('room_admissions')
                ->where('status', 'admitted')
                ->whereNull('discharged_at')
                ->distinct()
                ->count('room_id');

            $activeAdmissions = DB::table('room_admissions')
                ->where('status', 'admitted')
                ->whereNull('discharged_at')
                ->count();

            $dischargedAdmissions = DB::table('room_admissions')
                ->where('status', 'discharged')
                ->count();

            $totalAdmissions = DB::table('room_admissions')->count();

            $recentAdmissions = DB::table('room_admissions as ra')
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
                ->whereNull('p.deleted_at')
                ->orderByDesc('ra.admitted_at')
                ->limit($limit)
                ->get()
                ->all();

            return [
                'stats' => (object) [
                    'total_rooms' => $totalRooms,
                    'occupied_rooms' => $occupiedRooms,
                    'available_rooms' => max($totalRooms - $occupiedRooms, 0),
                    'active_admissions' => $activeAdmissions,
                    'discharged_admissions' => $dischargedAdmissions,
                    'total_admissions' => $totalAdmissions,
                ],
                'recent_admissions' => $recentAdmissions,
            ];
        }

        $this->ensureRoomProcedures();

        $statsRows = DB::select('EXEC sp_get_admin_room_dashboard_stats');
        $recentRows = DB::select(
            'EXEC sp_get_admin_recent_room_admissions @limit = ?',
            [$limit],
        );

        return [
            'stats' => $statsRows[0] ?? (object) [
                'total_rooms' => 0,
                'occupied_rooms' => 0,
                'available_rooms' => 0,
                'active_admissions' => 0,
                'discharged_admissions' => 0,
                'total_admissions' => 0,
            ],
            'recent_admissions' => $recentRows,
        ];
    }

    private function getAdmissionById(int $admissionId): object
    {
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
            ->whereNull('p.deleted_at')
            ->first();

        if (! $row) {
            throw new RuntimeException('Room admission not found.');
        }

        return $row;
    }

    private function ensureRoomInfrastructure(): void
    {
        if ($this->infrastructureChecked) {
            return;
        }

        $this->infrastructureChecked = true;

        if (! Schema::hasTable('hospital_rooms')) {
            Schema::create('hospital_rooms', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->string('room_number', 50)->unique();
                $table->string('room_type', 100)->default('General');
                $table->unsignedInteger('floor_number')->default(1);
                $table->string('status', 30)->default('available');
                $table->dateTime('created_at')->nullable();
                $table->dateTime('updated_at')->nullable();
            });
        }

        if (! Schema::hasTable('room_admissions')) {
            Schema::create('room_admissions', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('room_id');
                $table->unsignedBigInteger('patient_id');
                $table->unsignedBigInteger('doctor_id')->nullable();
                $table->string('status', 30)->default('admitted');
                $table->string('admission_reason', 500)->nullable();
                $table->text('admission_notes')->nullable();
                $table->text('discharge_notes')->nullable();
                $table->dateTime('admitted_at');
                $table->dateTime('expected_discharge_at')->nullable();
                $table->dateTime('discharged_at')->nullable();
                $table->dateTime('created_at')->nullable();
                $table->dateTime('updated_at')->nullable();

                $table->index(['status']);
                $table->index(['room_id']);
                $table->index(['patient_id']);

                $table->foreign('room_id')->references('id')->on('hospital_rooms');
                $table->foreign('patient_id')->references('id')->on('patients');
                $table->foreign('doctor_id')->references('id')->on('doctors');
            });
        }

        if (DB::table('hospital_rooms')->count() === 0) {
            $now = now();
            $rooms = [];

            for ($floor = 1; $floor <= 3; $floor++) {
                for ($unit = 1; $unit <= 8; $unit++) {
                    $roomType = 'General';

                    if ($floor === 3) {
                        $roomType = 'ICU';
                    } elseif ($unit <= 2) {
                        $roomType = 'Emergency';
                    }

                    $rooms[] = [
                        'room_number' => sprintf('%d%02d', $floor, $unit),
                        'room_type' => $roomType,
                        'floor_number' => $floor,
                        'status' => 'available',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            DB::table('hospital_rooms')->insert($rooms);
        }
    }

    private function ensureRoomProcedures(): void
    {
        if ($this->proceduresChecked) {
            return;
        }

        $this->proceduresChecked = true;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_room_admissions
    @status NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
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
    WHERE p.deleted_at IS NULL
      AND (
            @status IS NULL
            OR LTRIM(RTRIM(@status)) = ''
            OR ra.status = @status
      )
    ORDER BY
        CASE WHEN ra.status = 'admitted' THEN 0 ELSE 1 END,
        ra.admitted_at DESC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_room_lookup_patients
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id,
        name,
        email
    FROM patients
    WHERE deleted_at IS NULL
    ORDER BY name ASC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_room_lookup_doctors
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id,
        name,
        department,
        specialization
    FROM doctors
    WHERE deleted_at IS NULL
    ORDER BY name ASC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_available_rooms
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hr.id,
        hr.room_number,
        hr.room_type,
        hr.floor_number,
        hr.status
    FROM hospital_rooms hr
    WHERE hr.status = 'available'
      AND NOT EXISTS (
            SELECT 1
            FROM room_admissions ra
            WHERE ra.room_id = hr.id
              AND ra.status = 'admitted'
              AND ra.discharged_at IS NULL
      )
    ORDER BY hr.floor_number ASC, hr.room_number ASC;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_create_room_admission
    @patient_id BIGINT,
    @room_id BIGINT,
    @doctor_id BIGINT = NULL,
    @admission_reason NVARCHAR(500) = NULL,
    @admission_notes NVARCHAR(MAX) = NULL,
    @admitted_at DATETIME = NULL,
    @expected_discharge_at DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM patients
        WHERE id = @patient_id
          AND deleted_at IS NULL
    )
    BEGIN
        RAISERROR('Patient account not found.', 16, 1);
        RETURN;
    END

    IF @doctor_id IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM doctors
            WHERE id = @doctor_id
              AND deleted_at IS NULL
       )
    BEGIN
        RAISERROR('Selected doctor was not found.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM hospital_rooms
        WHERE id = @room_id
          AND status = 'available'
    )
    BEGIN
        RAISERROR('Selected room is not available for admission.', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM room_admissions
        WHERE patient_id = @patient_id
          AND status = 'admitted'
          AND discharged_at IS NULL
    )
    BEGIN
        RAISERROR('This patient already has an active room admission.', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM room_admissions
        WHERE room_id = @room_id
          AND status = 'admitted'
          AND discharged_at IS NULL
    )
    BEGIN
        RAISERROR('This room is currently occupied.', 16, 1);
        RETURN;
    END

    IF @admitted_at IS NULL
    BEGIN
        SET @admitted_at = GETDATE();
    END

    INSERT INTO room_admissions (
        room_id,
        patient_id,
        doctor_id,
        status,
        admission_reason,
        admission_notes,
        admitted_at,
        expected_discharge_at,
        created_at,
        updated_at
    )
    VALUES (
        @room_id,
        @patient_id,
        @doctor_id,
        'admitted',
        @admission_reason,
        @admission_notes,
        @admitted_at,
        @expected_discharge_at,
        GETDATE(),
        GETDATE()
    );

    DECLARE @admission_id BIGINT = SCOPE_IDENTITY();

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
      AND p.deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_discharge_room_admission
    @admission_id BIGINT,
    @discharge_notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM room_admissions
        WHERE id = @admission_id
    )
    BEGIN
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM room_admissions
        WHERE id = @admission_id
          AND status <> 'admitted'
    )
    BEGIN
        RAISERROR('Only admitted records can be discharged.', 16, 1);
        RETURN;
    END

    UPDATE room_admissions
    SET status = 'discharged',
        discharged_at = GETDATE(),
        discharge_notes = @discharge_notes,
        updated_at = GETDATE()
    WHERE id = @admission_id;

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
      AND p.deleted_at IS NULL;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_room_dashboard_stats
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_rooms INT = (
        SELECT COUNT(*)
        FROM hospital_rooms
        WHERE status IN ('available', 'maintenance')
    );

    DECLARE @occupied_rooms INT = (
        SELECT COUNT(DISTINCT room_id)
        FROM room_admissions
        WHERE status = 'admitted'
          AND discharged_at IS NULL
    );

    IF @occupied_rooms IS NULL
    BEGIN
        SET @occupied_rooms = 0;
    END

    SELECT
        @total_rooms AS total_rooms,
        @occupied_rooms AS occupied_rooms,
        CASE WHEN @total_rooms - @occupied_rooms < 0 THEN 0 ELSE @total_rooms - @occupied_rooms END AS available_rooms,
        (SELECT COUNT(*) FROM room_admissions WHERE status = 'admitted' AND discharged_at IS NULL) AS active_admissions,
        (SELECT COUNT(*) FROM room_admissions WHERE status = 'discharged') AS discharged_admissions,
        (SELECT COUNT(*) FROM room_admissions) AS total_admissions;
END;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_get_admin_recent_room_admissions
    @limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    IF @limit IS NULL OR @limit < 1
    BEGIN
        SET @limit = 5;
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
        p.email AS patient_email,
        d.name AS doctor_name,
        d.department AS doctor_department
    FROM room_admissions ra
    JOIN hospital_rooms hr ON hr.id = ra.room_id
    JOIN patients p ON p.id = ra.patient_id
    LEFT JOIN doctors d ON d.id = ra.doctor_id
    WHERE p.deleted_at IS NULL
    ORDER BY ra.admitted_at DESC;
END;
SQL);
    }
}

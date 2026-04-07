<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DatabaseFirstAdminManagementService
{
    private bool $proceduresChecked = false;

    public function createAdmin(
        int $actingAdminId,
        string $name,
        string $email,
        string $plainPassword,
        ?string $phone,
        string $adminRole,
    ): object {
        $actingRole = $this->resolveAdminRole($actingAdminId);

        if ($actingRole !== 'super') {
            throw new RuntimeException('Only super admins can create admin accounts.');
        }

        $normalizedAdminRole = $this->normalizeAdminRole($adminRole);

        if ($normalizedAdminRole === 'unknown') {
            throw new RuntimeException('Invalid admin role. Allowed: super, manager, hr.');
        }

        $normalizedEmail = strtolower(trim($email));
        $hashedPassword = Hash::make($plainPassword);

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
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
                throw new RuntimeException('The email has already been taken.');
            }

            $id = DB::table('admins')->insertGetId([
                'name' => $name,
                'email' => $normalizedEmail,
                'password' => $hashedPassword,
                'phone' => $phone,
                'role' => 'admin',
                'admin_role' => $normalizedAdminRole,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $row = DB::table('admins')
                ->select([
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'admin_role',
                    'created_at',
                    'updated_at',
                ])
                ->where('id', $id)
                ->first();

            if (! $row) {
                throw new RuntimeException('Admin could not be created.');
            }

            return $row;
        }

        $this->ensureAdminProcedures();

        $rows = DB::select(
            'EXEC sp_create_admin @acting_admin_id = ?, @name = ?, @email = ?, @password = ?, @phone = ?, @admin_role = ?',
            [
                $actingAdminId,
                $name,
                $normalizedEmail,
                $hashedPassword,
                $phone,
                $normalizedAdminRole,
            ],
        );

        if (! $rows) {
            throw new RuntimeException('Admin could not be created.');
        }

        return $rows[0];
    }

    private function resolveAdminRole(int $adminId): string
    {
        $row = DB::table('admins')
            ->select('admin_role')
            ->where('id', $adminId)
            ->whereNull('deleted_at')
            ->first();

        if (! $row) {
            throw new RuntimeException('Acting admin account was not found.');
        }

        return $this->normalizeAdminRole((string) ($row->admin_role ?? ''));
    }

    private function normalizeAdminRole(string $adminRole): string
    {
        $role = strtolower(trim($adminRole));

        return match ($role) {
            'super', 'super admin', 'super-admin', 'super_admin' => 'super',
            'manager' => 'manager',
            'hr' => 'hr',
            default => 'unknown',
        };
    }

    private function ensureAdminProcedures(): void
    {
        if ($this->proceduresChecked) {
            return;
        }

        $this->proceduresChecked = true;

        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE OR ALTER PROCEDURE sp_create_admin
    @acting_admin_id BIGINT,
    @name NVARCHAR(255),
    @email NVARCHAR(255),
    @password NVARCHAR(255),
    @phone NVARCHAR(50) = NULL,
    @admin_role NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @acting_admin_role NVARCHAR(100);

    SELECT TOP 1 @acting_admin_role = LOWER(LTRIM(RTRIM(ISNULL(admin_role, ''))))
    FROM admins
    WHERE id = @acting_admin_id
      AND deleted_at IS NULL;

    IF @acting_admin_role NOT IN ('super', 'super admin', 'super-admin', 'super_admin')
    BEGIN
        RETURN;
    END

    INSERT INTO admins (
        name,
        email,
        password,
        phone,
        role,
        admin_role,
        created_at,
        updated_at
    )
    VALUES (
        @name,
        @email,
        @password,
        @phone,
        'admin',
        @admin_role,
        GETDATE(),
        GETDATE()
    );

    DECLARE @admin_id BIGINT = SCOPE_IDENTITY();

    SELECT TOP 1
        id,
        name,
        email,
        phone,
        role,
        admin_role,
        created_at,
        updated_at
    FROM admins
    WHERE id = @admin_id;
END;
SQL);
    }
}

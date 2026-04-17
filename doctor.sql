--------------------------------------------------
-- DOCTOR-RELATED QUERIES EXTRACTED FROM schema.sql
-- NOTE: The SQL blocks below are copied from existing schema objects.
--------------------------------------------------

CREATE PROCEDURE sp_get_doctor_by_email
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 *
	FROM doctors
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

CREATE PROCEDURE sp_get_doctors
AS
BEGIN
	SELECT id, name, specialization, department
	FROM doctors
	WHERE deleted_at IS NULL;
END;
GO

CREATE PROCEDURE sp_get_doctors_for_booking
	@search NVARCHAR(255) = NULL,
	@department NVARCHAR(255) = NULL
AS
BEGIN
	SELECT
		id,
		name,
		department,
		specialization,
		photo_path,
		available_days
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
GO

CREATE PROCEDURE sp_create_doctor
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
GO

CREATE PROCEDURE sp_search_doctors
	@keyword NVARCHAR(255)
AS
BEGIN
	SELECT *
	FROM doctors
	WHERE name LIKE '%' + @keyword + '%'
	   OR specialization LIKE '%' + @keyword + '%'
	   OR department LIKE '%' + @keyword + '%';
END;
GO

CREATE PROCEDURE sp_update_doctor
	@id BIGINT,
	@name NVARCHAR(255)
AS
BEGIN
	UPDATE doctors
	SET name = @name,
		updated_at = GETDATE()
	WHERE id = @id;
END;
GO

CREATE PROCEDURE sp_get_doctor_appointments
	@doctor_id BIGINT,
	@status NVARCHAR(50) = NULL,
	@scope NVARCHAR(20) = 'all'
AS
BEGIN
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
GO

CREATE PROCEDURE sp_update_doctor_appointment_status
	@doctor_id BIGINT,
	@appointment_id BIGINT,
	@status NVARCHAR(50)
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_doctor_notifications
	@doctor_id BIGINT,
	@limit INT = 8
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_doctor_room_admission_stats
	@doctor_id BIGINT
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_doctor_room_admissions
	@doctor_id BIGINT,
	@limit INT = 5
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_doctor_room_admission_details
	@doctor_id BIGINT,
	@admission_id BIGINT
AS
BEGIN
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
GO

CREATE VIEW vw_room_admission_analytics -- VIEW
AS
SELECT
	hr.id AS room_id,
	hr.room_number,
	hr.room_type,
	hr.floor_number,
	COUNT(ra.id) AS total_admissions, -- COUNT
	SUM(CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN 1 ELSE 0 END) AS active_admissions, -- SUM
	AVG(CASE WHEN ra.admitted_at IS NOT NULL THEN DATEDIFF(HOUR, ra.admitted_at, ISNULL(ra.discharged_at, GETDATE())) * 1.0 END) AS avg_stay_hours, -- AVG
	MIN(ra.admitted_at) AS first_admission_at, -- MIN + FIRST equivalent in SQL Server
	MAX(ISNULL(ra.discharged_at, ra.admitted_at)) AS last_admission_at -- MAX + LAST equivalent in SQL Server
FROM hospital_rooms hr
LEFT JOIN room_admissions ra ON ra.room_id = hr.id -- LEFT JOIN
GROUP BY
	hr.id,
	hr.room_number,
	hr.room_type,
	hr.floor_number -- GROUP BY
HAVING COUNT(ra.id) >= 0; -- HAVING
GO

CREATE TRIGGER trg_sync_room_status_from_admissions -- TRIGGER
ON room_admissions
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @affected_rooms TABLE (room_id BIGINT PRIMARY KEY);

	INSERT INTO @affected_rooms (room_id)
	SELECT DISTINCT room_id FROM inserted WHERE room_id IS NOT NULL
	UNION
	SELECT DISTINCT room_id FROM deleted WHERE room_id IS NOT NULL;

	UPDATE hr
	SET
		hr.status = CASE
			WHEN EXISTS (
				SELECT 1
				FROM room_admissions ra
				WHERE ra.room_id = hr.id
				  AND ra.status = 'admitted'
				  AND ra.discharged_at IS NULL
			) THEN 'occupied'
			WHEN hr.status = 'maintenance' THEN 'maintenance'
			ELSE 'available'
		END,
		hr.updated_at = GETDATE()
	FROM hospital_rooms hr
	JOIN @affected_rooms ar ON ar.room_id = hr.id;
END;
GO

CREATE PROCEDURE sp_transfer_room_admission -- PROCEDURE
	@admission_id BIGINT,
	@to_room_id BIGINT
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @from_room_id BIGINT;

	BEGIN TRY
		BEGIN TRANSACTION; -- TRANSACTION START

		SELECT TOP 1 @from_room_id = room_id
		FROM room_admissions
		WHERE id = @admission_id
		  AND status = 'admitted'
		  AND discharged_at IS NULL;

		IF @from_room_id IS NULL
		BEGIN
			RAISERROR('Active room admission not found.', 16, 1);
		END

		IF NOT EXISTS (SELECT 1 FROM hospital_rooms WHERE id = @to_room_id)
		BEGIN
			RAISERROR('Target room was not found.', 16, 1);
		END

		IF EXISTS (
			SELECT 1
			FROM room_admissions
			WHERE room_id = @to_room_id
			  AND status = 'admitted'
			  AND discharged_at IS NULL
		)
		BEGIN
			RAISERROR('Target room is already occupied.', 16, 1);
		END

		UPDATE room_admissions
		SET room_id = @to_room_id,
			updated_at = GETDATE()
		WHERE id = @admission_id;

		-- Trigger keeps room statuses synchronized after this update.

		COMMIT TRANSACTION; -- TRANSACTION COMMIT
	END TRY
	BEGIN CATCH
		IF @@TRANCOUNT > 0
		BEGIN
			ROLLBACK TRANSACTION; -- TRANSACTION ROLLBACK
		END

		THROW;
	END CATCH

	SELECT TOP 1
		ra.id,
		ra.room_id,
		ra.patient_id,
		ra.doctor_id,
		ra.status,
		ra.admitted_at,
		ra.expected_discharge_at,
		ra.discharged_at,
		hr.room_number,
		hr.room_type,
		hr.floor_number
	FROM room_admissions ra
	JOIN hospital_rooms hr ON hr.id = ra.room_id
	WHERE ra.id = @admission_id;
END;
GO

CREATE PROCEDURE sp_get_sql_feature_report -- PROCEDURE
AS
BEGIN
	SET NOCOUNT ON;

	-- INNER JOIN + SUBQUERY
	SELECT TOP 5
		a.id AS appointment_id,
		p.name AS patient_name,
		d.name AS doctor_name,
		a.status,
		a.appointment_date
	FROM appointments a
	INNER JOIN patients p ON p.id = a.patient_id -- INNER JOIN
	INNER JOIN doctors d ON d.id = a.doctor_id -- INNER JOIN
	WHERE a.patient_id IN ( -- SUBQUERY
		SELECT id
		FROM patients
		WHERE deleted_at IS NULL
	)
	ORDER BY ISNULL(a.updated_at, a.created_at) DESC;

	-- RIGHT JOIN
	SELECT TOP 5
		hr.id AS room_id,
		hr.room_number,
		ra.id AS admission_id,
		ra.status AS admission_status
	FROM room_admissions ra
	RIGHT JOIN hospital_rooms hr ON hr.id = ra.room_id -- RIGHT JOIN
	ORDER BY hr.room_number ASC;

	-- FULL JOIN
	SELECT TOP 10
		d.id AS doctor_id,
		d.name AS doctor_name,
		ra.id AS admission_id,
		ra.status AS admission_status
	FROM doctors d
	FULL JOIN room_admissions ra ON ra.doctor_id = d.id -- FULL JOIN
	ORDER BY ISNULL(ra.updated_at, d.updated_at) DESC;

	-- AGGREGATES + GROUP BY + HAVING
	-- NOTE: SQL Server has no FIRST()/LAST() aggregate functions; MIN/MAX are used as equivalents.
	SELECT
		hr.room_type,
		COUNT(*) AS total_rows, -- COUNT
		SUM(CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN 1 ELSE 0 END) AS active_rows, -- SUM
		AVG(CASE WHEN ra.admitted_at IS NOT NULL THEN DATEDIFF(HOUR, ra.admitted_at, ISNULL(ra.discharged_at, GETDATE())) * 1.0 END) AS avg_stay_hours, -- AVG
		MIN(ra.admitted_at) AS first_admission_at, -- MIN + FIRST equivalent
		MAX(ISNULL(ra.discharged_at, ra.admitted_at)) AS last_admission_at -- MAX + LAST equivalent
	FROM hospital_rooms hr
	LEFT JOIN room_admissions ra ON ra.room_id = hr.id -- LEFT JOIN
	GROUP BY hr.room_type -- GROUP BY
	HAVING COUNT(*) >= 1; -- HAVING
END;
GO


--------------------------------------------------
-- ADMIN-RELATED QUERIES EXTRACTED FROM schema.sql
-- NOTE: The SQL blocks below are copied from existing schema objects.
--------------------------------------------------

CREATE PROCEDURE sp_get_admin_by_email
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 *
	FROM admins
	WHERE email = @email AND deleted_at IS NULL;
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

CREATE PROCEDURE sp_create_admin
	@acting_admin_id BIGINT,
	@name NVARCHAR(255),
	@email NVARCHAR(255),
	@password NVARCHAR(255),
	@plain_password NVARCHAR(255),
	@confirm_password NVARCHAR(255),
	@phone NVARCHAR(50) = NULL,
	@admin_role NVARCHAR(100)
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

	IF @acting_admin_role NOT IN ('super', 'super admin', 'super-admin', 'super_admin')
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
GO

CREATE PROCEDURE sp_get_admin_notifications
	@admin_id BIGINT,
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
GO

CREATE PROCEDURE sp_get_admin_appointments
	@status NVARCHAR(50) = NULL
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
GO

CREATE PROCEDURE sp_update_admin_appointment_status
	@appointment_id BIGINT,
	@status NVARCHAR(50)
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_admin_dashboard_stats
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_admin_recent_appointments
	@limit INT = 5
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_admin_room_admissions
	@status NVARCHAR(30) = NULL
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_admin_room_lookup_patients
AS
BEGIN
	SELECT
		id,
		name,
		email
	FROM patients
	WHERE deleted_at IS NULL
	ORDER BY name ASC;
END;
GO

CREATE PROCEDURE sp_get_admin_room_lookup_doctors
AS
BEGIN
	SELECT
		id,
		name,
		department,
		specialization
	FROM doctors
	WHERE deleted_at IS NULL
	ORDER BY name ASC;
END;
GO

CREATE PROCEDURE sp_get_admin_available_rooms
AS
BEGIN
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
GO

CREATE PROCEDURE sp_create_room_admission
	@patient_id BIGINT,
	@room_id BIGINT,
	@doctor_id BIGINT = NULL,
	@admission_reason NVARCHAR(500) = NULL,
	@admission_notes NVARCHAR(MAX) = NULL,
	@admitted_at DATETIME = NULL,
	@expected_discharge_at DATETIME = NULL
AS
BEGIN
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
GO

CREATE PROCEDURE sp_discharge_room_admission
	@admission_id BIGINT,
	@discharge_notes NVARCHAR(MAX) = NULL
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_admin_room_dashboard_stats
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_admin_recent_room_admissions
	@limit INT = 5
AS
BEGIN
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


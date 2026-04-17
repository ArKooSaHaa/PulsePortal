--------------------------------------------------
-- PATIENT-RELATED QUERIES EXTRACTED FROM schema.sql
-- NOTE: The SQL blocks below are copied from existing schema objects.
--------------------------------------------------

CREATE PROCEDURE sp_create_patient -- Query: create a new patient account
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
GO

CREATE PROCEDURE sp_email_exists -- Query: check if an email already exists
	@email NVARCHAR(255)
AS
BEGIN
	SELECT CASE
		WHEN EXISTS (SELECT 1 FROM patients WHERE email = @email AND deleted_at IS NULL)
			OR EXISTS (SELECT 1 FROM doctors WHERE email = @email AND deleted_at IS NULL)
			OR EXISTS (SELECT 1 FROM admins WHERE email = @email AND deleted_at IS NULL)
		THEN 1
		ELSE 0
	END AS email_exists;
END;
GO

CREATE PROCEDURE sp_get_patient_by_email -- Query: get patient details by email
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 *
	FROM patients
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

CREATE PROCEDURE sp_login_patient -- Query: fetch patient row for login
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 * FROM patients
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

CREATE PROCEDURE sp_create_appointment -- Query: create appointment with doctor availability check
	@patient_id BIGINT,
	@doctor_id BIGINT,
	@appointment_date DATETIME,
	@appointment_type NVARCHAR(30) = NULL
AS
BEGIN
	DECLARE @available_days NVARCHAR(MAX);
	DECLARE @normalized_available_days NVARCHAR(MAX);
	DECLARE @appointment_weekday_index INT;
	DECLARE @appointment_weekday_token NVARCHAR(3);
	DECLARE @appointment_weekday_full NVARCHAR(10);
	DECLARE @is_available BIT = 0;

	IF NOT EXISTS (
		SELECT 1
		FROM doctors
		WHERE id = @doctor_id
		  AND role = 'doctor'
		  AND deleted_at IS NULL
	)
	BEGIN
		RAISERROR('Selected doctor is not available.', 16, 1);
		RETURN;
	END

	SELECT TOP 1 @available_days = available_days
	FROM doctors
	WHERE id = @doctor_id
	  AND role = 'doctor'
	  AND deleted_at IS NULL;

	IF @available_days IS NULL OR LTRIM(RTRIM(@available_days)) = ''
	BEGIN
		SET @is_available = 1;
	END
	ELSE
	BEGIN
		SET @appointment_weekday_index = DATEDIFF(DAY, '19000107', CAST(@appointment_date AS DATE)) % 7;

		IF @appointment_weekday_index < 0
		BEGIN
			SET @appointment_weekday_index = @appointment_weekday_index + 7;
		END

		SET @appointment_weekday_token = CASE @appointment_weekday_index
			WHEN 0 THEN 'SUN'
			WHEN 1 THEN 'MON'
			WHEN 2 THEN 'TUE'
			WHEN 3 THEN 'WED'
			WHEN 4 THEN 'THU'
			WHEN 5 THEN 'FRI'
			WHEN 6 THEN 'SAT'
		END;

		SET @appointment_weekday_full = CASE @appointment_weekday_token
			WHEN 'SUN' THEN 'SUNDAY'
			WHEN 'MON' THEN 'MONDAY'
			WHEN 'TUE' THEN 'TUESDAY'
			WHEN 'WED' THEN 'WEDNESDAY'
			WHEN 'THU' THEN 'THURSDAY'
			WHEN 'FRI' THEN 'FRIDAY'
			WHEN 'SAT' THEN 'SATURDAY'
		END;

		IF ISJSON(@available_days) = 1
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM OPENJSON(@available_days)
				WHERE UPPER(LEFT(LTRIM(RTRIM(CONVERT(NVARCHAR(30), [value]))), 3)) = @appointment_weekday_token
			)
			BEGIN
				SET @is_available = 1;
			END
		END
		ELSE
		BEGIN
			SET @normalized_available_days = UPPER(LTRIM(RTRIM(@available_days)));
			SET @normalized_available_days = REPLACE(@normalized_available_days, ';', ',');
			SET @normalized_available_days = REPLACE(@normalized_available_days, '|', ',');
			SET @normalized_available_days = REPLACE(@normalized_available_days, ' ', '');

			IF CHARINDEX(',' + @appointment_weekday_token + ',', ',' + @normalized_available_days + ',') > 0
			   OR CHARINDEX(',' + @appointment_weekday_full + ',', ',' + @normalized_available_days + ',') > 0
			BEGIN
				SET @is_available = 1;
			END
		END
	END

	IF @is_available = 0
	BEGIN
		RAISERROR('This doctor is not available on the selected day.', 16, 1);
		RETURN;
	END

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
GO

CREATE PROCEDURE sp_get_patient_appointments -- Query: list all appointments for a patient
	@patient_id BIGINT
AS
BEGIN
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
GO

CREATE PROCEDURE sp_get_patient_upcoming_appointments -- Query: list upcoming appointments for a patient
	@patient_id BIGINT,
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
		d.name AS doctor_name,
		d.specialization AS doctor_specialization,
		d.department AS doctor_department
	FROM appointments a
	JOIN doctors d ON d.id = a.doctor_id
	WHERE a.patient_id = @patient_id
	  AND a.status <> 'cancelled'
	  AND (
			a.appointment_date >= GETDATE()
			OR a.status = 'completed'
	  )
	ORDER BY
		CASE WHEN a.appointment_date >= GETDATE() THEN 0 ELSE 1 END,
		CASE WHEN a.appointment_date >= GETDATE() THEN a.appointment_date END ASC,
		CASE WHEN a.appointment_date < GETDATE() THEN a.appointment_date END DESC;
END;
GO

CREATE PROCEDURE sp_get_patient_notifications -- Query: build patient notification feed
	@patient_id BIGINT,
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
GO

CREATE PROCEDURE sp_get_patient_room_admission_stats -- Query: summarize patient room admission stats
	@patient_id BIGINT
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
	WHERE patient_id = @patient_id;
END;
GO

CREATE PROCEDURE sp_get_patient_room_admissions -- Query: list patient room admissions
	@patient_id BIGINT,
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
			CAST(NULL AS NVARCHAR(255)) AS patient_email,
			CAST(NULL AS NVARCHAR(255)) AS doctor_name,
			CAST(NULL AS NVARCHAR(255)) AS doctor_department,
			CAST(NULL AS NVARCHAR(255)) AS doctor_specialization;
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
		p.email AS patient_email,
		d.name AS doctor_name,
		d.department AS doctor_department,
		d.specialization AS doctor_specialization
	FROM room_admissions ra
	JOIN hospital_rooms hr ON hr.id = ra.room_id
	JOIN patients p ON p.id = ra.patient_id
	LEFT JOIN doctors d ON d.id = ra.doctor_id
	WHERE ra.patient_id = @patient_id
	  AND p.deleted_at IS NULL
	ORDER BY
		CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN 0 ELSE 1 END,
		CASE WHEN ra.status = 'admitted' AND ra.discharged_at IS NULL THEN ra.admitted_at END DESC,
		CASE WHEN ra.status <> 'admitted' OR ra.discharged_at IS NOT NULL THEN ISNULL(ra.discharged_at, ra.updated_at) END DESC;
END;
GO

CREATE PROCEDURE sp_get_patient_room_admission_details -- Query: get patient room admission details
	@patient_id BIGINT,
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
		d.department AS doctor_department,
		d.specialization AS doctor_specialization
	FROM room_admissions ra
	JOIN hospital_rooms hr ON hr.id = ra.room_id
	JOIN patients p ON p.id = ra.patient_id
	LEFT JOIN doctors d ON d.id = ra.doctor_id
	WHERE ra.id = @admission_id
	  AND ra.patient_id = @patient_id
	  AND p.deleted_at IS NULL;
END;
GO

CREATE PROCEDURE sp_get_patient_recent_history -- Query: list recent appointment history
	@patient_id BIGINT,
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
		d.name AS doctor_name,
		d.specialization AS doctor_specialization,
		d.department AS doctor_department
	FROM appointments a
	JOIN doctors d ON d.id = a.doctor_id
	WHERE a.patient_id = @patient_id
	  AND a.appointment_date < GETDATE()
	ORDER BY a.appointment_date DESC;
END;
GO

CREATE PROCEDURE sp_get_patient_appointment_summary -- Query: get appointment summary note
	@patient_id BIGINT,
	@appointment_id BIGINT
AS
BEGIN
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
		d.department AS doctor_department,
		CASE
			WHEN a.status = 'completed' THEN 'Consultation completed and recorded in your history.'
			WHEN a.status = 'cancelled' THEN 'This appointment was cancelled.'
			ELSE 'Visit details are available in your appointment history.'
		END AS summary_note
	FROM appointments a
	JOIN doctors d ON d.id = a.doctor_id
	WHERE a.patient_id = @patient_id
	  AND a.id = @appointment_id
	  AND a.appointment_date < GETDATE();
END;
GO

CREATE PROCEDURE sp_get_patient_appointment_details -- Query: get appointment details
	@patient_id BIGINT,
	@appointment_id BIGINT
AS
BEGIN
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
GO

CREATE PROCEDURE sp_cancel_patient_appointment -- Query: cancel a patient appointment
	@patient_id BIGINT,
	@appointment_id BIGINT
AS
BEGIN
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
GO

CREATE VIEW vw_room_admission_analytics -- Query: room admission analytics view
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

CREATE TRIGGER trg_sync_room_status_from_admissions -- Query: sync room status after admission changes
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

CREATE PROCEDURE sp_transfer_room_admission -- Query: transfer active admission to another room
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

CREATE PROCEDURE sp_get_sql_feature_report -- Query: SQL feature demonstration report
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


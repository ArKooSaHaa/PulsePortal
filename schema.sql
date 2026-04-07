--------------------------------------------------
-- DATABASE SETUP
--------------------------------------------------
IF DB_ID('laravel_db') IS NOT NULL
	DROP DATABASE laravel_db;
GO

CREATE DATABASE laravel_db;
GO

USE laravel_db;
GO

--------------------------------------------------
-- DROP PROCEDURES (SAFE RE-RUN)
--------------------------------------------------
IF OBJECT_ID('sp_create_patient', 'P') IS NOT NULL DROP PROCEDURE sp_create_patient;
IF OBJECT_ID('sp_login_patient', 'P') IS NOT NULL DROP PROCEDURE sp_login_patient;
IF OBJECT_ID('sp_get_patient_by_email', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_by_email;
IF OBJECT_ID('sp_get_doctor_by_email', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_by_email;
IF OBJECT_ID('sp_get_admin_by_email', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_by_email;
IF OBJECT_ID('sp_email_exists', 'P') IS NOT NULL DROP PROCEDURE sp_email_exists;
IF OBJECT_ID('sp_get_doctors', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctors;
IF OBJECT_ID('sp_create_admin', 'P') IS NOT NULL DROP PROCEDURE sp_create_admin;
IF OBJECT_ID('sp_create_doctor', 'P') IS NOT NULL DROP PROCEDURE sp_create_doctor;
IF OBJECT_ID('sp_search_doctors', 'P') IS NOT NULL DROP PROCEDURE sp_search_doctors;
IF OBJECT_ID('sp_update_doctor', 'P') IS NOT NULL DROP PROCEDURE sp_update_doctor;
IF OBJECT_ID('sp_delete_patient', 'P') IS NOT NULL DROP PROCEDURE sp_delete_patient;
IF OBJECT_ID('sp_create_appointment', 'P') IS NOT NULL DROP PROCEDURE sp_create_appointment;
IF OBJECT_ID('sp_get_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_appointments;
IF OBJECT_ID('sp_paginate_doctors', 'P') IS NOT NULL DROP PROCEDURE sp_paginate_doctors;
IF OBJECT_ID('sp_get_doctors_for_booking', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctors_for_booking;
IF OBJECT_ID('sp_get_patient_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_appointments;
IF OBJECT_ID('sp_get_patient_upcoming_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_upcoming_appointments;
IF OBJECT_ID('sp_get_patient_notifications', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_notifications;
IF OBJECT_ID('sp_get_patient_room_admission_stats', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_room_admission_stats;
IF OBJECT_ID('sp_get_patient_room_admissions', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_room_admissions;
IF OBJECT_ID('sp_get_patient_room_admission_details', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_room_admission_details;
IF OBJECT_ID('sp_get_patient_recent_history', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_recent_history;
IF OBJECT_ID('sp_get_patient_appointment_summary', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_appointment_summary;
IF OBJECT_ID('sp_get_patient_appointment_details', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_appointment_details;
IF OBJECT_ID('sp_cancel_patient_appointment', 'P') IS NOT NULL DROP PROCEDURE sp_cancel_patient_appointment;
IF OBJECT_ID('sp_get_doctor_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_appointments;
IF OBJECT_ID('sp_update_doctor_appointment_status', 'P') IS NOT NULL DROP PROCEDURE sp_update_doctor_appointment_status;
IF OBJECT_ID('sp_get_doctor_room_admission_stats', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_room_admission_stats;
IF OBJECT_ID('sp_get_doctor_room_admissions', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_room_admissions;
IF OBJECT_ID('sp_get_doctor_room_admission_details', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_room_admission_details;
IF OBJECT_ID('sp_get_doctor_notifications', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_notifications;
IF OBJECT_ID('sp_get_admin_notifications', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_notifications;
IF OBJECT_ID('sp_get_admin_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_appointments;
IF OBJECT_ID('sp_update_admin_appointment_status', 'P') IS NOT NULL DROP PROCEDURE sp_update_admin_appointment_status;
IF OBJECT_ID('sp_get_admin_dashboard_stats', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_dashboard_stats;
IF OBJECT_ID('sp_get_admin_recent_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_recent_appointments;
IF OBJECT_ID('sp_get_admin_room_admissions', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_room_admissions;
IF OBJECT_ID('sp_get_admin_room_lookup_patients', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_room_lookup_patients;
IF OBJECT_ID('sp_get_admin_room_lookup_doctors', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_room_lookup_doctors;
IF OBJECT_ID('sp_get_admin_available_rooms', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_available_rooms;
IF OBJECT_ID('sp_create_room_admission', 'P') IS NOT NULL DROP PROCEDURE sp_create_room_admission;
IF OBJECT_ID('sp_discharge_room_admission', 'P') IS NOT NULL DROP PROCEDURE sp_discharge_room_admission;
IF OBJECT_ID('sp_get_admin_room_dashboard_stats', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_room_dashboard_stats;
IF OBJECT_ID('sp_get_admin_recent_room_admissions', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_recent_room_admissions;
GO

--------------------------------------------------
-- DROP TABLES (SAFE ORDER)
--------------------------------------------------
IF OBJECT_ID('appointments', 'U') IS NOT NULL DROP TABLE appointments;
IF OBJECT_ID('room_admissions', 'U') IS NOT NULL DROP TABLE room_admissions;
IF OBJECT_ID('hospital_rooms', 'U') IS NOT NULL DROP TABLE hospital_rooms;
IF OBJECT_ID('doctors', 'U') IS NOT NULL DROP TABLE doctors;
IF OBJECT_ID('admins', 'U') IS NOT NULL DROP TABLE admins;
IF OBJECT_ID('patients', 'U') IS NOT NULL DROP TABLE patients;
GO

--------------------------------------------------
-- PATIENTS TABLE
--------------------------------------------------
CREATE TABLE patients (
	id BIGINT IDENTITY(1,1) PRIMARY KEY,

	name NVARCHAR(255) NOT NULL,
	email NVARCHAR(255) NOT NULL UNIQUE,
	password NVARCHAR(255) NOT NULL,
	role NVARCHAR(20) NOT NULL DEFAULT 'patient',

	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME DEFAULT GETDATE(),
	deleted_at DATETIME NULL
);

CREATE INDEX idx_patients_email ON patients(email);

--------------------------------------------------
-- ADMINS TABLE
--------------------------------------------------
CREATE TABLE admins (
	id BIGINT IDENTITY(1,1) PRIMARY KEY,

	name NVARCHAR(255) NOT NULL,
	email NVARCHAR(255) NOT NULL UNIQUE,
	password NVARCHAR(255) NOT NULL,
	phone NVARCHAR(50),
	role NVARCHAR(20) NOT NULL DEFAULT 'admin',
	admin_role NVARCHAR(100),

	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME DEFAULT GETDATE(),
	deleted_at DATETIME NULL
);

CREATE INDEX idx_admins_email ON admins(email);

--------------------------------------------------
-- DOCTORS TABLE
--------------------------------------------------
CREATE TABLE doctors (
	id BIGINT IDENTITY(1,1) PRIMARY KEY,

	name NVARCHAR(255) NOT NULL,
	email NVARCHAR(255) NOT NULL UNIQUE,
	password NVARCHAR(255) NOT NULL,
	phone NVARCHAR(50),
	role NVARCHAR(20) NOT NULL DEFAULT 'doctor',

	department NVARCHAR(255),
	specialization NVARCHAR(255),
	license_number NVARCHAR(100),
	available_days NVARCHAR(MAX),

	photo_path NVARCHAR(255),

	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME DEFAULT GETDATE(),
	deleted_at DATETIME NULL
);

CREATE INDEX idx_doctors_email ON doctors(email);

--------------------------------------------------
-- APPOINTMENTS TABLE
--------------------------------------------------
CREATE TABLE appointments (
	id BIGINT IDENTITY(1,1) PRIMARY KEY,

	patient_id BIGINT NOT NULL,
	doctor_id BIGINT NOT NULL,
	appointment_date DATETIME NOT NULL,
	appointment_type NVARCHAR(30) NULL,
	status NVARCHAR(50) DEFAULT 'pending',

	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME DEFAULT GETDATE(),

	FOREIGN KEY (patient_id) REFERENCES patients(id),
	FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

--------------------------------------------------
-- HOSPITAL ROOMS TABLE
--------------------------------------------------
CREATE TABLE hospital_rooms (
	id BIGINT IDENTITY(1,1) PRIMARY KEY,

	room_number NVARCHAR(50) NOT NULL UNIQUE,
	room_type NVARCHAR(100) NOT NULL DEFAULT 'General',
	floor_number INT NOT NULL DEFAULT 1,
	status NVARCHAR(30) NOT NULL DEFAULT 'available',

	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_hospital_rooms_status ON hospital_rooms(status);

--------------------------------------------------
-- ROOM ADMISSIONS TABLE
--------------------------------------------------
CREATE TABLE room_admissions (
	id BIGINT IDENTITY(1,1) PRIMARY KEY,

	room_id BIGINT NOT NULL,
	patient_id BIGINT NOT NULL,
	doctor_id BIGINT NULL,

	status NVARCHAR(30) NOT NULL DEFAULT 'admitted',
	admission_reason NVARCHAR(500) NULL,
	admission_notes NVARCHAR(MAX) NULL,
	discharge_notes NVARCHAR(MAX) NULL,

	admitted_at DATETIME NOT NULL,
	expected_discharge_at DATETIME NULL,
	discharged_at DATETIME NULL,

	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME DEFAULT GETDATE(),

	FOREIGN KEY (room_id) REFERENCES hospital_rooms(id),
	FOREIGN KEY (patient_id) REFERENCES patients(id),
	FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE INDEX idx_room_admissions_status ON room_admissions(status);
CREATE INDEX idx_room_admissions_room ON room_admissions(room_id);
CREATE INDEX idx_room_admissions_patient ON room_admissions(patient_id);

--------------------------------------------------
-- SEED DATA
--------------------------------------------------
INSERT INTO patients (name, email, password)
VALUES
('John Doe', 'john@example.com', '$2y$10$QiNZtIxBqjFg.iki0nTo0uZS3bkSepwr8bcSJcVET72Knx6qgXhiq'),
('Jane Doe', 'jane@example.com', '$2y$10$QiNZtIxBqjFg.iki0nTo0uZS3bkSepwr8bcSJcVET72Knx6qgXhiq');

INSERT INTO admins (name, email, password, admin_role)
VALUES
('Super Admin', 'admin@example.com', '$2y$10$QiNZtIxBqjFg.iki0nTo0uZS3bkSepwr8bcSJcVET72Knx6qgXhiq', 'super');

INSERT INTO doctors (name, email, password, specialization, department)
VALUES
('Dr. Smith', 'smith@example.com', '$2y$10$QiNZtIxBqjFg.iki0nTo0uZS3bkSepwr8bcSJcVET72Knx6qgXhiq', 'Cardiology', 'Heart'),
('Dr. Ali', 'ali@example.com', '$2y$10$QiNZtIxBqjFg.iki0nTo0uZS3bkSepwr8bcSJcVET72Knx6qgXhiq', 'Neurology', 'Brain');

INSERT INTO hospital_rooms (room_number, room_type, floor_number, status)
VALUES
('101', 'Emergency', 1, 'available'),
('102', 'Emergency', 1, 'available'),
('103', 'General', 1, 'available'),
('104', 'General', 1, 'available'),
('105', 'General', 1, 'available'),
('201', 'General', 2, 'available'),
('202', 'General', 2, 'available'),
('203', 'General', 2, 'available'),
('204', 'General', 2, 'available'),
('301', 'ICU', 3, 'available'),
('302', 'ICU', 3, 'available'),
('303', 'ICU', 3, 'maintenance');

--------------------------------------------------
-- STORED PROCEDURES (CRUD + AUTH)
--------------------------------------------------

-- CREATE PATIENT
GO
CREATE PROCEDURE sp_create_patient
	@name NVARCHAR(255),
	@email NVARCHAR(255),
	@password NVARCHAR(255)
AS
BEGIN
	INSERT INTO patients (name, email, password, role, created_at, updated_at)
	VALUES (@name, @email, @password, 'patient', GETDATE(), GETDATE());
END;
GO

-- CHECK IF EMAIL EXISTS IN ANY AUTH TABLE
CREATE PROCEDURE sp_email_exists
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

-- GET PATIENT BY EMAIL
CREATE PROCEDURE sp_get_patient_by_email
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 *
	FROM patients
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

-- GET DOCTOR BY EMAIL
CREATE PROCEDURE sp_get_doctor_by_email
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 *
	FROM doctors
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

-- GET ADMIN BY EMAIL
CREATE PROCEDURE sp_get_admin_by_email
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 *
	FROM admins
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

-- LOGIN (PATIENT)
CREATE PROCEDURE sp_login_patient
	@email NVARCHAR(255)
AS
BEGIN
	SELECT TOP 1 * FROM patients
	WHERE email = @email AND deleted_at IS NULL;
END;
GO

-- GET ALL DOCTORS
CREATE PROCEDURE sp_get_doctors
AS
BEGIN
	SELECT id, name, specialization, department
	FROM doctors
	WHERE deleted_at IS NULL;
END;
GO

-- GET DOCTORS FOR BOOKING (FILTERABLE)
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

-- CREATE DOCTOR
CREATE PROCEDURE sp_create_doctor
	@acting_admin_id BIGINT,
	@name NVARCHAR(255),
	@email NVARCHAR(255),
	@password NVARCHAR(255),
	@phone NVARCHAR(50) = NULL,
	@department NVARCHAR(255) = NULL,
	@specialization NVARCHAR(255) = NULL,
	@license_number NVARCHAR(100) = NULL,
	@available_days NVARCHAR(MAX) = NULL,
	@photo_path NVARCHAR(255) = NULL
AS
BEGIN
	DECLARE @acting_admin_role NVARCHAR(100);

	SELECT TOP 1 @acting_admin_role = LOWER(LTRIM(RTRIM(ISNULL(admin_role, ''))))
	FROM admins
	WHERE id = @acting_admin_id
	  AND deleted_at IS NULL;

	IF @acting_admin_role NOT IN ('super', 'super admin', 'super-admin', 'super_admin', 'manager')
	BEGIN
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

-- CREATE ADMIN (SUPER ONLY)
CREATE PROCEDURE sp_create_admin
	@acting_admin_id BIGINT,
	@name NVARCHAR(255),
	@email NVARCHAR(255),
	@password NVARCHAR(255),
	@phone NVARCHAR(50) = NULL,
	@admin_role NVARCHAR(100)
AS
BEGIN
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
GO

-- SEARCH DOCTORS
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

-- UPDATE DOCTOR
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

-- SOFT DELETE PATIENT
CREATE PROCEDURE sp_delete_patient
	@id BIGINT
AS
BEGIN
	UPDATE patients
	SET deleted_at = GETDATE()
	WHERE id = @id;
END;
GO

-- CREATE APPOINTMENT
CREATE PROCEDURE sp_create_appointment
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

-- GET APPOINTMENTS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_appointments
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

-- GET UPCOMING APPOINTMENTS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_upcoming_appointments
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

-- GET ROOM ADMISSION STATS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_notifications
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

-- GET ROOM ADMISSION STATS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_room_admission_stats
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

-- GET ROOM ADMISSIONS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_room_admissions
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

-- GET ROOM ADMISSION DETAILS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_room_admission_details
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

-- GET RECENT HISTORY FOR A PATIENT
CREATE PROCEDURE sp_get_patient_recent_history
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

-- GET APPOINTMENT DETAILS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_appointment_summary
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

-- GET APPOINTMENT DETAILS FOR A PATIENT
CREATE PROCEDURE sp_get_patient_appointment_details
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

-- CANCEL APPOINTMENT FOR A PATIENT
CREATE PROCEDURE sp_cancel_patient_appointment
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

-- GET APPOINTMENTS FOR A DOCTOR
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

-- UPDATE APPOINTMENT STATUS BY DOCTOR
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

-- GET ROOM ADMISSION STATS FOR A DOCTOR
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

-- GET ROOM ADMISSION STATS FOR A DOCTOR
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

-- GET ROOM ADMISSIONS ASSIGNED TO A DOCTOR
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

-- GET ROOM ADMISSION DETAILS FOR A DOCTOR
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

-- GET NOTIFICATIONS FOR ADMIN
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

-- GET APPOINTMENTS FOR ADMIN
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

-- UPDATE APPOINTMENT STATUS BY ADMIN
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

-- GET ADMIN DASHBOARD STATS
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

-- GET RECENT APPOINTMENTS FOR ADMIN DASHBOARD
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

-- GET APPOINTMENTS (JOIN)
CREATE PROCEDURE sp_get_appointments
AS
BEGIN
	SELECT
		a.id,
		p.name AS patient_name,
		d.name AS doctor_name,
		a.appointment_date,
		a.status
	FROM appointments a
	JOIN patients p ON a.patient_id = p.id
	JOIN doctors d ON a.doctor_id = d.id;
END;
GO

-- PAGINATION (DOCTORS)
CREATE PROCEDURE sp_paginate_doctors
	@offset INT,
	@limit INT
AS
BEGIN
	SELECT *
	FROM doctors
	ORDER BY id
	OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END;
GO

-- GET ROOM ADMISSIONS FOR ADMIN
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

-- LOOKUP PATIENTS FOR ROOM ADMISSION
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

-- LOOKUP DOCTORS FOR ROOM ADMISSION
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

-- AVAILABLE ROOMS FOR ADMISSION
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

-- CREATE ROOM ADMISSION
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

-- DISCHARGE ROOM ADMISSION
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

-- ADMIN ROOM DASHBOARD STATS
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

-- RECENT ROOM ADMISSIONS FOR ADMIN DASHBOARD
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

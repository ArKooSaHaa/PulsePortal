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
IF OBJECT_ID('sp_search_doctors', 'P') IS NOT NULL DROP PROCEDURE sp_search_doctors;
IF OBJECT_ID('sp_update_doctor', 'P') IS NOT NULL DROP PROCEDURE sp_update_doctor;
IF OBJECT_ID('sp_delete_patient', 'P') IS NOT NULL DROP PROCEDURE sp_delete_patient;
IF OBJECT_ID('sp_create_appointment', 'P') IS NOT NULL DROP PROCEDURE sp_create_appointment;
IF OBJECT_ID('sp_get_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_appointments;
IF OBJECT_ID('sp_paginate_doctors', 'P') IS NOT NULL DROP PROCEDURE sp_paginate_doctors;
IF OBJECT_ID('sp_get_doctors_for_booking', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctors_for_booking;
IF OBJECT_ID('sp_get_patient_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_patient_appointments;
IF OBJECT_ID('sp_get_doctor_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_doctor_appointments;
IF OBJECT_ID('sp_update_doctor_appointment_status', 'P') IS NOT NULL DROP PROCEDURE sp_update_doctor_appointment_status;
IF OBJECT_ID('sp_get_admin_appointments', 'P') IS NOT NULL DROP PROCEDURE sp_get_admin_appointments;
IF OBJECT_ID('sp_update_admin_appointment_status', 'P') IS NOT NULL DROP PROCEDURE sp_update_admin_appointment_status;
GO

--------------------------------------------------
-- DROP TABLES (SAFE ORDER)
--------------------------------------------------
IF OBJECT_ID('appointments', 'U') IS NOT NULL DROP TABLE appointments;
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

-- GET APPOINTMENTS FOR A DOCTOR
CREATE PROCEDURE sp_get_doctor_appointments
	@doctor_id BIGINT,
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

# Project Title: Pulse Portal

## Team members

| Name                   | ID          | Email                       | Role                |
| ---------------------- | ----------- | --------------------------- | ------------------- |
| Samia Rahman Arpita    | 20230104007 | arpitarahmansamia@gmail.com | Front-end Developer |
| Kazi Md Shahadat Hasan | 20230104008 | tamimshahadat15@gmail.com   | Back-end Developer  |
| Hrittika Saha          | 20230104024 | hrittika23.st05@gmail.com   | Lead                |

# Project Overview

### Objective

The objective of Pulse Portal is to develop an intelligent healthcare support system that enhances patient access to healthcare services and improves consultation management for doctors and professionals. By integrating structured appointment workflows with AI-assisted guidance, summarization, and administrative support, the system aims to facilitate informed decision-making, reduce communication barriers, and improve overall operational efficiency.

### Target Audience

- **Patients** seeking a simple and organized platform to request healthcare consultations, manage appointments, and understand medical symptoms better.

- **Doctors and professionals** who require a structured system to manage consultations, review patient histories, and document visits.

- **Hospital administrative staff** responsible for coordinating appointment requests, scheduling consultations, and managing doctor availability.

# Tech Stack

### 1. Backend

- **Laravel (PHP)**

### 2. Frontend

- **React**
- **TailwindCSS**

### 3. Rendering Method

- **Client-Side Rendering (CSR):** Adopted to provide a smooth, interactive experience for role-based users without the need for SEO.

### 4. Database

- **MySQL:** Will store patient profiles, doctor information, appointments, visit records, and AI-generated summaries.

### 5. AI Integration

- **OpenAI / Gemini API:** Will be used for AI-assisted features such as recommending specialists based on symptoms, generating visit summaries, and providing decision-support guidance.

### 6. Supporting Tools

- **JWT:** For secure authentication.
- **Pusher & Laravel Echo:** For real-time notifications.
- **Mailpit:** For local email testing.

# UI Mockups

### Landing Page

<p align="center">
  <img src="./assets/Landing-Page.png" width="800" alt="PulsePortal Landing Page">
</p>

### Patient Dashboard

<p align="center">
  <img src="./assets/Patient-Dashboard.png" width="800" alt="PulsePortal Patient Dashboard">
</p>

### Appointment Booking

<p align="center">
  <img src="./assets/Appointment-Booking.png" width="800" alt="PulsePortal Appointment Booking Page">
</p>

### Doctor Dashboard

<p align="center">
  <img src="./assets/Doctor-Dashboard.png" width="800" alt="PulsePortal Doctor Dashboard">
</p>

### Admin Dashboard

<p align="center">
  <img src="./assets/Admin-Dashboard.png" width="800" alt="PulsePortal Admin Dashboard">
</p>

### Figma Link: https://www.figma.com/design/2R43AosEDGOxKwGeT3RqdJ/PulsePortal?m=auto&t=rdkGS48Rce4pU5TD-1

# Project Features

## 1. Main Features

- **Patient Management:** Patient registration, profile updates, appointment requests, and access to visit history.

- **Doctor Dashboard:** View assigned appointments, patient history access, and visit notes.

- **Appointment Management:** Structured appointment request, review, and support for both in-person and online consultations.

- **Role-Based Access Control:** Secure authentication and authorization for patients, doctors, and hospital staff based on assigned roles.

## 2. AI Integrated Features

- **Specialist Recommendation:** Suggest appropriate departments or specialists based on patient-reported symptoms.

- **Visit Summarization:** Generate simplified, patient-friendly summaries from doctor notes.

- **Past Visits Summarization:** Provide concise summaries of past visits to help doctors better understand their patients medical history.

\| _AI features are designed for understanding and decision-making and do not provide medical diagnoses or treatment recommendations._

## 3. CRUD Operations

- **Patients:** Create and update patient profiles and retrieve visit-related information.

- **Doctors:** Maintain doctor information including availability and specialization.

- **Appointments:** Create appointment requests, view schedules, update appointment status.

- **Visit Notes:** Record and retrieve visit notes and summaries added by doctors.

## 4. Key API Endpoints (approx.)

- **POST /auth/register** – Patient registration

- **POST /auth/login** – Login for all user roles

- **GET /patients/appointments** – View patient appointments

- **POST /patients/appointments** – Request a new appointment

- **GET /doctors/appointments** – View doctor scheduled appointments

- **POST /doctors/visit-notes** – Add visit notes

- **GET /patients/visit-history** – Fetch visit summaries

- **PUT /admin/appointments/{id}/schedule** – Admin schedules appointments

- **POST /admin/doctors** – Add doctor accounts

- **POST /patients/ai/specialist-recomm** – Suggest specialists based on symptoms

- **POST /doctors/ai/visit-summary** – Generate simplified summaries from past visit notes.

# Milestones

### Milestone 1: Core System Setup & Authentication

- Database design and initial schema (patients, doctors, admins, appointments)
- JWT-based authentication and role-based access control
- Patient registration and unified login system
- Design basic dashboards for patients, doctors and admins
- API integration between frontend and backend

### Milestone 2: Appointment & Consultation Management

- Patient appointment request and management
- Doctor appointment viewing and status updates
- Admin appointment reviewing
- Visit history and consultation record storage

### Milestone 3: AI Integration & Finalization

- Basic online consultation support
- AI-assisted specialist recommendation based on symptoms
- Historical visit summarization for patients
- UI enhancements and improved user experience
- Testing, bug fixing, and final deployment preparation

---

## Setup

**1. Clone the repository and switch to the dev branch**

```bash
git clone <repository-url>
cd PulsePortal
git checkout dev
```

**2. Install PHP dependencies**

```bash
composer install
```

**3. Copy the environment file**

```bash
cp .env.example .env
```

Then open `.env` and set the following:

```
DB_HOST=mysql
DB_DATABASE=pulse_portal
DB_USERNAME=root
DB_PASSWORD=root

**4. Start Docker**

```bash
docker-compose up --build
```

**5. Generate the Laravel app key**

```bash
docker exec -it pulseportal_app php artisan key:generate
```

**6. Publish JWT config**

```bash
docker exec -it pulseportal_app php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
```

**7. Generate the JWT secret**

```bash
docker exec -it pulseportal_app php artisan jwt:secret
```

**8. Run migrations and seed the database**

```bash
docker exec -it pulseportal_app php artisan migrate:fresh --seed
```

**9. Install frontend dependencies**

```bash
cd client
npm install

# Install Pusher/Echo front-end dependencies (if not already installed)
npm install pusher-js laravel-echo
```

## Accessing the App

| Service                 | URL                       | Description                  |
| ----------------------- | ------------------------- | ---------------------------- |
| Frontend (React)        | http://localhost:5173     | Main user interface          |
| Backend API             | http://localhost:8000/api | API root                     |
| Mailpit (Email Catcher) | http://localhost:8025     | View outgoing emails locally |
| MySQL (DB Client only)  | localhost:3308            | Direct database access       |

> Connect to MySQL using a client like DBeaver or TablePlus with username `root` and password `root`.

## Seeded Test Accounts

All accounts use the password: `password123`

| Role | Email |
| :--- | :--- |
| **Super Admin** | `admin@pulseportal.com` |
| **Dept Admin (Cardio)** | `cardio@pulseportal.com` |
| **Doctor (Cardio)** | `doctor@pulseportal.com` |
| **Patient** | `patient@pulseportal.com` |

# Daily Development Workflow

```bash
docker-compose up
```

**Running the Background Worker (For Emails & Queued Tasks)**
If `QUEUE_CONNECTION` is set to `database`, you must run the worker to process emails:
```bash
docker exec -it pulseportal_app php artisan queue:work
```

**Real-time Alerts Setup**
To ensure the appointment requests and status updates pop up instantly:
1. **Backend Installation**: Run `docker exec -it pulseportal_app composer require pusher/pusher-php-server` (if not already in vendor).


**After pulling new changes that include migrations**

```bash
docker exec -it pulseportal_app php artisan migrate
```

**After pulling new changes that include `.env.example` updates**

```bash
docker exec -it pulseportal_app php artisan config:clear
```

**Resetting the database (wipes all data)**

```bash
docker exec -it pulseportal_app php artisan migrate:fresh --seed
```

> ⚠️ Never run `migrate:fresh` if you have data you want to keep.

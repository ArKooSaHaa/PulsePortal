<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\DoctorAppointmentController;
use App\Http\Controllers\PatientAppointmentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'Pulse Portal API is running',
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:api'])->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::get('/dashboard', [AuthController::class, 'dashboard']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    Route::get('/patient/doctors', [PatientAppointmentController::class, 'doctors']);
    Route::get('/patient/appointments', [PatientAppointmentController::class, 'index']);
    Route::post('/patient/appointments', [PatientAppointmentController::class, 'store']);
});

Route::middleware(['auth:admin'])->group(function () {
    Route::post('/admin/admins', [AdminController::class, 'store']);
    Route::post('/admin/doctors', [DoctorController::class, 'store']);
});

Route::middleware(['auth:doctor'])->group(function () {
    Route::get('/doctor/appointments', [DoctorAppointmentController::class, 'index']);
    Route::patch('/doctor/appointments/{appointmentId}/status', [DoctorAppointmentController::class, 'updateStatus']);
});
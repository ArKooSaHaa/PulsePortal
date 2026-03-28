<?php

use App\Http\Controllers\UsersController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DoctorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// ── Auth routes ───────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('logout',   [AuthController::class, 'logout'])->middleware('auth:api');
    Route::get('me',        [AuthController::class, 'me'])->middleware('auth:api');
});

// ── Protected routes ──────────────────────────────────────────
Route::middleware('auth:api')->group(function () {
    Route::get('profile', [ProfileController::class, 'show']);


// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

    // Patient routes
    Route::prefix('patient')->group(function () {
        Route::get('appointments',              [AppointmentController::class, 'patientIndex']);
        Route::post('appointments',             [AppointmentController::class, 'store']);
        Route::patch('appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    });

    // Doctor routes
    Route::prefix('doctor')->group(function () {
        Route::get('appointments',                      [AppointmentController::class, 'doctorIndex']);
        Route::patch('appointments/{id}/status',        [AppointmentController::class, 'updateStatus']);
        Route::get('available',                         [DoctorController::class, 'index']);
    });

    // Admin routes
    Route::prefix('admin')->group(function () {
        // Milestone 2
    });
});

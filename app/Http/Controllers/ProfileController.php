<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Admin;

class ProfileController extends Controller
{
    // GET /api/profile
    public function show(Request $request)
    {
        $user = auth()->user();

        $profile = match ($user->role) {
            'patient' => Patient::where('user_id', $user->id)->first(),
            'doctor'  => Doctor::where('user_id', $user->id)->first(),
            'admin'   => Admin::where('user_id', $user->id)->first(),
            default   => null,
        };

        return response()->json([
            'status' => 'success',
            'data'   => [
                'user'    => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
                'profile' => $profile,
            ],
        ]);
    }
}
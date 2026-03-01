<?php

namespace App\Http\Services;

use App\Models\User;
use App\Models\Patient;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function registerPatient(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => 'patient', // always forced — cannot be changed by user input
        ]);

        // Create the empty patient profile immediately
        Patient::create(['user_id' => $user->id]);

        $token = auth()->login($user);

        return [
            'token' => $token,
            'user'  => $this->formatUser($user),
        ];
    }

    public function login(array $credentials): ?array
    {
        if (!$token = auth()->attempt($credentials)) {
            return null;
        }

        return [
            'token' => $token,
            'user'  => $this->formatUser(auth()->user()),
        ];
    }

    private function formatUser(User $user): array
    {
        return [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role, // patient | doctor | admin
        ];
    }
}

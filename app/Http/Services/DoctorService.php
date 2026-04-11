<?php

namespace App\Http\Services;

use App\Models\Doctor;

class DoctorService
{
    public function getAvailableDoctors()
    {
        return Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(fn($d) => [
                'id'             => $d->id,
                'name'           => $d->user->name,
                'specialization' => $d->specialization,
                'bio'            => $d->bio,
                'fee'            => $d->consultation_fee,
                'availability'   => $d->availability,
            ]);
    }
}

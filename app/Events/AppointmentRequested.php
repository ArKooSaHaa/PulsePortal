<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment->load(['patient.user']);
    }

    public function broadcastOn(): array
    {
        // Broadcast to the doctor's specific channel
        return [
            new PrivateChannel('user.' . $this->appointment->doctor->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'appointment.requested';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->appointment->id,
            'patient_name' => $this->appointment->patient->user->name,
            'appointment_date' => $this->appointment->appointment_date->format('Y-m-d'),
            'appointment_time' => $this->appointment->appointment_time,
            'type' => $this->appointment->type,
            'message' => 'New appointment request from ' . $this->appointment->patient->user->name,
        ];
    }
}

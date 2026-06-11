<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClaimResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'claim_number' => $this->claim_number,
            'title' => $this->title,
            'description' => $this->description,
            'amount' => $this->amount,
            'status' => $this->status,
            'version' => $this->version,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'activity_logs' => $this->whenLoaded('activityLogs', function () {
                return $this->activityLogs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'actor_name' => $log->actor_name,
                        'actor_role' => $log->actor_role,
                        'from_status' => $log->from_status,
                        'to_status' => $log->to_status,
                        'note' => $log->note,
                        'created_at' => $log->created_at?->toIso8601String(),
                    ];
                });
            })
        ];
    }
}

<?php

namespace App\Listeners;

use App\Events\ClaimStatusChanged;
use App\Models\ClaimActivityLog;

class CreateClaimActivityLog
{
    public function handle(ClaimStatusChanged $event): void
    {
        $role = $event->user->roles->first()?->name ?? 'unknown';

        ClaimActivityLog::create([
            'claim_id' => $event->claim->id,
            'user_id' => $event->user->id,
            'actor_name' => $event->user->name,
            'actor_role' => $role,
            'from_status' => $event->fromStatus,
            'to_status' => $event->toStatus,
            'note' => $event->note
        ]);
    }
}

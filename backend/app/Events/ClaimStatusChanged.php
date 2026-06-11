<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Claim;
use App\Models\User;

class ClaimStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Claim $claim,
        public User $user,
        public ?string $fromStatus,
        public string $toStatus,
        public ?string $note
    ) {}
}

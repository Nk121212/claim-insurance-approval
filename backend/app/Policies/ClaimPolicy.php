<?php

namespace App\Policies;

use App\Models\Claim;
use App\Models\User;

class ClaimPolicy
{
    public function view(User $user, Claim $claim): bool
    {
        if ($user->hasRole('user')) {
            return $user->id === $claim->user_id;
        }
        if ($user->hasRole('verifier')) {
            return in_array($claim->status, ['submitted', 'reviewed', 'approved', 'rejected']);
        }
        if ($user->hasRole('approver')) {
            return in_array($claim->status, ['reviewed', 'approved', 'rejected']);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('user');
    }

    public function update(User $user, Claim $claim): bool
    {
        return $user->hasRole('user') && $user->id === $claim->user_id && $claim->status === 'draft';
    }

    public function review(User $user): bool
    {
        return $user->hasRole('verifier');
    }

    public function approve(User $user): bool
    {
        return $user->hasRole('approver');
    }
}

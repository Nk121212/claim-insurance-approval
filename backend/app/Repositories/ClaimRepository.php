<?php

namespace App\Repositories;

use App\Models\Claim;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ClaimRepository implements ClaimRepositoryInterface
{
    public function getAllClaims(): Collection
    {
        return Claim::with('user')->orderBy('created_at', 'desc')->get();
    }

    public function getClaimsByUser(int $userId): Collection
    {
        return Claim::where('user_id', $userId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getClaimsByStatus(string $status): Collection
    {
        return Claim::where('status', $status)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findById(int $id): ?Claim
    {
        return Claim::with(['user', 'activityLogs.user'])->find($id);
    }

    public function create(array $data): Claim
    {
        return Claim::create($data);
    }

    public function update(Claim $claim, array $data): bool
    {
        return $claim->update($data);
    }

    public function generateClaimNumber(): string
    {
        $datePrefix = 'CLM-' . now()->format('Ymd') . '-';
        
        $lastClaim = Claim::where('claim_number', 'like', $datePrefix . '%')
            ->lockForUpdate()
            ->orderBy('claim_number', 'desc')
            ->first();
            
        if ($lastClaim) {
            $lastSequence = (int) substr($lastClaim->claim_number, -4);
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }
        
        return $datePrefix . str_pad((string)$nextSequence, 4, '0', STR_PAD_LEFT);
    }
}

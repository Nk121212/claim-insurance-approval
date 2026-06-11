<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\User;
use App\Events\ClaimStatusChanged;
use App\Repositories\ClaimRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Exception;

class ClaimService
{
    public function __construct(private ClaimRepositoryInterface $claimRepository)
    {}

    public function createClaim(array $data, int $userId): Claim
    {
        return DB::transaction(function () use ($data, $userId) {
            $claimNumber = $this->claimRepository->generateClaimNumber();
            
            $claimData = [
                ...$data,
                'user_id' => $userId,
                'claim_number' => $claimNumber,
                'status' => 'draft',
                'version' => 1
            ];

            $claim = $this->claimRepository->create($claimData);
            $user = User::find($userId);

            ClaimStatusChanged::dispatch($claim, $user, null, 'draft', 'Claim created');

            return $claim;
        });
    }

    public function submitClaim(int $claimId, int $userId, int $expectedVersion): Claim
    {
        return $this->updateClaimStatus($claimId, $userId, $expectedVersion, 'submitted', [
            'draft'
        ], 'submitted_at');
    }

    public function reviewClaim(int $claimId, int $userId, int $expectedVersion, ?string $note = null): Claim
    {
        return $this->updateClaimStatus($claimId, $userId, $expectedVersion, 'reviewed', [
            'submitted'
        ], 'reviewed_at', $note);
    }

    public function approveClaim(int $claimId, int $userId, int $expectedVersion, ?string $note = null): Claim
    {
        return $this->updateClaimStatus($claimId, $userId, $expectedVersion, 'approved', [
            'reviewed'
        ], 'approved_at', $note);
    }

    public function rejectClaim(int $claimId, int $userId, int $expectedVersion, ?string $note = null): Claim
    {
        return $this->updateClaimStatus($claimId, $userId, $expectedVersion, 'rejected', [
            'reviewed'
        ], 'rejected_at', $note);
    }

    private function updateClaimStatus(
        int $claimId, 
        int $userId, 
        int $expectedVersion, 
        string $newStatus, 
        array $allowedFromStatuses, 
        ?string $timestampField = null,
        ?string $note = null
    ): Claim {
        return DB::transaction(function () use ($claimId, $userId, $expectedVersion, $newStatus, $allowedFromStatuses, $timestampField, $note) {
            $claim = $this->claimRepository->findById($claimId);

            if (!$claim) {
                throw new Exception('Claim not found.');
            }

            if ($claim->version !== $expectedVersion) {
                throw new ConflictHttpException('Race condition detected. The claim was updated by another user.');
            }

            if (!in_array($claim->status, $allowedFromStatuses)) {
                throw new Exception("Invalid status transition from {$claim->status} to {$newStatus}.");
            }

            $updateData = [
                'status' => $newStatus,
                'version' => $expectedVersion + 1
            ];

            if ($timestampField) {
                $updateData[$timestampField] = now();
            }

            $originalStatus = $claim->getOriginal('status');

            // Optimistic locking
            $updated = Claim::where('id', $claimId)
                ->where('version', $expectedVersion)
                ->update($updateData);

            if (!$updated) {
                throw new ConflictHttpException('Race condition detected. The claim was updated by another user.');
            }

            // Re-fetch to get updated attributes
            $claim->refresh();
            $user = User::find($userId);

            ClaimStatusChanged::dispatch($claim, $user, $originalStatus, $newStatus, $note);

            return $claim;
        });
    }
}

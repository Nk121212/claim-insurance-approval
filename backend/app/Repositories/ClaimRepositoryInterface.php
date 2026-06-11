<?php

namespace App\Repositories;

use App\Models\Claim;
use Illuminate\Database\Eloquent\Collection;

interface ClaimRepositoryInterface
{
    public function getAllClaims(): Collection;
    public function getClaimsByUser(int $userId): Collection;
    public function getClaimsByStatus(string $status): Collection;
    public function findById(int $id): ?Claim;
    public function create(array $data): Claim;
    public function update(Claim $claim, array $data): bool;
    public function generateClaimNumber(): string;
}

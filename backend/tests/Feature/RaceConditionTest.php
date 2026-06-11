<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Claim;
use Database\Seeders\RoleAndUserSeeder;

class RaceConditionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
    }

    public function test_race_condition_on_review()
    {
        $user = User::where('email', 'user@example.com')->first();
        $verifier = User::where('email', 'verifier@example.com')->first();
        $verifier2 = User::factory()->create();
        $verifier2->assignRole('verifier');

        $claimResponse = $this->actingAs($user)->postJson('/api/claims', [
            'title' => 'Medical Expense',
            'description' => 'Hospital bill',
            'amount' => 150.50,
        ]);

        $claimId = $claimResponse->json('data.id');
        
        $submitResponse = $this->actingAs($user)->postJson("/api/claims/{$claimId}/submit", [
            'version' => $claimResponse->json('data.version')
        ]);

        $currentVersion = $submitResponse->json('data.version');

        // Simulate concurrent review by sending the same version twice
        // Verifier 1 reviews
        $response1 = $this->actingAs($verifier)->postJson("/api/claims/{$claimId}/review", [
            'version' => $currentVersion,
            'note' => 'Looks good'
        ]);

        // Verifier 2 reviews with the same old version
        $response2 = $this->actingAs($verifier2)->postJson("/api/claims/{$claimId}/review", [
            'version' => $currentVersion,
            'note' => 'I think it looks good too'
        ]);

        $response1->assertStatus(200);
        $response2->assertStatus(409)
                  ->assertJsonPath('message', 'Race condition detected. The claim was updated by another user.');
    }

    public function test_claim_number_uniqueness_concurrent()
    {
        // SQLite doesn't easily allow testing real DB locking concurrency in same PHPUnit process.
        // But we can test that generateClaimNumber works sequentially correctly.
        $repo = app(\App\Repositories\ClaimRepositoryInterface::class);
        
        $num1 = $repo->generateClaimNumber();
        \App\Models\Claim::factory()->create(['claim_number' => $num1]);
        
        $num2 = $repo->generateClaimNumber();
        \App\Models\Claim::factory()->create(['claim_number' => $num2]);

        $this->assertNotEquals($num1, $num2);
        $this->assertStringEndsWith('0001', $num1);
        $this->assertStringEndsWith('0002', $num2);
    }
}

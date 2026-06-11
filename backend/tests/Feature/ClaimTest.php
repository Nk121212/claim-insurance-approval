<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Claim;
use Spatie\Permission\Models\Role;
use Database\Seeders\RoleAndUserSeeder;

class ClaimTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
    }

    public function test_login()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_create_claim()
    {
        $user = User::where('email', 'user@example.com')->first();

        $response = $this->actingAs($user)->postJson('/api/claims', [
            'title' => 'Medical Expense',
            'description' => 'Hospital bill for fever',
            'amount' => 150.50,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.title', 'Medical Expense')
                 ->assertJsonPath('data.status', 'draft');
    }

    public function test_submit_claim()
    {
        $user = User::where('email', 'user@example.com')->first();

        $claimResponse = $this->actingAs($user)->postJson('/api/claims', [
            'title' => 'Medical Expense',
            'description' => 'Hospital bill for fever',
            'amount' => 150.50,
        ]);

        $claimId = $claimResponse->json('data.id');
        $version = $claimResponse->json('data.version');

        $response = $this->actingAs($user)->postJson("/api/claims/{$claimId}/submit", [
            'version' => $version
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'submitted');
    }

    public function test_review_claim()
    {
        $user = User::where('email', 'user@example.com')->first();
        $verifier = User::where('email', 'verifier@example.com')->first();

        $claimResponse = $this->actingAs($user)->postJson('/api/claims', [
            'title' => 'Medical Expense',
            'description' => 'Hospital bill',
            'amount' => 150.50,
        ]);

        $claimId = $claimResponse->json('data.id');
        
        $submitResponse = $this->actingAs($user)->postJson("/api/claims/{$claimId}/submit", [
            'version' => $claimResponse->json('data.version')
        ]);

        $response = $this->actingAs($verifier)->postJson("/api/claims/{$claimId}/review", [
            'version' => $submitResponse->json('data.version'),
            'note' => 'Looks good'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'reviewed');
    }

    public function test_approve_claim()
    {
        $user = User::where('email', 'user@example.com')->first();
        $verifier = User::where('email', 'verifier@example.com')->first();
        $approver = User::where('email', 'approver@example.com')->first();

        $claim = $this->actingAs($user)->postJson('/api/claims', [
            'title' => 'Medical Expense',
            'description' => 'Hospital bill',
            'amount' => 150.50,
        ]);

        $claimId = $claim->json('data.id');
        
        $submitted = $this->actingAs($user)->postJson("/api/claims/{$claimId}/submit", [
            'version' => $claim->json('data.version')
        ]);

        $reviewed = $this->actingAs($verifier)->postJson("/api/claims/{$claimId}/review", [
            'version' => $submitted->json('data.version'),
            'note' => 'Looks good'
        ]);

        $response = $this->actingAs($approver)->postJson("/api/claims/{$claimId}/approve", [
            'version' => $reviewed->json('data.version'),
            'note' => 'Approved'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'approved');
    }

    public function test_reject_claim()
    {
        $user = User::where('email', 'user@example.com')->first();
        $verifier = User::where('email', 'verifier@example.com')->first();
        $approver = User::where('email', 'approver@example.com')->first();

        $claim = $this->actingAs($user)->postJson('/api/claims', [
            'title' => 'Medical Expense',
            'description' => 'Hospital bill',
            'amount' => 150.50,
        ]);

        $claimId = $claim->json('data.id');
        
        $submitted = $this->actingAs($user)->postJson("/api/claims/{$claimId}/submit", [
            'version' => $claim->json('data.version')
        ]);

        $reviewed = $this->actingAs($verifier)->postJson("/api/claims/{$claimId}/review", [
            'version' => $submitted->json('data.version'),
            'note' => 'Looks good'
        ]);

        $response = $this->actingAs($approver)->postJson("/api/claims/{$claimId}/reject", [
            'version' => $reviewed->json('data.version'),
            'note' => 'Rejected due to missing details'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'rejected');
    }
}

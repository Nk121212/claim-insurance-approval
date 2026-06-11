<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class RoleAndUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $userRole = Role::create(['name' => 'user']);
        $verifierRole = Role::create(['name' => 'verifier']);
        $approverRole = Role::create(['name' => 'approver']);

        // Create Permissions
        $createClaim = Permission::create(['name' => 'create claim']);
        $viewOwnClaims = Permission::create(['name' => 'view own claims']);
        $viewSubmittedClaims = Permission::create(['name' => 'view submitted claims']);
        $reviewClaim = Permission::create(['name' => 'review claim']);
        $viewReviewedClaims = Permission::create(['name' => 'view reviewed claims']);
        $approveClaim = Permission::create(['name' => 'approve claim']);
        $rejectClaim = Permission::create(['name' => 'reject claim']);

        $userRole->givePermissionTo([$createClaim, $viewOwnClaims]);
        $verifierRole->givePermissionTo([$viewSubmittedClaims, $reviewClaim]);
        $approverRole->givePermissionTo([$viewReviewedClaims, $approveClaim, $rejectClaim]);

        // Create demo users
        $user = User::factory()->create([
            'name' => 'Demo User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($userRole);

        $verifier = User::factory()->create([
            'name' => 'Demo Verifier',
            'email' => 'verifier@example.com',
            'password' => Hash::make('password'),
        ]);
        $verifier->assignRole($verifierRole);

        $approver = User::factory()->create([
            'name' => 'Demo Approver',
            'email' => 'approver@example.com',
            'password' => Hash::make('password'),
        ]);
        $approver->assignRole($approverRole);
    }
}

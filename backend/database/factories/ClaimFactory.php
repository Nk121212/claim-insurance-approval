<?php

namespace Database\Factories;

use App\Models\Claim;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Claim>
 */
class ClaimFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'claim_number' => 'CLM-' . now()->format('Ymd') . '-' . $this->faker->unique()->numerify('####'),
            'title' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'amount' => $this->faker->randomFloat(2, 10, 1000),
            'status' => 'draft',
            'version' => 1,
        ];
    }
}

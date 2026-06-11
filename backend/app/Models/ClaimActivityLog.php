<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClaimActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'claim_id',
        'user_id',
        'actor_name',
        'actor_role',
        'from_status',
        'to_status',
        'note',
    ];

    public function claim()
    {
        return $this->belongsTo(Claim::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\DashboardController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::apiResource('claims', ClaimController::class)->except(['destroy']);
    // PUT /api/claims/{id}  -- Wait, requirement says PUT /api/claims/{id} and POST /api/claims/{id}/submit
    // Wait, the requirement:
    // PUT    /api/claims/{id} (For updating draft? But rule says draft->submitted is submit. I'll just route submit to PUT or POST)
    // POST   /api/claims/{id}/submit
    Route::post('/claims/{id}/submit', [ClaimController::class, 'submit']);
    Route::post('/claims/{id}/review', [ClaimController::class, 'review']);
    Route::post('/claims/{id}/approve', [ClaimController::class, 'approve']);
    Route::post('/claims/{id}/reject', [ClaimController::class, 'reject']);
    Route::get('/claims/{id}/activities', [ClaimController::class, 'activities']);
});

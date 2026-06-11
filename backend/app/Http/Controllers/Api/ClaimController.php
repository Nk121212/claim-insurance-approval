<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClaimRequest;
use App\Http\Resources\ClaimResource;
use App\Services\ClaimService;
use App\Repositories\ClaimRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Exception;

class ClaimController extends Controller
{
    public function __construct(
        private ClaimService $claimService,
        private ClaimRepositoryInterface $claimRepository
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('user')) {
            $claims = $this->claimRepository->getClaimsByUser($user->id);
        } elseif ($user->hasRole('verifier')) {
            $claims = $this->claimRepository->getClaimsByStatus('submitted');
        } elseif ($user->hasRole('approver')) {
            $claims = $this->claimRepository->getClaimsByStatus('reviewed');
        } else {
            $claims = $this->claimRepository->getAllClaims();
        }

        return ClaimResource::collection($claims);
    }

    public function store(StoreClaimRequest $request)
    {
        $claim = $this->claimService->createClaim($request->validated(), $request->user()->id);
        
        return new ClaimResource($claim);
    }

    public function update(StoreClaimRequest $request, int $id)
    {
        $claim = $this->claimRepository->findById($id);

        if (!$claim) {
            return response()->json(['message' => 'Claim not found'], 404);
        }

        Gate::authorize('update', $claim);
        
        $this->claimRepository->update($claim, $request->validated());

        return new ClaimResource($claim);
    }

    public function show(Request $request, int $id)
    {
        $claim = $this->claimRepository->findById($id);

        if (!$claim) {
            return response()->json(['message' => 'Claim not found'], 404);
        }

        Gate::authorize('view', $claim);

        return new ClaimResource($claim);
    }

    public function submit(Request $request, int $id)
    {
        $request->validate(['version' => 'required|integer']);
        
        $claim = $this->claimRepository->findById($id);
        if (!$claim) return response()->json(['message' => 'Claim not found'], 404);
        
        Gate::authorize('update', $claim);

        try {
            $updatedClaim = $this->claimService->submitClaim($id, $request->user()->id, $request->version);
            return new ClaimResource($updatedClaim);
        } catch (ConflictHttpException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function review(Request $request, int $id)
    {
        Gate::authorize('review', \App\Models\Claim::class);
        $request->validate(['version' => 'required|integer', 'note' => 'nullable|string']);

        try {
            $updatedClaim = $this->claimService->reviewClaim($id, $request->user()->id, $request->version, $request->note);
            return new ClaimResource($updatedClaim);
        } catch (ConflictHttpException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function approve(Request $request, int $id)
    {
        Gate::authorize('approve', \App\Models\Claim::class);
        $request->validate(['version' => 'required|integer', 'note' => 'nullable|string']);

        try {
            $updatedClaim = $this->claimService->approveClaim($id, $request->user()->id, $request->version, $request->note);
            return new ClaimResource($updatedClaim);
        } catch (ConflictHttpException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function reject(Request $request, int $id)
    {
        Gate::authorize('approve', \App\Models\Claim::class);
        $request->validate(['version' => 'required|integer', 'note' => 'nullable|string']);

        try {
            $updatedClaim = $this->claimService->rejectClaim($id, $request->user()->id, $request->version, $request->note);
            return new ClaimResource($updatedClaim);
        } catch (ConflictHttpException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function activities(int $id)
    {
        $claim = $this->claimRepository->findById($id);
        
        if (!$claim) {
            return response()->json(['message' => 'Claim not found'], 404);
        }
        
        Gate::authorize('view', $claim);
        
        return response()->json([
            'data' => $claim->activityLogs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'actor_name' => $log->actor_name,
                    'actor_role' => $log->actor_role,
                    'from_status' => $log->from_status,
                    'to_status' => $log->to_status,
                    'note' => $log->note,
                    'created_at' => $log->created_at?->toIso8601String(),
                ];
            })
        ]);
    }
}

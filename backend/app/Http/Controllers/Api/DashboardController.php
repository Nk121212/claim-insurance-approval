<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Claim;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $role = $user->roles->first()?->name ?? 'user';

        if ($role === 'user') {
            $total = Claim::where('user_id', $user->id)->count();
            $draft = Claim::where('user_id', $user->id)->where('status', 'draft')->count();
            $submitted = Claim::where('user_id', $user->id)->where('status', 'submitted')->count();
            
            $statusCounts = Claim::select('status', DB::raw('count(*) as total'))
                ->where('user_id', $user->id)
                ->groupBy('status')
                ->get()
                ->pluck('total', 'status')->toArray();

            return response()->json([
                'total_claims' => $total,
                'draft_claims' => $draft,
                'submitted_claims' => $submitted,
                'chart_data' => $this->formatChartData($statusCounts, ['draft', 'submitted', 'reviewed', 'approved', 'rejected'])
            ]);
        } elseif ($role === 'verifier') {
            $pendingReview = Claim::where('status', 'submitted')->count();
            
            // Weekly chart
            $weekly = Claim::select(DB::raw('DATE(submitted_at) as date'), DB::raw('count(*) as total'))
                ->where('status', 'submitted')
                ->whereNotNull('submitted_at')
                ->where('submitted_at', '>=', now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date')
                ->get();
                
            return response()->json([
                'pending_review' => $pendingReview,
                'chart_data' => $weekly->map(function ($item) {
                    return ['name' => $item->date, 'total' => $item->total];
                })
            ]);
        } elseif ($role === 'approver') {
            $pendingApproval = Claim::where('status', 'reviewed')->count();
            
            $approved = Claim::where('status', 'approved')->count();
            $rejected = Claim::where('status', 'rejected')->count();

            return response()->json([
                'pending_approval' => $pendingApproval,
                'chart_data' => [
                    ['name' => 'Approved', 'total' => $approved],
                    ['name' => 'Rejected', 'total' => $rejected],
                ]
            ]);
        }

        return response()->json(['message' => 'Unauthorized role'], 403);
    }
    
    private function formatChartData($counts, $statuses)
    {
        $data = [];
        foreach ($statuses as $status) {
            $data[] = [
                'name' => ucfirst($status),
                'total' => $counts[$status] ?? 0
            ];
        }
        return $data;
    }
}

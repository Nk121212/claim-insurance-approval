'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
        draft: { label: 'Draft', variant: 'secondary' },
        submitted: { label: 'Submitted', variant: 'outline' },
        reviewed: { label: 'Reviewed', variant: 'default' },
        approved: { label: 'Approved', variant: 'success' },
        rejected: { label: 'Rejected', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };

    return (
        <Badge variant={config.variant === 'success' ? 'default' : config.variant as any} className={config.variant === 'success' ? 'bg-green-500 hover:bg-green-600' : config.variant === 'outline' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}>
            {config.label}
        </Badge>
    );
};

export default function ClaimsPage() {
    const { user } = useAuthStore();
    const role = user?.role || 'user';

    const { data: claims, isLoading } = useQuery({
        queryKey: ['claims'],
        queryFn: async () => {
            const response = await api.get('/api/claims');
            return response.data.data;
        }
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Claims</h1>
                {role === 'user' && (
                    <Link href="/claims/new" className={buttonVariants({})}>Create Claim</Link>
                )}
            </div>

            <div className="border rounded-md bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                            <TableHead>Claim Number</TableHead>
                            <TableHead>Title</TableHead>
                            {role !== 'user' && <TableHead>Requester</TableHead>}
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {claims?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={role !== 'user' ? 7 : 6} className="text-center py-8 text-slate-500">
                                    No claims found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            claims?.map((claim: any) => (
                                <TableRow key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{claim.claim_number}</TableCell>
                                    <TableCell>{claim.title}</TableCell>
                                    {role !== 'user' && <TableCell>{claim.user?.name}</TableCell>}
                                    <TableCell>${parseFloat(claim.amount).toFixed(2)}</TableCell>
                                    <TableCell><StatusBadge status={claim.status} /></TableCell>
                                    <TableCell className="text-slate-500">
                                        {format(new Date(claim.created_at), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/claims/${claim.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                            View Details
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

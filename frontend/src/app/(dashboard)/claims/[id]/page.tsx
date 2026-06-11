'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { CheckCircle2, Circle, Clock, FileEdit, XCircle } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
        draft: { label: 'Draft', variant: 'secondary' },
        submitted: { label: 'Diajukan', variant: 'outline' },
        reviewed: { label: 'Direview', variant: 'default' },
        approved: { label: 'Disetujui', variant: 'success' },
        rejected: { label: 'Ditolak', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };

    return (
        <Badge variant={config.variant === 'success' ? 'default' : config.variant as any} className={config.variant === 'success' ? 'bg-green-500 hover:bg-green-600' : config.variant === 'outline' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}>
            {config.label}
        </Badge>
    );
};

export default function ClaimDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const role = user?.role || 'user';
    
    const [note, setNote] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'submit' | 'review' | 'approve' | 'reject' | null>(null);

    const { data: claim, isLoading } = useQuery({
        queryKey: ['claim', id],
        queryFn: async () => {
            const response = await api.get(`/api/claims/${id}`);
            return response.data.data;
        }
    });

    const { data: activities } = useQuery({
        queryKey: ['claim_activities', id],
        queryFn: async () => {
            const response = await api.get(`/api/claims/${id}/activities`);
            return response.data.data;
        },
        enabled: !!claim
    });

    const actionMutation = useMutation({
        mutationFn: async ({ action, noteData }: { action: string, noteData?: string }) => {
            const payload: any = { version: claim.version };
            if (noteData) payload.note = noteData;
            
            const response = await api.post(`/api/claims/${id}/${action}`, payload);
            return response.data.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['claim', id] });
            queryClient.invalidateQueries({ queryKey: ['claim_activities', id] });
            queryClient.invalidateQueries({ queryKey: ['claims'] });
            toast.success(`Klaim berhasil di${variables.action === 'submit' ? 'ajukan' : variables.action === 'review' ? 'review' : variables.action === 'approve' ? 'setujui' : 'tolak'}!`);
            setDialogOpen(false);
            setNote('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Aksi gagal');
            if (error.response?.status === 409) {
                // Refresh data to get latest version if race condition
                queryClient.invalidateQueries({ queryKey: ['claim', id] });
                queryClient.invalidateQueries({ queryKey: ['claim_activities', id] });
            }
        }
    });

    if (isLoading) return <div>Memuat...</div>;
    if (!claim) return <div>Klaim tidak ditemukan</div>;

    const handleAction = (action: 'submit' | 'review' | 'approve' | 'reject') => {
        setActionType(action);
        if (action === 'submit') {
            // Submit doesn't require a note, just execute immediately
            actionMutation.mutate({ action });
        } else {
            setDialogOpen(true);
        }
    };

    const confirmAction = () => {
        if (actionType) {
            actionMutation.mutate({ action: actionType, noteData: note });
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'draft': return <FileEdit className="w-5 h-5 text-slate-400" />;
            case 'submitted': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'reviewed': return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
            case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Circle className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => router.back()} size="sm">Kembali</Button>
                    <h1 className="text-2xl font-bold tracking-tight">{claim.claim_number}</h1>
                    <StatusBadge status={claim.status} />
                </div>
                
                <div className="flex space-x-2">
                    {role === 'user' && claim.status === 'draft' && (
                        <Button onClick={() => handleAction('submit')} disabled={actionMutation.isPending}>
                            Ajukan Klaim
                        </Button>
                    )}
                    
                    {role === 'verifier' && claim.status === 'submitted' && (
                        <Button onClick={() => handleAction('review')} disabled={actionMutation.isPending}>
                            Review Klaim
                        </Button>
                    )}
                    
                    {role === 'approver' && claim.status === 'reviewed' && (
                        <>
                            <Button variant="destructive" onClick={() => handleAction('reject')} disabled={actionMutation.isPending}>
                                Tolak
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve')} disabled={actionMutation.isPending}>
                                Setujui
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{claim.title}</CardTitle>
                            <CardDescription>
                                Diajukan oleh {claim.user.name} pada {format(new Date(claim.created_at), 'PPP')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Deskripsi</h3>
                                <p className="text-slate-900 whitespace-pre-wrap">{claim.description}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Jumlah</h3>
                                <p className="text-2xl font-bold text-slate-900">${parseFloat(claim.amount).toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Riwayat Aktivitas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {activities?.map((activity: any, index: number) => (
                                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                                            {getStatusIcon(activity.to_status)}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded border shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{activity.to_status === 'draft' ? 'Dibuat' : activity.to_status === 'submitted' ? 'Diajukan' : activity.to_status === 'reviewed' ? 'Direview' : activity.to_status === 'approved' ? 'Disetujui' : 'Ditolak'}</div>
                                                <time className="text-xs font-medium text-slate-500">{format(new Date(activity.created_at), 'MMM d, HH:mm')}</time>
                                            </div>
                                            <div className="text-sm text-slate-500 mb-1">Oleh {activity.actor_name} ({activity.actor_role})</div>
                                            {activity.note && (
                                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded mt-2 italic">
                                                    &quot;{activity.note}&quot;
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="capitalize">{actionType === 'submit' ? 'Ajukan' : actionType === 'review' ? 'Review' : actionType === 'approve' ? 'Setujui' : 'Tolak'} Klaim</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin {actionType === 'submit' ? 'mengajukan' : actionType === 'review' ? 'mereview' : actionType === 'approve' ? 'menyetujui' : 'menolak'} klaim ini? Anda dapat menambahkan catatan opsional di bawah ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Tambahkan catatan opsional..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button 
                            variant={actionType === 'reject' ? 'destructive' : 'default'} 
                            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={confirmAction}
                            disabled={actionMutation.isPending || (actionType === 'reject' && !note.trim())}
                        >
                            {actionMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

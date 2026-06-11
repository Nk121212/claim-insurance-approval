'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const claimSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export default function CreateClaimPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(claimSchema),
        defaultValues: {
            title: '',
            description: '',
            amount: 0,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: ClaimFormValues) => {
            const response = await api.post('/api/claims', data);
            return response.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['claims'] });
            toast.success('Claim created successfully!');
            router.push(`/claims/${data.id}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create claim');
        },
    });

    const onSubmit = (data: ClaimFormValues) => {
        createMutation.mutate(data);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Claim</h1>
                    <p className="text-slate-500">Submit a new insurance claim request.</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Claim Details</CardTitle>
                    <CardDescription>Provide accurate information for your claim to speed up the approval process.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Medical Checkup Expense" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (USD)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value as any} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Please provide detailed information about the expense..." 
                                                className="min-h-[120px]"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

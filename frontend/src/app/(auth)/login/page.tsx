'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { setUser, setToken } = useAuthStore();
    const [error, setError] = useState('');

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginFormValues) => {
            const response = await api.post('/api/login', data);
            return response.data;
        },
        onSuccess: (data) => {
            setToken(data.token);
            setUser(data.user);
            router.push('/dashboard');
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to login');
        },
    });

    const onSubmit = (data: LoginFormValues) => {
        setError('');
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">PT AQ Business</h1>
                    <p className="text-slate-500 mt-2">Insurance Claim Approval System</p>
                </div>
                
                <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>Enter your email to access your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="name@example.com" {...field} disabled={loginMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} disabled={loginMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loginMutation.isPending}>
                                    {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-8 text-sm text-slate-500 border-t pt-4">
                            <p className="font-medium mb-2">Demo Accounts:</p>
                            <ul className="space-y-1">
                                <li>user@example.com / password</li>
                                <li>verifier@example.com / password</li>
                                <li>approver@example.com / password</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

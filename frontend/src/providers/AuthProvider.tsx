'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { token, setUser, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                if (pathname !== '/login') {
                    router.push('/login');
                }
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/api/me');
                setUser(response.data.user);
                
                if (pathname === '/login') {
                    router.push('/dashboard');
                }
            } catch (error) {
                logout();
                if (pathname !== '/login') {
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [token, pathname, router, setUser, logout]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>;
    }

    return <>{children}</>;
}

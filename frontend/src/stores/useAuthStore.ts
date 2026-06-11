import { create } from 'zustand';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_user') || 'null') : null,
    token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
    setUser: (user) => {
        if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('auth_user');
        }
        set({ user });
    },
    setToken: (token) => {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
        set({ token });
    },
    logout: () => {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
    },
}));

'use client';

import AuthProvider from '@/providers/AuthProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, FileText, PlusCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const role = user?.role || 'user';

    const getNavigation = () => {
        const nav = [
            { name: 'Dasbor', href: '/dashboard', icon: LayoutDashboard }
        ];

        if (role === 'user') {
            nav.push({ name: 'Buat Klaim', href: '/claims/new', icon: PlusCircle });
            nav.push({ name: 'Klaim Saya', href: '/claims', icon: FileText });
        } else if (role === 'verifier') {
            nav.push({ name: 'Klaim Masuk', href: '/claims', icon: FileText });
        } else if (role === 'approver') {
            nav.push({ name: 'Klaim Direview', href: '/claims', icon: FileText });
        }

        return nav;
    };

    return (
        <AuthProvider>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
                
                {/* Mobile overlay */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 font-bold text-lg text-blue-600 dark:text-blue-400">
                        AQ Claims
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="space-y-1 px-3">
                            {getNavigation().map((item) => {
                                const Icon = item.icon;
                                const isActive = item.href === '/claims' ? (pathname === '/claims' || (pathname.startsWith('/claims/') && !pathname.startsWith('/claims/new'))) : (pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard'));
                                return (
                                    <Link 
                                        key={item.name} 
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                                    >
                                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3 shrink-0">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
                        </Button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Mobile Topbar */}
                    <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-4 md:hidden shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </Button>
                        <span className="ml-4 font-bold text-lg text-blue-600 dark:text-blue-400">AQ Claims</span>
                    </div>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AuthProvider>
    );
}

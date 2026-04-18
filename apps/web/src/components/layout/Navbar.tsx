'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Rocket, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isMentor = user?.roles?.includes('mentor');
    const isAdmin = user?.roles?.includes('admin');
    const isMentee = user && !isMentor && !isAdmin;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <Rocket className="h-6 w-6 text-brand" />
                    <span className="text-xl font-bold tracking-tight text-slate-900">OWL Mentor</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:space-x-8">
                    <Link href="/browse" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Browse Mentors
                    </Link>
                    {!user && (
                        <Link href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                            How it works
                        </Link>
                    )}
                    {isMentor && (
                        <Link href="/onboarding" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                            My Profile
                        </Link>
                    )}
                    {isMentee && (
                        <>
                            <Link href="/mentee/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                My Sessions
                            </Link>
                            <Link href="/mentee/career" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Career Plan
                            </Link>
                        </>
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex md:items-center md:space-x-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <User className="h-4 w-4" />
                                <span>{user.name}</span>
                            </div>
                            {isAdmin && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin">Admin</Link>
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-1" />
                                Log out
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" className="text-slate-600 hover:text-slate-900" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button className="bg-brand text-white font-bold shadow-[0_0_15px_rgba(124,58,237,0.25)] transition-all hover:bg-brand-light hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]" asChild>
                                <Link href="/register">Find a Mentor</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="absolute left-0 w-full space-y-4 border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
                    <div className="flex flex-col space-y-4">
                        <Link href="/browse" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                            Browse Mentors
                        </Link>
                        {isMentor && (
                            <Link href="/onboarding" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                My Profile
                            </Link>
                        )}
                        {isMentee && (
                            <>
                                <Link href="/mentee/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                    My Sessions
                                </Link>
                                <Link href="/mentee/career" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                    Career Plan
                                </Link>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col space-y-2 pt-4 border-t border-slate-100">
                        {user ? (
                            <>
                                <div className="text-sm text-slate-600 py-2">{user.name} ({user.email})</div>
                                {isAdmin && (
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/admin" onClick={toggleMenu}>Admin Panel</Link>
                                    </Button>
                                )}
                                <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={() => { handleLogout(); toggleMenu(); }}>
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" className="justify-start px-0 text-slate-600" asChild>
                                    <Link href="/login" onClick={toggleMenu}>Log in</Link>
                                </Button>
                                <Button className="w-full bg-brand font-bold text-white hover:bg-brand-light" asChild>
                                    <Link href="/register" onClick={toggleMenu}>Find a Mentor</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

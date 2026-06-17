'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut, User, Search } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

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
    const pathname = usePathname();
    const onBrowse = pathname === '/browse';

    return (
        <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-amber-100/80 bg-[#f7f2e8]/90 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <BrandLogo
                        markClassName="h-16 w-16"
                        wordmarkClassName="text-[0.92rem] tracking-[0.22em]"
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:space-x-6">
                    {!user && (
                        <>
                            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                About Us
                            </Link>
                            <Link href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                How It Works
                            </Link>
                            <Link href="/register" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Become a Mentor
                            </Link>
                        </>
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
                                AI Career Plan
                            </Link>
                            <Link href="/mentee/dashboard/messages" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Messages
                            </Link>
                        </>
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex md:items-center md:gap-3">
                    {!user && (
                        <Button
                            asChild
                            size="sm"
                            className={cn(
                                'gap-1.5 rounded-full px-4 font-semibold transition-all',
                                onBrowse
                                    ? 'bg-brand/10 text-brand border border-brand/30 shadow-none hover:bg-brand/15'
                                    : 'bg-brand text-white shadow-[0_0_16px_rgba(160,120,48,0.3)] hover:bg-brand-light'
                            )}
                        >
                            <Link href="/browse">
                                <Search className="h-3.5 w-3.5" />
                                Find a Mentor
                            </Link>
                        </Button>
                    )}
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
                        <Button variant="ghost" className="text-slate-600 hover:text-slate-900" asChild>
                            <Link href="/login">Log in</Link>
                        </Button>
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
                <div className="absolute left-0 w-full space-y-4 border-t border-amber-100/80 bg-[#f7f2e8] px-4 py-4 shadow-lg md:hidden">
                    <div className="flex flex-col space-y-4">
                        {!user && (
                            <>
                                <Button
                                    asChild
                                    className="w-full gap-2 rounded-full bg-brand text-white shadow-[0_0_16px_rgba(160,120,48,0.3)] hover:bg-brand-light"
                                    onClick={toggleMenu}
                                >
                                    <Link href="/browse">
                                        <Search className="h-4 w-4" />
                                        Find a Mentor
                                    </Link>
                                </Button>
                                <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                    About Us
                                </Link>
                                <Link href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                    How It Works
                                </Link>
                                <Link href="/register" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                    Become a Mentor
                                </Link>
                            </>
                        )}
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
                                    AI Career Plan
                                </Link>
                                <Link href="/mentee/dashboard/messages" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={toggleMenu}>
                                    Messages
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
                            <Button variant="ghost" className="justify-start px-0 text-slate-600" asChild>
                                <Link href="/login" onClick={toggleMenu}>Log in</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

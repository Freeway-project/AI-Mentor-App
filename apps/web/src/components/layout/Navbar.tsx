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

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <Rocket className="h-6 w-6 text-amber-500" />
                    <span className="text-xl font-bold tracking-tight text-white">OWLMentors</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:space-x-8">
                    <Link
                        href="/browse"
                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Browse Mentors
                    </Link>
                    {!user && (
                        <>
                            <Link
                                href="#how-it-works"
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                How it works
                            </Link>
                        </>
                    )}
                    {isMentor && (
                        <Link
                            href="/onboarding"
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            My Profile
                        </Link>
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex md:items-center md:space-x-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <User className="h-4 w-4" />
                                <span>{user.name}</span>
                            </div>
                            {isAdmin && (
                                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                                    <Link href="/admin">Admin</Link>
                                </Button>
                            )}
                            {!isMentor && !isAdmin && (
                                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                                    <Link href="/onboarding">Become a Mentor</Link>
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-1" />
                                Log out
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]" asChild>
                                <Link href="/mentee/signup">Find a Mentor</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-4 shadow-lg absolute w-full left-0">
                    <div className="flex flex-col space-y-4">
                        <Link
                            href="/browse"
                            className="text-sm font-medium text-slate-300 hover:text-white"
                            onClick={toggleMenu}
                        >
                            Browse Mentors
                        </Link>
                        {isMentor && (
                            <Link
                                href="/onboarding"
                                className="text-sm font-medium text-slate-300 hover:text-white"
                                onClick={toggleMenu}
                            >
                                My Profile
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-col space-y-2 pt-4 border-t border-slate-800">
                        {user ? (
                            <>
                                <div className="text-sm text-slate-300 py-2">{user.name} ({user.email})</div>
                                {isAdmin && (
                                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                                        <Link href="/admin" onClick={toggleMenu}>Admin Panel</Link>
                                    </Button>
                                )}
                                {!isMentor && !isAdmin && (
                                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                                        <Link href="/onboarding" onClick={toggleMenu}>
                                            Become a Mentor
                                        </Link>
                                    </Button>
                                )}
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => { handleLogout(); toggleMenu(); }}>
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" className="justify-start px-0 text-slate-300 hover:text-white hover:bg-slate-800" asChild>
                                    <Link href="/login" onClick={toggleMenu}>
                                        Log in
                                    </Link>
                                </Button>
                                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold" asChild>
                                    <Link href="/mentee/signup" onClick={toggleMenu}>
                                        Find a Mentor
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

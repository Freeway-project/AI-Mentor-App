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
        <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <Rocket className="h-6 w-6 text-blue-600" />
                    <span className="text-xl font-bold tracking-tight text-slate-900">OWLMentors</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:space-x-8">
                    <Link
                        href="/browse"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        Browse Mentors
                    </Link>
                    {!user && (
                        <>
                            <Link
                                href="#how-it-works"
                                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                            >
                                How it works
                            </Link>
                            <Link
                                href="#pricing"
                                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                            >
                                Pricing
                            </Link>
                        </>
                    )}
                    {isMentor && (
                        <Link
                            href="/onboarding"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            My Profile
                        </Link>
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
                            {!isMentor && !isAdmin && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/onboarding">Become a Mentor</Link>
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-1" />
                                Log out
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/mentee/signup">Find a Mentor</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-white px-4 py-4 space-y-4 shadow-lg absolute w-full left-0">
                    <div className="flex flex-col space-y-4">
                        <Link
                            href="/browse"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600"
                            onClick={toggleMenu}
                        >
                            Browse Mentors
                        </Link>
                        {isMentor && (
                            <Link
                                href="/onboarding"
                                className="text-sm font-medium text-slate-600 hover:text-blue-600"
                                onClick={toggleMenu}
                            >
                                My Profile
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-col space-y-2 pt-4 border-t">
                        {user ? (
                            <>
                                <div className="text-sm text-slate-600 py-2">{user.name} ({user.email})</div>
                                {isAdmin && (
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/admin" onClick={toggleMenu}>Admin Panel</Link>
                                    </Button>
                                )}
                                {!isMentor && !isAdmin && (
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/onboarding" onClick={toggleMenu}>
                                            Become a Mentor
                                        </Link>
                                    </Button>
                                )}
                                <Button variant="ghost" className="w-full justify-start" onClick={() => { handleLogout(); toggleMenu(); }}>
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" className="justify-start px-0" asChild>
                                    <Link href="/login" onClick={toggleMenu}>
                                        Log in
                                    </Link>
                                </Button>
                                <Button className="w-full" asChild>
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

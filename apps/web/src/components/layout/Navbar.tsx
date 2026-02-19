'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <Rocket className="h-6 w-6 text-blue-600" />
                    <span className="text-xl font-bold tracking-tight">OWLMentors</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:space-x-8">
                    <Link
                        href="#how-it-works"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        How it works
                    </Link>
                    <Link
                        href="#mentors"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        Browse Mentors
                    </Link>
                    <Link
                        href="#pricing"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="#faq"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        FAQ
                    </Link>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex md:items-center md:space-x-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Get Started</Link>
                    </Button>
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
                            href="#how-it-works"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600"
                            onClick={toggleMenu}
                        >
                            How it works
                        </Link>
                        <Link
                            href="#mentors"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600"
                            onClick={toggleMenu}
                        >
                            Browse Mentors
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600"
                            onClick={toggleMenu}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="#faq"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600"
                            onClick={toggleMenu}
                        >
                            FAQ
                        </Link>
                    </div>
                    <div className="flex flex-col space-y-2 pt-4 border-t">
                        <Button variant="ghost" className="justify-start px-0" asChild>
                            <Link href="/login" onClick={toggleMenu}>
                                Log in
                            </Link>
                        </Button>
                        <Button className="w-full" asChild>
                            <Link href="/register" onClick={toggleMenu}>
                                Get Started
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}

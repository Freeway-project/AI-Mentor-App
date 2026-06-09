import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16 relative z-10">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <BrandLogo
                                markClassName="h-10 w-10"
                                wordmarkClassName="text-sm tracking-[0.24em]"
                            />
                        </Link>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Connect with expert mentors to accelerate your career and personal growth.
                            Vetted experts, on-demand sessions.
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                            Platform
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/browse" className="transition-colors hover:text-brand">Browse Mentors</Link></li>
                            <li><Link href="/mentee/career" className="transition-colors hover:text-brand">AI Career Plan</Link></li>
                            <li><Link href="/how-it-works" className="transition-colors hover:text-brand">How it Works</Link></li>
                            <li><Link href="/login" className="transition-colors hover:text-brand">Log In</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                            Company
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/about" className="transition-colors hover:text-brand">About Us</Link></li>
                            <li><Link href="/careers" className="transition-colors hover:text-brand">Careers</Link></li>
                            <li><Link href="/blog" className="transition-colors hover:text-brand">Blog</Link></li>
                            <li><Link href="/contact" className="transition-colors hover:text-brand">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                            Legal
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/terms" className="transition-colors hover:text-brand">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="transition-colors hover:text-brand">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="transition-colors hover:text-brand">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between space-y-4 border-t border-slate-100 pt-8 md:flex-row md:space-y-0">
                    <p className="text-sm text-slate-400">
                        © {new Date().getFullYear()} OWL Mentor by Jaddpi. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link href="#" className="text-slate-400 transition-colors hover:text-brand">
                            <span className="sr-only">GitHub</span>
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 transition-colors hover:text-brand">
                            <span className="sr-only">Twitter</span>
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 transition-colors hover:text-brand">
                            <span className="sr-only">LinkedIn</span>
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

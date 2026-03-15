import Link from 'next/link';
import { Rocket, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-slate-800/60 bg-[#0a0e1a] relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16 relative z-10">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Rocket className="h-6 w-6 text-brand-lighter" />
                            <span className="text-xl font-bold tracking-tight text-white">OWL Mentor</span>
                        </Link>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Connect with expert mentors to accelerate your career and personal growth.
                            Vetted experts, on-demand sessions.
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                            Platform
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/how-it-works" className="transition-colors hover:text-brand-lighter">How it Works</Link></li>
                            <li><Link href="#mentors" className="transition-colors hover:text-brand-lighter">Browse Mentors</Link></li>
                            <li><Link href="/login" className="transition-colors hover:text-brand-lighter">Log In</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                            Company
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/about" className="transition-colors hover:text-brand-lighter">About Us</Link></li>
                            <li><Link href="/careers" className="transition-colors hover:text-brand-lighter">Careers</Link></li>
                            <li><Link href="/blog" className="transition-colors hover:text-brand-lighter">Blog</Link></li>
                            <li><Link href="/contact" className="transition-colors hover:text-brand-lighter">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                            Legal
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/terms" className="transition-colors hover:text-brand-lighter">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="transition-colors hover:text-brand-lighter">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="transition-colors hover:text-brand-lighter">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between space-y-4 border-t border-slate-900 pt-8 md:flex-row md:space-y-0">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} OWL Mentor by Jaddpi. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link href="#" className="text-slate-500 transition-colors hover:text-brand-lighter">
                            <span className="sr-only">GitHub</span>
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-500 transition-colors hover:text-brand-lighter">
                            <span className="sr-only">Twitter</span>
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-500 transition-colors hover:text-brand-lighter">
                            <span className="sr-only">LinkedIn</span>
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

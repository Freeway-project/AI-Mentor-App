import Link from 'next/link';
import { Rocket, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-slate-900 bg-slate-950">
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Rocket className="h-6 w-6 text-amber-500" />
                            <span className="text-xl font-bold tracking-tight text-white">OWLMentors</span>
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
                            <li><Link href="#how-it-works" className="hover:text-amber-500 transition-colors">How it Works</Link></li>
                            <li><Link href="#mentors" className="hover:text-amber-500 transition-colors">Browse Mentors</Link></li>
                            <li><Link href="/login" className="hover:text-amber-500 transition-colors">Log In</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                            Company
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/about" className="hover:text-amber-500 transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-amber-500 transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-amber-500 transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                            Legal
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="hover:text-amber-500 transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between space-y-4 border-t border-slate-900 pt-8 md:flex-row md:space-y-0">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} OWLMentors. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link href="#" className="text-slate-500 hover:text-amber-500 transition-colors">
                            <span className="sr-only">GitHub</span>
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-500 hover:text-amber-500 transition-colors">
                            <span className="sr-only">Twitter</span>
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-500 hover:text-amber-500 transition-colors">
                            <span className="sr-only">LinkedIn</span>
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

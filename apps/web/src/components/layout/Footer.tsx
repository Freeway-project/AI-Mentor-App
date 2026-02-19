import Link from 'next/link';
import { Rocket, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t bg-slate-50">
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Rocket className="h-6 w-6 text-blue-600" />
                            <span className="text-xl font-bold tracking-tight">OWLMentors</span>
                        </Link>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Connect with expert mentors to accelerate your career and personal growth.
                            Vetted experts, on-demand sessions.
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                            Platform
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#how-it-works" className="hover:text-blue-600">How it Works</Link></li>
                            <li><Link href="#mentors" className="hover:text-blue-600">Browse Mentors</Link></li>
                            <li><Link href="#pricing" className="hover:text-blue-600">Pricing</Link></li>
                            <li><Link href="/login" className="hover:text-blue-600">Log In</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                            Company
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="/about" className="hover:text-blue-600">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-blue-600">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                            Legal
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="hover:text-blue-600">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between space-y-4 border-t pt-8 md:flex-row md:space-y-0">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} OWLMentors. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link href="#" className="text-slate-400 hover:text-slate-600">
                            <span className="sr-only">GitHub</span>
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 hover:text-slate-600">
                            <span className="sr-only">Twitter</span>
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 hover:text-slate-600">
                            <span className="sr-only">LinkedIn</span>
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

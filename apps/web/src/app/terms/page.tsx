import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-20 relative z-10">
                <div className="max-w-3xl mx-auto bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-8 md:p-12 rounded-2xl shadow-xl">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-6">Terms of Service</h1>
                    <p className="text-lg text-slate-400">Content coming soon...</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}

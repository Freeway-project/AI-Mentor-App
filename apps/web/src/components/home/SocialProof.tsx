import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const testimonials = [
    {
        quote: "Within 3 months of mentorship, I landed my dream job at a FAANG company. My mentor's guidance on system design was invaluable.",
        author: "Alex Chen",
        role: "Software Engineer at Google",
        image: "https://i.pravatar.cc/150?u=alex",
    },
    {
        quote: "As a first-time founder, having a mentor who had successfully exited was a game changer. Saved me from making costly mistakes.",
        author: "Maria Garcia",
        role: "Founder at FinTech",
        image: "https://i.pravatar.cc/150?u=maria",
    },
    {
        quote: "The mock interviews were brutal but necessary. I went from failing phone screens to getting multiple offers.",
        author: "David Smith",
        role: "Product Manager at Stripe",
        image: "https://i.pravatar.cc/150?u=david2",
    },
];

const companies = [
    'Google', 'Amazon', 'Netflix', 'Stripe', 'Uber', 'Microsoft'
];

export function SocialProof() {
    return (
        <section className="py-16 md:py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-4 md:px-6">
                {/* Testimonials */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
                        Don&apos;t just take our word for it
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        See what our community has to say about their mentorship journey.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-8 space-y-6 flex flex-col h-full">
                                <Quote className="h-8 w-8 text-blue-200" />
                                <p className="text-slate-700 italic flex-1">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={testimonial.image} alt={testimonial.author} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900 text-sm">{testimonial.author}</p>
                                        <p className="text-xs text-slate-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
    {
        question: 'How are mentors selected?',
        answer: 'We have a rigorous vetting process. Only top 3% of applicants are accepted. We verify their work history, expertise, and interview them to ensure they are great communicators.',
    },
    {
        question: 'Can I reschedule or cancel a session?',
        answer: 'Yes, you can reschedule or cancel up to 24 hours before the session start time for a full refund. Cancellations within 24 hours may be subject to a fee.',
    },
    {
        question: 'Do you record sessions?',
        answer: 'Sessions are recorded only if both parties agree. Recordings are available in your dashboard for 30 days so you can review the advice given.',
    },
    {
        question: 'What if I don’t like my first mentor?',
        answer: 'We offer a satisfaction guarantee. If your first session doesn’t meet your expectations, let us know and we will refund you or match you with a different mentor for free.',
    },
    {
        question: 'Is this suitable for beginners?',
        answer: 'Absolutely! We have mentors who specialize in guiding beginners, career switchers, and students. Just filter by "Junior" or "Entry Level" when searching.',
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-16 md:py-24 bg-slate-900 border-t border-slate-800">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-slate-400">
                        Everything you need to know about the product and billing.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-slate-700 bg-slate-800/50 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-600 hover:shadow-sm"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="flex items-center justify-between w-full p-4 md:p-6 text-left bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-inset"
                                aria-expanded={openIndex === index}
                            >
                                <span className="text-lg font-medium text-white pr-8">
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="h-5 w-5 text-slate-500 shrink-0" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
                                )}
                            </button>
                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    openIndex === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="p-4 md:p-6 pt-2 text-slate-400 leading-relaxed border-t border-slate-700">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

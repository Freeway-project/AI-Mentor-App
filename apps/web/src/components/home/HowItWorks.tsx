import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, Calendar, Repeat } from 'lucide-react';

const steps = [
    {
        title: 'Fill your goals',
        description: 'Tell us what you want to achieve and the skills you need.',
        icon: UserPlus,
    },
    {
        title: 'Get matched',
        description: 'We connect you with mentors who fit your profile perfectly.',
        icon: Search,
    },
    {
        title: 'Schedule Session',
        description: 'Book a 1:1 video call at a time that works for you.',
        icon: Calendar,
    },
    {
        title: 'Learn & Repeat',
        description: 'Get actionable advice, iterate, and book follow-ups.',
        icon: Repeat,
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        How it works
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Get started with OWLMentors in four simple steps to accelerate your
                        growth.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                                        <Icon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        {step.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-slate-500">{step.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

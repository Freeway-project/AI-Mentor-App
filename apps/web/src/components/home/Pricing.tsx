import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Quick Call',
        price: '$50',
        description: 'Perfect for specific questions or quick advice.',
        features: [
            '30-minute video call',
            'Pre-session intro',
            'Actionable takeaways',
        ],
        cta: 'Book Now',
        popular: false,
        variant: 'outline',
    },
    {
        name: 'Deep Dive',
        price: '$90',
        description: 'In-depth session for complex topics or mock interviews.',
        features: [
            '60-minute video call',
            'Resume/Portfolio review',
            'Detailed feedback summary',
            'Follow-up messaging',
        ],
        cta: 'Book Now',
        popular: true,
        variant: 'default',
    },
    {
        name: 'Mentorship',
        price: '$350',
        period: '/month',
        description: 'Ongoing support for long-term growth and accountability.',
        features: [
            '4 x 60-minute sessions',
            'Unlimited chat support',
            'Personalized growth plan',
            'Priority scheduling',
        ],
        cta: 'Start Monthly',
        popular: false,
        variant: 'outline',
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Pay per session or choose a monthly plan. No hidden fees.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-start">
                    {plans.map((plan, index) => (
                        <Card
                            key={index}
                            className={`flex flex-col relative transition-transform duration-200 ${plan.popular
                                    ? 'border-blue-600 shadow-xl scale-100 md:scale-105 z-10'
                                    : 'border-slate-200 shadow-sm hover:shadow-md'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader className={`text-center pb-8 ${plan.popular ? 'pt-8' : ''}`}>
                                <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                                <div className="mt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                                    {plan.period && <span className="text-slate-500">{plan.period}</span>}
                                </div>
                                <CardDescription className="mt-2 text-slate-500 px-4">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 px-6">
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                            <Check className="h-5 w-5 text-blue-600 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="pb-8 px-6">
                                <Button
                                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'border-slate-300 hover:bg-slate-50'
                                        }`}
                                    // @ts-ignore - variant string matching
                                    variant={plan.popular ? 'default' : 'outline'}
                                >
                                    {plan.cta}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

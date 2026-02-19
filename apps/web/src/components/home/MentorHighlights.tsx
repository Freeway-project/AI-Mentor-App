'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

const categories = ['All', 'Career', 'Software & AI', 'Founders', 'Immigration'];

const mentors = [
    {
        name: 'Sarah Johnson',
        title: 'Senior Software Engineer at Google',
        image: 'https://i.pravatar.cc/150?u=sarah',
        tags: ['React', 'System Design', 'Javascript'],
        rating: 4.9,
        sessions: 120,
        category: 'Software & AI',
        experience: 'Ex-Amazon SDE - 8 years',
    },
    {
        name: 'Michael Chen',
        title: 'Founder & CTO at TechStart',
        image: 'https://i.pravatar.cc/150?u=michael',
        tags: ['Startup', 'Fundraising', 'Leadership'],
        rating: 5.0,
        sessions: 85,
        category: 'Founders',
        experience: 'YC Alumni - 10 years',
    },
    {
        name: 'Emily Davis',
        title: 'Product Manager at Netflix',
        image: 'https://i.pravatar.cc/150?u=emily',
        tags: ['Product Management', 'Strategy', 'Interview'],
        rating: 4.8,
        sessions: 210,
        category: 'Career',
        experience: 'Ex-Uber PM - 6 years',
    },
    {
        name: 'David Kim',
        title: 'AI Researcher at OpenAI',
        image: 'https://i.pravatar.cc/150?u=david',
        tags: ['NLP', 'Machine Learning', 'Python'],
        rating: 5.0,
        sessions: 150,
        category: 'Software & AI',
        experience: 'PhD from Stanford',
    },
    {
        name: 'Priya Patel',
        title: 'Tech Lead at Stripe',
        image: 'https://i.pravatar.cc/150?u=priya',
        tags: ['Fintech', 'Backend', 'Go'],
        rating: 4.9,
        sessions: 120,
        category: 'Software & AI',
        experience: 'Ex-Goldman Sachs',
    },
    {
        name: 'James Wilson',
        title: 'VP of Engineering at CloudCorp',
        image: 'https://i.pravatar.cc/150?u=james',
        tags: ['Management', 'Scaling', 'Culture'],
        rating: 4.8,
        sessions: 300,
        category: 'Founders',
        experience: 'Scaled team from 20 to 200',
    },
];

export function MentorHighlights() {
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredMentors = activeCategory === 'All'
        ? mentors
        : mentors.filter(m => m.category === activeCategory || (activeCategory === 'Career' && true)); // Simplified filter for demo

    return (
        <section id="mentors" className="py-16 md:py-24 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Featured Mentors
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Learn from the best in the industry. Our mentors come from top tech companies and startups.
                    </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Mentor Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMentors.slice(0, 6).map((mentor, index) => (
                        <Card key={index} className="overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-200">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={mentor.image} alt={mentor.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">{mentor.name}</CardTitle>
                                            <CardDescription className="text-sm line-clamp-1">{mentor.title}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-4">
                                <div className="flex items-center gap-2 text-sm text-yellow-500 font-medium">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span>{mentor.rating}</span>
                                    <span className="text-slate-400 font-normal">({mentor.sessions} sessions)</span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">
                                    {mentor.experience}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {mentor.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex gap-3">
                                <Button variant="outline" className="flex-1 w-full border-slate-300">View Profile</Button>
                                <Button className="flex-1 w-full bg-blue-600 hover:bg-blue-700">Book Session</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

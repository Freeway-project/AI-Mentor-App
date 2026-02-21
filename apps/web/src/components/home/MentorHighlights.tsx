'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

export function MentorHighlights() {
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredMentors = activeCategory === 'All'
        ? mentors
        : mentors.filter(m => m.category === activeCategory || (activeCategory === 'Career' && true)); // Simplified filter for demo

    return (
        <section id="mentors" className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 space-y-4"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Featured Mentors
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Learn from the best in the industry. Our mentors come from top tech companies and startups.
                    </p>
                </motion.div>

                {/* Categories */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-2 mb-12"
                >
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === category
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 hover:scale-105'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </motion.div>

                {/* Mentor Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredMentors.slice(0, 6).map((mentor, index) => (
                            <motion.div key={mentor.name} variants={itemVariants} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                                <Card className="h-full overflow-hidden border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group flex flex-col">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative h-14 w-14 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-indigo-500 shrink-0">
                                                    <div className="h-full w-full rounded-full overflow-hidden border-2 border-white bg-white">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={mentor.image} alt={mentor.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{mentor.name}</CardTitle>
                                                    <CardDescription className="text-sm line-clamp-1 font-medium">{mentor.title}</CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pb-4 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-amber-500 font-semibold bg-amber-50 w-fit px-2 py-1 rounded-md">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span>{mentor.rating}</span>
                                            <span className="text-slate-500 font-medium">({mentor.sessions} sessions)</span>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium line-clamp-2">
                                            {mentor.experience}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex gap-3 mt-auto">
                                        <Button variant="outline" className="flex-1 border-slate-200 bg-white hover:bg-slate-50 group-hover:border-blue-200 text-slate-700 transition-all font-semibold shadow-sm">View Profile</Button>
                                        <Button className="flex-1 bg-slate-900 hover:bg-blue-600 text-white transition-colors shadow-md font-semibold">Book Session</Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}

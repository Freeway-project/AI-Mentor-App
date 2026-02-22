'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

interface MentorData {
    id: string;
    name: string;
    headline?: string;
    bio?: string;
    specialties: string[];
    expertise: string[];
    languages: string[];
    rating?: number;
    totalMeetings: number;
    totalReviews: number;
}

export function MentorHighlights() {
    const [activeSubject, setActiveSubject] = useState('All');
    const [subjects, setSubjects] = useState<string[]>(['All']);
    const [mentors, setMentors] = useState<MentorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const res = await fetch('/api/mentors/featured');
                const json = await res.json();
                if (json.success) {
                    setSubjects(['All', ...json.data.subjects]);
                    setMentors(json.data.mentors);
                }
            } catch (error) {
                console.error('Failed to fetch featured mentors:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    // Active Subject is mapped from Topic Categories but mentors don't easily have a "category" attached to them directly unless we fetch topics or filter by specialties.
    // For now we will surface all mentors and fallback to specialties since `search` uses specialties mostly.
    const filteredMentors = activeSubject === 'All'
        ? mentors
        : mentors.filter(m => m.specialties.includes(activeSubject) || m.expertise.includes(activeSubject));

    return (
        <section id="mentors" className="py-16 md:py-24 bg-slate-950">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 space-y-4"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Featured Mentors
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
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
                    {isLoading ? (
                        <div className="flex gap-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 w-24 bg-slate-800 rounded-full animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        subjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={() => setActiveSubject(subject)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeSubject === subject
                                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800 hover:text-white hover:scale-105'
                                    }`}
                            >
                                {subject}
                            </button>
                        ))
                    )}
                </motion.div>

                {/* Mentor Grid */}
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="h-full border-slate-800 bg-slate-900 animate-pulse min-h-[400px]" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredMentors.slice(0, 6).map((mentor) => (
                                <motion.div key={mentor.id} variants={itemVariants} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                                    <Card className="h-full overflow-hidden border-slate-800 bg-slate-900 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 group flex flex-col">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-14 w-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-amber-600 shrink-0 flex items-center justify-center text-slate-900 font-bold text-xl">
                                                        <div className="h-full w-full rounded-full overflow-hidden border-2 border-slate-900 bg-amber-500 flex items-center justify-center">
                                                            <span>{mentor.name.charAt(0)}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{mentor.name}</CardTitle>
                                                        <CardDescription className="text-sm line-clamp-1 font-medium text-slate-400">{mentor.headline || 'Mentor'}</CardDescription>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pb-4 flex-1">
                                            <div className="flex items-center gap-2 text-sm text-amber-400 font-semibold bg-amber-500/10 w-fit px-2 py-1 rounded-md border border-amber-500/20">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span>{mentor.rating ? mentor.rating.toFixed(1) : 'New'}</span>
                                                <span className="text-slate-500 font-medium">({mentor.totalMeetings} sessions)</span>
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium line-clamp-2">
                                                {mentor.bio || 'Experienced mentor ready to help you grow.'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {mentor.expertise.slice(0, 3).map((tag) => (
                                                    <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex gap-3 mt-auto">
                                            <Button variant="outline" className="flex-1 border-slate-700 bg-slate-900 hover:bg-slate-800 group-hover:border-amber-500/30 text-slate-300 transition-all font-semibold shadow-sm">View Profile</Button>
                                            <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md font-bold">Book Session</Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </section>
    );
}

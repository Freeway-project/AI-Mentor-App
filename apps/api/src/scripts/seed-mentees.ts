import bcrypt from 'bcryptjs';
import {
  CareerProfileModel,
  closeDatabase,
  connectDatabase,
  CreditRepository,
  MeetingRepository,
  MentorModel,
  OfferModel,
  UserModel,
  UserRepository,
} from '@owl-mentors/database';

type SeedMentee = {
  email: string;
  password: string;
  name: string;
  timezone: string;
  credits: number;
  careerProfile: {
    summary: string;
    headline: string;
    coreCapabilities: string[];
    tools: string[];
    domains: string[];
    functionalSkills: string[];
    communicationSkills: string[];
    leadershipSignals: string[];
    careerInterests: string[];
    certifications: string[];
    projects: Array<{ name: string; summary: string; capabilitiesUsed: string[] }>;
    education: Array<{ institution: string; degree: string; fieldOfStudy: string; graduationYear: string }>;
    experienceTimeline: Array<{
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      summary: string;
      capabilitiesUsed: string[];
    }>;
    seniorityEstimate: string;
    strengthSignals: string[];
    weakSignals: string[];
    confidence: number;
  };
  goalProfile: {
    targetRole: string;
    goalType: string;
    timelineMonths: number;
    priorityAreas: string[];
    inferredCurrentLevel: string;
    constraints: {
      weeklyHours: number;
      maxBudget: number;
      preferredLanguage: string;
    };
    confidence: number;
    goalSummary: string;
  };
  latestAnalysis: {
    currentLevelSummary: string;
    topStrengths: string[];
    primaryGaps: string[];
    recommendedFocusAreas: string[];
    recommendedLearningOrder: string[];
    explorationSuggestions: string[];
    briefPlan: string;
    mentorSearchQuery: string;
  };
};

const MENTEE_DATA: SeedMentee[] = [
  {
    email: 'alex.mentee@example.com',
    password: 'Seed@Mentee1',
    name: 'Alex Carter',
    timezone: 'America/Los_Angeles',
    credits: 8,
    careerProfile: {
      summary: 'Frontend engineer with 2 years of experience building React dashboards, now pushing toward senior-level ownership and stronger system thinking.',
      headline: 'Frontend Engineer targeting Senior React roles',
      coreCapabilities: ['React', 'TypeScript', 'UI Architecture'],
      tools: ['React', 'Next.js', 'TypeScript', 'Jest', 'Figma'],
      domains: ['Fintech', 'SaaS'],
      functionalSkills: ['Component design', 'Debugging', 'Testing'],
      communicationSkills: ['Async collaboration', 'Stakeholder demos'],
      leadershipSignals: ['Mentors interns', 'Owns frontend releases'],
      careerInterests: ['Frontend Architecture', 'Performance Optimization', 'Design Systems'],
      certifications: [],
      projects: [
        {
          name: 'Analytics Admin Console',
          summary: 'Built a React admin console used by internal support and ops teams.',
          capabilitiesUsed: ['React', 'TypeScript', 'State management'],
        },
      ],
      education: [
        {
          institution: 'University of Washington',
          degree: 'BS',
          fieldOfStudy: 'Computer Science',
          graduationYear: '2022',
        },
      ],
      experienceTimeline: [
        {
          title: 'Frontend Engineer',
          company: 'Northstar SaaS',
          startDate: '2022-08',
          isCurrent: true,
          summary: 'Builds product dashboards and internal tooling in React and Next.js.',
          capabilitiesUsed: ['React', 'Next.js', 'TypeScript', 'Testing'],
        },
      ],
      seniorityEstimate: 'mid-level',
      strengthSignals: ['Ships reliably', 'Strong UI polish', 'Learns quickly'],
      weakSignals: ['Limited architecture depth', 'Needs stronger performance profiling habits'],
      confidence: 0.87,
    },
    goalProfile: {
      targetRole: 'Senior Frontend Engineer',
      goalType: 'promotion',
      timelineMonths: 9,
      priorityAreas: ['System design for frontend', 'Performance', 'Technical leadership'],
      inferredCurrentLevel: 'mid-level frontend engineer',
      constraints: {
        weeklyHours: 6,
        maxBudget: 600,
        preferredLanguage: 'English',
      },
      confidence: 0.84,
      goalSummary: 'Move from feature delivery to owning frontend architecture and promotion to senior.',
    },
    latestAnalysis: {
      currentLevelSummary: 'Strong execution-oriented frontend engineer with good product sense and clean UI implementation.',
      topStrengths: ['React fundamentals', 'UI consistency', 'Collaborative communication'],
      primaryGaps: ['Architecture framing', 'Performance diagnosis', 'Senior-level decision narratives'],
      recommendedFocusAreas: ['Frontend architecture', 'Performance optimization', 'Design systems'],
      recommendedLearningOrder: ['Architecture', 'Performance', 'Leadership communication'],
      explorationSuggestions: ['Run one architecture review per sprint', 'Lead a design system cleanup initiative'],
      briefPlan: 'Pair with a senior mentor weekly, present architecture decisions, and practice performance audits.',
      mentorSearchQuery: 'senior frontend react nextjs architecture performance mentor',
    },
  },
  {
    email: 'priya.mentee@example.com',
    password: 'Seed@Mentee2',
    name: 'Priya Nair',
    timezone: 'America/New_York',
    credits: 10,
    careerProfile: {
      summary: 'Backend engineer preparing for senior interviews focused on distributed systems and system design.',
      headline: 'Backend Engineer preparing for System Design interviews',
      coreCapabilities: ['Java', 'Spring Boot', 'APIs'],
      tools: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Docker'],
      domains: ['E-commerce', 'Payments'],
      functionalSkills: ['API design', 'Database modeling', 'Service integration'],
      communicationSkills: ['Technical writing', 'Cross-team collaboration'],
      leadershipSignals: ['Drives incident reviews'],
      careerInterests: ['System Design', 'Scalability', 'Staff Engineering'],
      certifications: ['AWS Cloud Practitioner'],
      projects: [
        {
          name: 'Order Routing Service',
          summary: 'Implemented routing logic for a high-volume order processing service.',
          capabilitiesUsed: ['Java', 'Distributed systems', 'Observability'],
        },
      ],
      education: [
        {
          institution: 'Georgia Tech',
          degree: 'MS',
          fieldOfStudy: 'Computer Science',
          graduationYear: '2021',
        },
      ],
      experienceTimeline: [
        {
          title: 'Backend Engineer',
          company: 'Mercury Commerce',
          startDate: '2021-06',
          isCurrent: true,
          summary: 'Owns backend services for checkout and fulfillment workflows.',
          capabilitiesUsed: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis'],
        },
      ],
      seniorityEstimate: 'mid-level',
      strengthSignals: ['Clear fundamentals', 'Good production ownership', 'Strong debugging'],
      weakSignals: ['Interview storytelling', 'Large-scale architecture breadth'],
      confidence: 0.89,
    },
    goalProfile: {
      targetRole: 'Senior Backend Engineer',
      goalType: 'interview_prep',
      timelineMonths: 6,
      priorityAreas: ['System design interviews', 'Distributed systems', 'Scalability'],
      inferredCurrentLevel: 'mid-level backend engineer',
      constraints: {
        weeklyHours: 5,
        maxBudget: 900,
        preferredLanguage: 'English',
      },
      confidence: 0.88,
      goalSummary: 'Get interview-ready for senior backend roles at larger companies.',
    },
    latestAnalysis: {
      currentLevelSummary: 'Solid backend engineer with credible production ownership and a good base for senior interview prep.',
      topStrengths: ['Backend implementation', 'Reliability mindset', 'Database fundamentals'],
      primaryGaps: ['System design repetition', 'Scale tradeoff articulation', 'Interview confidence'],
      recommendedFocusAreas: ['Mock interviews', 'Distributed systems patterns', 'Architecture communication'],
      recommendedLearningOrder: ['System design patterns', 'Mock interviews', 'Tradeoff articulation'],
      explorationSuggestions: ['Write architecture docs for past systems', 'Practice timed mock interviews'],
      briefPlan: 'Use credits on mock interviews and architecture reviews with system-design focused mentors.',
      mentorSearchQuery: 'system design distributed systems backend senior interview mentor',
    },
  },
  {
    email: 'sara.mentee@example.com',
    password: 'Seed@Mentee3',
    name: 'Sara Kim',
    timezone: 'America/Chicago',
    credits: 6,
    careerProfile: {
      summary: 'Product-minded software engineer transitioning toward applied AI and LLM product work.',
      headline: 'Software Engineer pivoting into AI product engineering',
      coreCapabilities: ['Python', 'Product thinking', 'APIs'],
      tools: ['Python', 'FastAPI', 'OpenAI', 'Postgres', 'LangChain'],
      domains: ['Developer tools', 'AI products'],
      functionalSkills: ['Rapid prototyping', 'API integration', 'Experimentation'],
      communicationSkills: ['User research synthesis', 'Demo communication'],
      leadershipSignals: ['Leads hackathon prototypes'],
      careerInterests: ['LLM Applications', 'AI Engineering', 'RAG'],
      certifications: [],
      projects: [
        {
          name: 'Support Copilot Prototype',
          summary: 'Built an internal support assistant prototype using retrieval and prompt orchestration.',
          capabilitiesUsed: ['Python', 'RAG', 'Prompting'],
        },
      ],
      education: [
        {
          institution: 'University of Illinois',
          degree: 'BS',
          fieldOfStudy: 'Computer Engineering',
          graduationYear: '2020',
        },
      ],
      experienceTimeline: [
        {
          title: 'Software Engineer',
          company: 'Orbit DevTools',
          startDate: '2020-09',
          isCurrent: true,
          summary: 'Builds backend and internal tooling, increasingly focused on AI-assisted workflows.',
          capabilitiesUsed: ['Python', 'APIs', 'Developer tools'],
        },
      ],
      seniorityEstimate: 'mid-level',
      strengthSignals: ['Fast learner', 'Product intuition', 'Prototype velocity'],
      weakSignals: ['Limited ML systems depth', 'Evaluation rigor still developing'],
      confidence: 0.83,
    },
    goalProfile: {
      targetRole: 'AI Product Engineer',
      goalType: 'career_transition',
      timelineMonths: 8,
      priorityAreas: ['RAG architecture', 'Evaluation', 'Production AI systems'],
      inferredCurrentLevel: 'software engineer pivoting to AI',
      constraints: {
        weeklyHours: 7,
        maxBudget: 700,
        preferredLanguage: 'English',
      },
      confidence: 0.82,
      goalSummary: 'Move from generalist software engineering into production AI feature ownership.',
    },
    latestAnalysis: {
      currentLevelSummary: 'Good candidate for applied AI work with strong product instincts and enough engineering depth to move quickly.',
      topStrengths: ['Prototype speed', 'Customer empathy', 'Backend integration'],
      primaryGaps: ['Evaluation design', 'ML systems reliability', 'Productionization depth'],
      recommendedFocusAreas: ['LLM architecture', 'Evaluation', 'MLOps basics'],
      recommendedLearningOrder: ['RAG fundamentals', 'Evaluation methods', 'Production deployment patterns'],
      explorationSuggestions: ['Build one end-to-end AI portfolio project with eval dashboards'],
      briefPlan: 'Use mentor sessions to design and productionize an AI portfolio project with measurable quality metrics.',
      mentorSearchQuery: 'llm rag ai product engineering mentor',
    },
  },
  {
    email: 'miguel.mentee@example.com',
    password: 'Seed@Mentee4',
    name: 'Miguel Alvarez',
    timezone: 'America/Denver',
    credits: 5,
    careerProfile: {
      summary: 'Mechanical engineering graduate building toward a product design role in hardware.',
      headline: 'Junior Mechanical Engineer seeking product design mentorship',
      coreCapabilities: ['CAD', 'Prototyping', 'Engineering analysis'],
      tools: ['SolidWorks', 'Fusion 360', 'MATLAB'],
      domains: ['Consumer hardware', 'Prototyping'],
      functionalSkills: ['CAD modeling', 'Prototype iteration', 'Basic FEA'],
      communicationSkills: ['Design presentation', 'Documentation'],
      leadershipSignals: ['Led senior capstone build'],
      careerInterests: ['Mechanical Design', 'Product Development', 'DFM'],
      certifications: [],
      projects: [
        {
          name: 'Portable Water Filter Prototype',
          summary: 'Led the CAD and prototyping work for a capstone hardware product.',
          capabilitiesUsed: ['SolidWorks', 'Prototyping', 'Testing'],
        },
      ],
      education: [
        {
          institution: 'Arizona State University',
          degree: 'BS',
          fieldOfStudy: 'Mechanical Engineering',
          graduationYear: '2024',
        },
      ],
      experienceTimeline: [
        {
          title: 'Mechanical Engineering Intern',
          company: 'Desert Devices',
          startDate: '2023-05',
          endDate: '2023-08',
          isCurrent: false,
          summary: 'Supported CAD updates and prototype testing for small consumer devices.',
          capabilitiesUsed: ['CAD', 'Testing', 'Documentation'],
        },
      ],
      seniorityEstimate: 'entry-level',
      strengthSignals: ['Strong fundamentals', 'Hands-on builder', 'Good design discipline'],
      weakSignals: ['Limited industry experience', 'Needs more DFM depth'],
      confidence: 0.8,
    },
    goalProfile: {
      targetRole: 'Mechanical Design Engineer',
      goalType: 'first_role',
      timelineMonths: 6,
      priorityAreas: ['Portfolio quality', 'DFM', 'Interview prep'],
      inferredCurrentLevel: 'entry-level mechanical engineer',
      constraints: {
        weeklyHours: 4,
        maxBudget: 400,
        preferredLanguage: 'English',
      },
      confidence: 0.79,
      goalSummary: 'Land a full-time product design or mechanical design role within the next hiring cycle.',
    },
    latestAnalysis: {
      currentLevelSummary: 'Promising entry-level hardware candidate with hands-on experience and a strong portfolio base.',
      topStrengths: ['CAD foundation', 'Prototype ownership', 'Clear project examples'],
      primaryGaps: ['Industry process exposure', 'DFM depth', 'Interview storytelling'],
      recommendedFocusAreas: ['Design review practice', 'DFM concepts', 'Portfolio presentation'],
      recommendedLearningOrder: ['Portfolio refinement', 'DFM practice', 'Mock interviews'],
      explorationSuggestions: ['Review one real-world product teardown each week'],
      briefPlan: 'Use mentor sessions to sharpen portfolio artifacts, prepare case-study stories, and learn manufacturing tradeoffs.',
      mentorSearchQuery: 'mechanical design cad dfm product development mentor',
    },
  },
];

async function ensureUser(userRepo: UserRepository, seed: SeedMentee) {
  const existing = await userRepo.findByEmail(seed.email);
  const passwordHash = await bcrypt.hash(seed.password, 12);

  if (existing) {
    const nextRoles = existing.roles.includes('mentee') ? existing.roles : [...existing.roles, 'mentee'];
    await UserModel.findByIdAndUpdate(existing.id, {
      $set: {
        name: seed.name,
        password: passwordHash,
        timezone: seed.timezone,
        emailVerified: true,
        isActive: true,
        roles: nextRoles,
      },
    });
    return { userId: existing.id, created: false };
  }

  const created = await userRepo.create({
    email: seed.email,
    name: seed.name,
    password: passwordHash,
    roles: ['mentee'],
    timezone: seed.timezone,
    emailVerified: true,
  });

  return { userId: created.id, created: true };
}

async function seedCareerProfile(userId: string, seed: SeedMentee) {
  await CareerProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        status: 'ready',
        rawText: seed.careerProfile.summary,
        extractedProfile: seed.careerProfile,
        goalProfile: seed.goalProfile,
        latestAnalysis: {
          ...seed.latestAnalysis,
          generatedAt: new Date(),
        },
        mentorRecommendations: [],
        errorMessage: undefined,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedCredits(creditRepo: CreditRepository, userId: string, seed: SeedMentee) {
  const account = await creditRepo.getOrCreateAccount(userId);
  if (account.totalPurchased >= seed.credits) {
    return false;
  }

  const amountToAdd = seed.credits - account.totalPurchased;
  if (amountToAdd > 0) {
    await creditRepo.purchaseCredits(userId, amountToAdd, 'Seed mentee credits');
    return true;
  }

  return false;
}

async function seedSampleMeetings(menteeIds: string[]) {
  const mentors = await MentorModel.find({ isActive: true, approvalStatus: 'approved' })
    .sort({ createdAt: 1 })
    .limit(3)
    .lean();

  if (mentors.length === 0) {
    return { created: 0, skipped: true };
  }

  const offerDocs = await Promise.all(
    mentors.map((mentor) =>
      OfferModel.findOne({ mentorId: mentor._id, isActive: true }).sort({ createdAt: 1 }).lean()
    )
  );

  const meetingRepo = new MeetingRepository();
  let created = 0;

  for (let i = 0; i < menteeIds.length; i += 1) {
    const mentor = mentors[i % mentors.length];
    const offer = offerDocs[i % offerDocs.length];
    if (!offer) continue;

    const existing = await meetingRepo.listAll({
      menteeId: menteeIds[i],
      mentorId: mentor._id.toString(),
      limit: 1,
      offset: 0,
    });

    if (existing.total > 0) continue;

    const scheduledAt = new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000);
    scheduledAt.setUTCHours(16 + (i % 3), 0, 0, 0);

    await meetingRepo.create(menteeIds[i], {
      mentorId: mentor._id.toString(),
      title: offer.title,
      description: offer.description,
      scheduledAt: scheduledAt.toISOString(),
      duration: offer.durationMinutes,
      offerId: offer._id.toString(),
      creditCost: offer.price,
      menteeName: MENTEE_DATA[i]?.name,
    });

    created += 1;
  }

  return { created, skipped: false };
}

async function seedMentees() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentor-app';
  await connectDatabase(mongoUri);

  const userRepo = new UserRepository();
  const creditRepo = new CreditRepository();

  const results: Array<{ email: string; userId: string; created: boolean; creditsSeeded: boolean }> = [];

  for (const seed of MENTEE_DATA) {
    const { userId, created } = await ensureUser(userRepo, seed);
    await seedCareerProfile(userId, seed);
    const creditsSeeded = await seedCredits(creditRepo, userId, seed);
    results.push({ email: seed.email, userId, created, creditsSeeded });
  }

  const meetings = await seedSampleMeetings(results.map((r) => r.userId));

  console.log('Seeded mentees:');
  for (const seed of MENTEE_DATA) {
    console.log(`  ${seed.email} / ${seed.password}`);
  }

  console.log('');
  console.log(
    JSON.stringify(
      {
        users: results,
        meetings,
      },
      null,
      2
    )
  );

  await closeDatabase();
}

seedMentees().catch(async (err) => {
  console.error('Failed to seed mentees:', err);
  try {
    await closeDatabase();
  } catch {}
  process.exit(1);
});

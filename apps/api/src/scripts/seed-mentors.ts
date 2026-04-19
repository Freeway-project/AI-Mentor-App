/**
 * seed-mentors.ts
 *
 * Seeds 6 realistic mentor profiles across diverse domains (Frontend, Backend,
 * ML/AI, English/Language, Mechanical Engineering, Business/Finance) through the
 * live API so that embeddings are generated via the normal code path.
 *
 * Usage:
 *   bun --env-file ../../.env src/scripts/seed-mentors.ts
 *
 * Prerequisites:
 *   - API running on localhost:3001
 *   - Admin account seeded (bun run seed:admin)
 *   - MONGODB_URI pointing at Atlas
 */

import { connectDatabase, closeDatabase, OtpModel } from '@owl-mentors/database';

const API = 'http://localhost:3001/api';

// ─── Mentor data ─────────────────────────────────────────────────────────────

const MENTOR_DATA = [
  // 1. Frontend — React/Next.js specialist
  {
    register: {
      name: 'Lena Fischer',
      email: 'lena.fischer.mentor@example.com',
      phone: '+14151110001',
      password: 'Seed@Mentor1',
      timezone: 'America/Los_Angeles',
    },
    profile: {
      headline: 'Senior React & Next.js Engineer — 8 years building production web apps',
      bio: 'I help frontend engineers level up from mid to senior. I specialize in React architecture, Next.js App Router, performance optimization, and design systems. Before going independent I led the UI platform team at a Series-B fintech, shipping to 500k users. I enjoy pair-programming sessions, in-depth code reviews, and helping people prepare for FAANG-style frontend interviews.',
      specialties: ['React', 'Next.js', 'TypeScript', 'Performance Optimization', 'Design Systems'],
      expertise: ['Frontend Architecture', 'Web Performance', 'Interview Prep', 'Code Review'],
      languages: ['English', 'German'],
      hourlyRate: 120,
    },
    offers: [
      {
        title: '30-min Quick Code Review',
        description: 'I review up to 200 lines of your React/Next.js code and give actionable feedback on architecture, patterns, and performance.',
        durationMinutes: 30,
        price: 60,
        currency: 'USD',
      },
      {
        title: '60-min Deep-Dive Session',
        description: 'Full pair-programming or architecture planning session. Great for debugging tricky issues, designing component systems, or portfolio projects.',
        durationMinutes: 60,
        price: 120,
        currency: 'USD',
      },
    ],
    policy: {
      cancellationHours: 24,
      rescheduleHours: 12,
      noShowPolicy: 'Full charge applies for no-shows without 2-hour advance notice.',
    },
    availability: {
      timezone: 'America/Los_Angeles',
      schedule: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },
      ],
    },
  },

  // 2. Backend — System design & distributed systems
  {
    register: {
      name: 'Arjun Sharma',
      email: 'arjun.sharma.mentor@example.com',
      phone: '+14152220002',
      password: 'Seed@Mentor2',
      timezone: 'America/New_York',
    },
    profile: {
      headline: 'Staff Engineer @ top-5 bank — System Design & Backend Architecture',
      bio: 'I have spent 12 years building high-throughput distributed systems in fintech and e-commerce. I specialise in system design interviews, microservices patterns, database selection, and API design. I mentor engineers who are targeting senior or staff-level roles at top companies and want to crack system design rounds with confidence. My sessions are structured, whiteboard-style, with clear frameworks you can reuse.',
      specialties: ['System Design', 'Distributed Systems', 'Microservices', 'Database Design', 'Java', 'Go'],
      expertise: ['System Design Interviews', 'Backend Architecture', 'Scalability', 'API Design'],
      languages: ['English', 'Hindi'],
      hourlyRate: 200,
    },
    offers: [
      {
        title: '60-min System Design Mock Interview',
        description: 'Full mock interview covering a real system-design prompt (e.g. design YouTube, design a rate-limiter). Detailed debrief included.',
        durationMinutes: 60,
        price: 200,
        currency: 'USD',
      },
      {
        title: '90-min Architecture Review',
        description: 'Review your current or planned system architecture end-to-end. I identify bottlenecks, single points of failure, and scaling opportunities.',
        durationMinutes: 90,
        price: 280,
        currency: 'USD',
      },
    ],
    policy: {
      cancellationHours: 48,
      rescheduleHours: 24,
      noShowPolicy: 'No refund for no-shows. One free reschedule up to 24 hours before.',
    },
    availability: {
      timezone: 'America/New_York',
      schedule: [
        { dayOfWeek: 2, startTime: '18:00', endTime: '22:00' },
        { dayOfWeek: 4, startTime: '18:00', endTime: '22:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' },
      ],
    },
  },

  // 3. ML/AI — LLM applications & applied ML
  {
    register: {
      name: 'Mei Lin',
      email: 'mei.lin.mentor@example.com',
      phone: '+14153330003',
      password: 'Seed@Mentor3',
      timezone: 'America/Chicago',
    },
    profile: {
      headline: 'ML Engineer & LLM Specialist — helping engineers ship real AI products',
      bio: 'I build and productionise LLM-powered applications — RAG pipelines, fine-tuned models, AI agents, and evaluation frameworks. I previously led applied-ML at a generative-AI startup and have published research on retrieval-augmented generation. I mentor ML engineers and software engineers who want to break into AI, ship their first LLM product, or move from notebooks to production ML systems.',
      specialties: ['LLMs', 'RAG', 'Fine-tuning', 'Python', 'Vector Databases', 'MLOps'],
      expertise: ['Applied ML', 'LLM Applications', 'AI Product Development', 'ML System Design'],
      languages: ['English', 'Mandarin'],
      hourlyRate: 180,
    },
    offers: [
      {
        title: '45-min LLM Architecture Consult',
        description: 'We design the right LLM architecture for your use case — RAG vs fine-tuning, model selection, chunking strategy, evaluation approach.',
        durationMinutes: 45,
        price: 135,
        currency: 'USD',
      },
      {
        title: '60-min AI Career & Project Review',
        description: 'Review your ML portfolio, help you land your first AI role, or advise on your current LLM project. Great for career transitions into AI.',
        durationMinutes: 60,
        price: 180,
        currency: 'USD',
      },
    ],
    policy: {
      cancellationHours: 24,
      rescheduleHours: 12,
      noShowPolicy: 'No refund for no-shows without at least 3-hour advance notice.',
    },
    availability: {
      timezone: 'America/Chicago',
      schedule: [
        { dayOfWeek: 1, startTime: '17:00', endTime: '21:00' },
        { dayOfWeek: 3, startTime: '17:00', endTime: '21:00' },
        { dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
      ],
    },
  },

  // 4. English / Language Coaching
  {
    register: {
      name: 'Sophie Moreau',
      email: 'sophie.moreau.mentor@example.com',
      phone: '+14154440004',
      password: 'Seed@Mentor4',
      timezone: 'Europe/Paris',
    },
    profile: {
      headline: 'Business English & IELTS Coach — 10 years helping professionals communicate confidently',
      bio: 'I am a certified CELTA English teacher with a decade of experience coaching professionals from non-English-speaking countries. My focus is on business communication — presentations, emails, negotiations, and public speaking. I also prepare candidates for IELTS, TOEFL, and Cambridge exams. My students have gone on to work at Google, McKinsey, and top European universities. I tailor every session to your current level and professional context.',
      specialties: ['Business English', 'IELTS Preparation', 'TOEFL', 'Public Speaking', 'Academic Writing'],
      expertise: ['Professional Communication', 'Exam Preparation', 'Pronunciation', 'Written English'],
      languages: ['English', 'French'],
      hourlyRate: 75,
    },
    offers: [
      {
        title: '60-min Business English Session',
        description: 'Focused on your real work scenarios — emails, reports, presentations, or meetings. Recorded for review.',
        durationMinutes: 60,
        price: 75,
        currency: 'USD',
      },
      {
        title: '90-min IELTS / TOEFL Mock Test',
        description: 'Full speaking and writing mock exam with detailed feedback and band-score estimation.',
        durationMinutes: 90,
        price: 110,
        currency: 'USD',
      },
    ],
    policy: {
      cancellationHours: 12,
      rescheduleHours: 6,
      noShowPolicy: 'Sessions forfeited without 12-hour notice. One reschedule per month free.',
    },
    availability: {
      timezone: 'Europe/Paris',
      schedule: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
      ],
    },
  },

  // 5. Mechanical Engineering
  {
    register: {
      name: 'Carlos Vega',
      email: 'carlos.vega.mentor@example.com',
      phone: '+14155550005',
      password: 'Seed@Mentor5',
      timezone: 'America/Denver',
    },
    profile: {
      headline: 'Mechanical Engineer & Product Designer — from concept to manufacturing',
      bio: 'I am a senior mechanical engineer with 15 years of experience in automotive and consumer-products industries. I specialise in CAD/CAM design (SolidWorks, Fusion 360), FEA analysis, GD&T, and design-for-manufacturing (DFM). I mentor engineering students, junior MEs, and entrepreneurs who want to take a hardware idea from napkin sketch to prototype or mass production. I also help with university project reviews and FE/PE exam preparation.',
      specialties: ['SolidWorks', 'Fusion 360', 'FEA', 'GD&T', 'Design for Manufacturing', 'Prototyping'],
      expertise: ['Mechanical Design', 'CAD/CAM', 'Product Development', 'Engineering Analysis'],
      languages: ['English', 'Spanish'],
      hourlyRate: 110,
    },
    offers: [
      {
        title: '60-min Design Review',
        description: 'I review your CAD model or engineering drawing and give detailed feedback on manufacturability, tolerancing, and structural integrity.',
        durationMinutes: 60,
        price: 110,
        currency: 'USD',
      },
      {
        title: '90-min Project Kickoff & Concept Session',
        description: 'We scope your mechanical engineering project, choose materials and manufacturing processes, and sketch a DFM-ready concept together.',
        durationMinutes: 90,
        price: 160,
        currency: 'USD',
      },
    ],
    policy: {
      cancellationHours: 24,
      rescheduleHours: 12,
      noShowPolicy: 'No refund for no-shows. Reschedule with 24-hour notice at no charge.',
    },
    availability: {
      timezone: 'America/Denver',
      schedule: [
        { dayOfWeek: 2, startTime: '17:00', endTime: '21:00' },
        { dayOfWeek: 4, startTime: '17:00', endTime: '21:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' },
      ],
    },
  },

  // 6. Business & Finance
  {
    register: {
      name: 'Priya Nair',
      email: 'priya.nair.mentor@example.com',
      phone: '+14156660006',
      password: 'Seed@Mentor6',
      timezone: 'America/New_York',
    },
    profile: {
      headline: 'Ex-Goldman Sachs — Finance, Startup Strategy & Personal Investment Coaching',
      bio: 'I spent 8 years in investment banking at Goldman Sachs before founding two startups. I now coach professionals, entrepreneurs, and MBA applicants on personal finance, startup fundraising, financial modeling, and business strategy. Whether you want to understand how to read a balance sheet, raise your first seed round, build a 3-statement financial model, or switch careers into finance — I can help. I also coach CFA Level 1 candidates.',
      specialties: ['Financial Modeling', 'Startup Fundraising', 'Investment Banking', 'Personal Finance', 'CFA Prep'],
      expertise: ['Business Strategy', 'Financial Analysis', 'Venture Capital', 'Career Coaching'],
      languages: ['English', 'Hindi'],
      hourlyRate: 200,
    },
    offers: [
      {
        title: '60-min Finance Career Strategy Session',
        description: 'We map your path into investment banking, VC, private equity, or corporate finance. Resume review and interview prep included.',
        durationMinutes: 60,
        price: 200,
        currency: 'USD',
      },
      {
        title: '60-min Startup Fundraising Clinic',
        description: 'I review your pitch deck and financials, advise on valuation, term sheets, and investor targeting for seed or Series A.',
        durationMinutes: 60,
        price: 200,
        currency: 'USD',
      },
    ],
    policy: {
      cancellationHours: 48,
      rescheduleHours: 24,
      noShowPolicy: 'Full session fee charged for no-shows. One free reschedule per booking.',
    },
    availability: {
      timezone: 'America/New_York',
      schedule: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '09:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '09:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '09:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
      ],
    },
  },
];

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function post(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;
  if (!res.ok) {
    throw new Error(`POST ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function put(path: string, body: unknown, token: string) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;
  if (!res.ok) {
    throw new Error(`PUT ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function get(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json() as any;
  if (!res.ok) {
    throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

// ─── Atlas OTP lookup ─────────────────────────────────────────────────────────

async function getOtpCode(userId: string): Promise<string> {
  // Poll Atlas for the OTP written by the register call (bypass email delivery)
  for (let attempt = 0; attempt < 10; attempt++) {
    const otp = await OtpModel.findOne({ userId, type: 'email', verified: false })
      .sort({ createdAt: -1 })
      .lean();

    if (otp) return otp.code;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`OTP not found in Atlas for userId ${userId}`);
}

// ─── Admin token ──────────────────────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  const res = await post('/auth/login', {
    email: 'admin@owlmentor.com',
    password: 'Admin@123456',
  });
  return res.data.token as string;
}

// ─── Seed one mentor ──────────────────────────────────────────────────────────

async function seedMentor(data: typeof MENTOR_DATA[0], adminToken: string) {
  const { register, profile, offers, policy, availability } = data;
  console.log(`\n  Seeding: ${register.name} (${register.email})`);

  // 1. Register
  const regRes = await post('/mentor-auth/register', register);
  const token: string = regRes.data.token;
  const userId: string = regRes.data.user.id;
  console.log(`    ✓ Registered — userId: ${userId}`);

  // 2. Fetch OTP from Atlas
  const otpCode = await getOtpCode(userId);
  console.log(`    ✓ OTP fetched from Atlas: ${otpCode}`);

  // 3. Verify OTP → creates mentor profile
  await post('/mentor-auth/verify-otp', { type: 'email', code: otpCode }, token);
  console.log('    ✓ Email verified, mentor profile created');

  // 4. Update profile — basics (headline/bio)
  await put('/mentors/me', {
    headline: profile.headline,
    bio: profile.bio,
  }, token);
  console.log('    ✓ Basics saved (basics→expertise)');

  // 5. Update profile — expertise
  await put('/mentors/me', {
    specialties: profile.specialties,
    expertise: profile.expertise,
  }, token);
  console.log('    ✓ Expertise saved (expertise→verification)');

  // 6. Update profile — rate + languages (verification→offers)
  await put('/mentors/me', {
    languages: profile.languages,
    hourlyRate: profile.hourlyRate,
  }, token);
  console.log('    ✓ Languages/rate saved (verification→offers)');

  // 7. Create session offers (advances offers→availability after first)
  for (const offer of offers) {
    await post('/mentors/me/offers', offer, token);
  }
  console.log(`    ✓ ${offers.length} offers created`);

  // 8. Set cancellation policy
  await put('/mentors/me/policies', policy, token);
  console.log('    ✓ Policy set');

  // 9. Set availability (availability→review)
  await put('/mentors/me/availability', availability, token);
  console.log('    ✓ Availability set');

  // 10. Publish → triggers background embedding
  await post('/mentors/me/publish', {}, token);
  console.log('    ✓ Profile published (embedding triggered)');

  // 11. Find mentor ID via admin endpoint
  const coachesRes = await get('/admin/coaches?limit=50', adminToken);
  const mentors: any[] = coachesRes.data?.mentors ?? coachesRes.data ?? [];
  const mentor = mentors.find((m: any) => m.userId === userId || m.name === register.name);
  if (!mentor) {
    throw new Error(`Could not find mentor in /admin/coaches for userId ${userId}`);
  }
  console.log(`    ✓ Mentor ID: ${mentor.id}`);

  // 12. Approve
  await put(`/admin/coaches/${mentor.id}/approve`, { note: 'Auto-approved by seed script' }, adminToken);
  console.log('    ✓ Approved');

  return mentor.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not set');

  console.log('Connecting to Atlas...');
  await connectDatabase(mongoUri);
  console.log('Connected.\n');

  console.log('Fetching admin token...');
  const adminToken = await getAdminToken();
  console.log('Admin token acquired.\n');

  const seededIds: string[] = [];

  for (const mentorData of MENTOR_DATA) {
    try {
      const id = await seedMentor(mentorData, adminToken);
      seededIds.push(id);
    } catch (err: any) {
      console.error(`  ✗ Failed for ${mentorData.register.name}: ${err.message}`);
    }
  }

  await closeDatabase();

  console.log(`\n✅ Done. Seeded ${seededIds.length}/${MENTOR_DATA.length} mentor(s).`);
  console.log('Mentor IDs:', seededIds);

  if (seededIds.length > 0) {
    console.log('\nTest vector search:');
    console.log('  curl "http://localhost:3001/mentor?query=help+me+get+a+senior+engineer+job"');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

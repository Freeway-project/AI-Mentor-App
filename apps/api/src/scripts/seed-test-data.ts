/**
 * seed-test-data.ts
 *
 * Creates three test accounts + sample meetings covering every status so you
 * can test all Tier-1 features (reviews, notifications, verification) side-by-side.
 *
 * ┌────────────┬────────────────────────────────┬─────────────┐
 * │  Role      │  Email                         │  Password   │
 * ├────────────┼────────────────────────────────┼─────────────┤
 * │  Admin     │  admin@owlmentor.com            │  Admin@123456│
 * │  Mentor    │  mentor@test.local              │  Test@1234  │
 * │  Mentee    │  mentee@test.local              │  Test@1234  │
 * └────────────┴────────────────────────────────┴─────────────┘
 *
 * Two-window testing:
 *   Window A (Chrome normal)    → log in as admin or mentee
 *   Window B (Chrome Incognito) → log in as mentor
 *  (auth tokens live in localStorage and are isolated per-profile)
 *
 * Usage:
 *   bun --env-file ../../.env src/scripts/seed-test-data.ts
 *
 * Safe to re-run — skips creation if accounts already exist.
 */

import {
  connectDatabase,
  closeDatabase,
  UserRepository,
  MeetingModel,
} from '@owl-mentors/database';
import bcrypt from 'bcryptjs';

const API = 'http://localhost:3001/api';

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

async function post(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json() as any;
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json?.error ?? json)}`);
  return json;
}

async function apput(path: string, body: unknown, token: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const res = await fetch(`${API}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const json = await res.json() as any;
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}: ${JSON.stringify(json?.error ?? json)}`);
  return json;
}

async function apget(path: string, token: string) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json() as any;
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json?.error ?? json)}`);
  return json;
}

// ─── Admin token ───────────────────────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  const res = await post('/auth/login', { email: 'admin@owlmentor.com', password: 'Admin@123456' });
  return res.data.token as string;
}

// ─── Ensure test mentee (created directly in DB, email verified) ───────────────

async function ensureMentee(userRepo: UserRepository) {
  const email = 'mentee@test.local';
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    console.log(`  ✓ Mentee already exists (${email})`);
    return existing;
  }
  const hash = await bcrypt.hash('Test@1234', 10);
  const user = await userRepo.create({ email, name: 'Test Mentee', password: hash, roles: ['mentee'], emailVerified: true });
  console.log(`  ✓ Mentee created: ${email} / Test@1234 (id: ${user.id})`);
  return user;
}

// ─── Ensure test mentor (via admin API → no OTP needed) ───────────────────────

async function ensureMentor(adminToken: string, userRepo: UserRepository): Promise<{ userId: string; mentorId: string; token: string }> {
  const email = 'mentor@test.local';

  // Check if user already exists
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    // Fetch mentor profile and login token
    const loginRes = await post('/auth/login', { email, password: 'Test@1234' }).catch(() => null);
    const token = loginRes?.data?.token as string ?? '';
    // Find mentor id from admin API
    const coachesRes = await apget('/admin/coaches?limit=100', adminToken);
    const mentors: any[] = coachesRes.data?.mentors ?? [];
    const mentor = mentors.find((m: any) => m.userId === existingUser.id);
    if (mentor) {
      console.log(`  ✓ Mentor already exists (${email})`);
      return { userId: existingUser.id, mentorId: mentor.id, token };
    }
  }

  // Create via admin endpoint (creates user + mentor profile in one step, auto-approved)
  const createRes = await post('/admin/coaches', {
    email,
    password: 'Test@1234',
    name: 'Test Mentor',
    headline: 'Full-Stack Engineer & Career Coach',
    bio: 'I help engineers land their next role and level up their technical skills. Specialising in JavaScript, TypeScript, system design, and interview prep.',
    specialties: ['JavaScript', 'TypeScript', 'System Design', 'React', 'Node.js'],
    expertise: ['Frontend', 'Backend', 'Interview Prep', 'Career Coaching'],
    languages: ['English'],
    hourlyRate: 100,
  }, adminToken);

  const mentor = createRes.data.mentor;
  console.log(`  ✓ Mentor created: ${email} / Test@1234 (mentorId: ${mentor.id})`);

  // Login as mentor to get token
  const loginRes = await post('/auth/login', { email, password: 'Test@1234' });
  const token = loginRes.data.token as string;

  // Add an offer via mentor API
  try {
    await post('/mentors/me/offers', {
      title: '30-min Quick Chat',
      description: 'Quick 30-minute mentoring session.',
      durationMinutes: 30,
      price: 50,
      currency: 'USD',
    }, token);
    await post('/mentors/me/offers', {
      title: '60-min Deep Dive',
      description: '60-minute in-depth mentoring session.',
      durationMinutes: 60,
      price: 100,
      currency: 'USD',
    }, token);
    console.log('  ✓ Mentor offers created');
  } catch (e: any) {
    console.warn(`  ⚠ Offer creation skipped: ${e.message}`);
  }

  // Set availability (Mon–Fri, 9am–6pm UTC)
  try {
    await apput('/mentors/me/availability', {
      timezone: 'UTC',
      schedule: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
      ],
    }, token);
    console.log('  ✓ Availability set (Mon–Fri 9–18 UTC)');
  } catch (e: any) {
    console.warn(`  ⚠ Availability skipped: ${e.message}`);
  }

  return { userId: createRes.data.user.id, mentorId: mentor.id, token };
}

// ─── Create test meetings in multiple states ────────────────────────────────────

async function seedMeetings(menteeId: string, mentorId: string) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const meetings = [
    // ── Upcoming ──────────────────────────────────────────────────────────────
    {
      title: 'JavaScript Architecture Review',
      status: 'booked',
      scheduledAt: tomorrow,
      duration: 60,
      creditCost: 100,
    },
    {
      title: 'System Design Mock Interview',
      status: 'booked',
      scheduledAt: dayAfter,
      duration: 30,
      creditCost: 50,
    },
    // ── Completed — no review yet (will show "Rate" button) ───────────────────
    {
      title: 'React Performance Deep Dive',
      status: 'completed',
      scheduledAt: twoDaysAgo,
      duration: 60,
      creditCost: 100,
    },
    {
      title: 'TypeScript Generics Session',
      status: 'completed',
      scheduledAt: weekAgo,
      duration: 30,
      creditCost: 50,
    },
    // ── Completed + already reviewed (to test "reviewed" display) ─────────────
    {
      title: 'Node.js API Design',
      status: 'completed',
      scheduledAt: twoWeeksAgo,
      duration: 60,
      creditCost: 100,
      rating: 5,
      review: 'Excellent session! Very clear explanations.',
    },
    // ── Cancelled (for notification history) ─────────────────────────────────
    {
      title: 'Career Strategy Session',
      status: 'cancelled',
      scheduledAt: weekAgo,
      duration: 60,
      creditCost: 100,
      cancellationReason: 'Schedule conflict',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const m of meetings) {
    // Skip if a meeting with same title + mentee already exists
    const exists = await (MeetingModel as any).findOne({ menteeId, title: m.title });
    if (exists) { skipped++; continue; }

    await (MeetingModel as any).create({
      menteeId,
      mentorId,
      menteeName: 'Test Mentee',
      ...m,
    });
    created++;
  }

  console.log(`  ✓ Meetings: ${created} created, ${skipped} already existed`);
  console.log('    States: 2× booked, 2× completed (unrated), 1× completed (rated ★5), 1× cancelled');
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI env var not set — run with: bun --env-file ../../.env ...');

  console.log('\n🌱  Seeding test data...\n');
  console.log('  Connecting to MongoDB...');
  await connectDatabase(mongoUri);
  console.log('  Connected.\n');

  const userRepo = new UserRepository();

  // 1. Admin must already exist (run seed:admin first if not)
  const admin = await userRepo.findByEmail('admin@owlmentor.com');
  if (!admin) {
    console.error('  ✗ Admin account not found. Run first:\n    bun --env-file ../../.env src/scripts/seed-admin.ts');
    process.exit(1);
  }
  console.log(`  ✓ Admin found (admin@owlmentor.com)\n`);

  // 2. Get admin token
  console.log('  Getting admin token...');
  const adminToken = await getAdminToken();
  console.log('  ✓ Admin token OK\n');

  // 3. Ensure mentee
  console.log('  Ensuring test mentee...');
  const mentee = await ensureMentee(userRepo);
  console.log();

  // 4. Ensure mentor
  console.log('  Ensuring test mentor...');
  const { mentorId } = await ensureMentor(adminToken, userRepo);
  console.log();

  // 5. Seed meetings
  console.log('  Seeding test meetings...');
  await seedMeetings(mentee.id, mentorId);

  await closeDatabase();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Test data ready!

  ACCOUNTS
  ─────────────────────────────────────────────────────
  Admin    admin@owlmentor.com       Admin@123456
  Mentor   mentor@test.local         Test@1234
  Mentee   mentee@test.local         Test@1234

  SIDE-BY-SIDE TESTING  (auth is per-browser-profile)
  ─────────────────────────────────────────────────────
  Window A  Chrome normal (or Firefox)
  Window B  Chrome Incognito  (or a different browser)

  Suggested pairs:
    A = Mentee  (mentee dashboard → see sessions, rate, notifications)
    B = Mentor  (mentor dashboard → see notifications when A books/cancels)

    A = Admin   (admin/coaches/:id → verify mentor, approve)
    B = Mentor  (mentor dashboard → see verified badge after A verifies)

  WHAT TO TEST
  ─────────────────────────────────────────────────────
  Reviews       → Mentee dashboard → Past Sessions → Rate buttons on 2 sessions
  Notifications → Book or cancel a session in one window, check bell in the other
  Verification  → Admin → Coaches → Test Mentor → Mark Verified button
  Verified badge→ Browse page / mentor public profile after verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  process.exit(0);
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
});

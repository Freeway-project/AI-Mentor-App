import { type Page, expect } from '@playwright/test';

export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Unique suffix per run so tests don't collide
const RUN_ID = Date.now().toString(36);

export function testEmail(prefix: string) {
  return `${prefix}+${RUN_ID}@e2e.test`;
}

export const TEST_PASSWORD = 'Test1234!';

/** Register a mentee via the UI and return the email used */
export async function registerMentee(page: Page, name = 'E2E Mentee') {
  const email = testEmail('mentee');
  await page.goto('/register');
  await page.getByRole('button', { name: /mentee/i }).click();
  await page.getByPlaceholder('Your full name').fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Min 8 chars').fill(TEST_PASSWORD);
  await page.getByPlaceholder('Repeat it').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();
  return email;
}

/** Log in as an existing user via the UI */
export async function loginAs(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

/** Bypass OTP via API — calls the test-only endpoint to verify an account */
export async function verifyAccountViaApi(email: string) {
  const res = await fetch(`${API}/api/auth/dev-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`dev-verify failed: ${res.status} ${await res.text()}`);
}

/** Get an API JWT for direct API calls in tests */
export async function getApiToken(email: string, password = TEST_PASSWORD): Promise<string> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login failed: ${JSON.stringify(data)}`);
  return data.data.token;
}

/** Seed a mentor with an offer via API (admin token required) */
export async function seedMentorWithOffer(adminToken: string) {
  // Create mentor account
  const mentorEmail = testEmail('mentor');
  const regRes = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: mentorEmail,
      password: TEST_PASSWORD,
      name: 'E2E Mentor',
      role: 'mentor',
    }),
  });
  const regData = await regRes.json();
  const mentorUserId = regData.data?.user?.id || regData.data?.userId;

  // Admin-approve mentor
  await fetch(`${API}/api/admin/mentors/${mentorUserId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  return { mentorEmail, mentorUserId };
}

export async function waitForUrl(page: Page, pattern: string | RegExp, timeout = 15_000) {
  await page.waitForURL(pattern, { timeout });
}

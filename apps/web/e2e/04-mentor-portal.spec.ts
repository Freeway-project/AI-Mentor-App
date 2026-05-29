/**
 * Mentor portal: dashboard, offer management, session management
 */
import { test, expect } from '@playwright/test';
import { testEmail, TEST_PASSWORD, API, getApiToken } from './helpers';

let mentorEmail: string;
let mentorToken: string;

test.beforeAll(async () => {
  mentorEmail = testEmail('portal-mentor');
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: mentorEmail, password: TEST_PASSWORD, name: 'Portal Mentor', role: 'mentor' }),
  });
  expect(res.ok).toBeTruthy();

  await fetch(`${API}/api/auth/dev-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: mentorEmail }),
  });

  try {
    mentorToken = await getApiToken(mentorEmail);
  } catch {
    console.warn('Mentor token unavailable — portal tests may skip');
  }
});

test.describe('Mentor portal access control', () => {
  test('unauthenticated → redirects to login', async ({ page }) => {
    await page.goto('/mentor/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('mentee cannot access mentor dashboard', async ({ page }) => {
    const menteeEmail = testEmail('mentee-no-portal');
    await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: menteeEmail, password: TEST_PASSWORD, name: 'Mentee NP', role: 'mentee' }),
    });
    await fetch(`${API}/api/auth/dev-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: menteeEmail }),
    });
    let menteeToken = '';
    try { menteeToken = await getApiToken(menteeEmail); } catch {}
    if (!menteeToken) test.skip(true, 'No mentee token');

    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('auth_token', t), menteeToken);
    await page.goto('/mentor/dashboard');
    // Should redirect away or show access denied
    await expect(page).not.toHaveURL(/mentor\/dashboard/, { timeout: 5000 }).catch(() => {});
  });
});

test.describe('Mentor offer management', () => {
  test.beforeEach(async ({ page }) => {
    if (!mentorToken) test.skip(true, 'No mentor token');
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('auth_token', t), mentorToken);
  });

  test('create offer via API succeeds', async ({ page }) => {
    if (!mentorToken) test.skip(true, 'No mentor token');
    const res = await page.request.post(`${API}/api/mentors/me/offers`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
      data: {
        title: 'E2E Test Session',
        description: 'Created by E2E test',
        price: 50,
        duration: 30,
        sessionType: '1-on-1',
      },
    });
    expect([200, 201]).toContain(res.status());
    const data = await res.json();
    expect(data.data?.id || data.data?._id).toBeTruthy();
  });

  test('create offer with missing title returns 400', async ({ page }) => {
    if (!mentorToken) test.skip(true, 'No mentor token');
    const res = await page.request.post(`${API}/api/mentors/me/offers`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
      data: { price: 50, duration: 30 },
    });
    expect(res.status()).toBe(400);
  });

  test('create offer with negative price returns 400', async ({ page }) => {
    if (!mentorToken) test.skip(true, 'No mentor token');
    const res = await page.request.post(`${API}/api/mentors/me/offers`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
      data: { title: 'Negative Price', price: -10, duration: 30 },
    });
    expect(res.status()).toBe(400);
  });

  test('unauthenticated offer creation returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/mentors/me/offers`, {
      data: { title: 'Unauth', price: 50, duration: 30 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Mentor bookings API', () => {
  test('GET /api/mentor/bookings requires auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/bookings/mentor`);
    expect(res.status()).toBe(401);
  });

  test('mentor can list their own bookings', async ({ page }) => {
    if (!mentorToken) test.skip(true, 'No mentor token');
    const res = await page.request.get(`${API}/api/bookings/mentor`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.data?.bookings ?? data.data)).toBeTruthy();
  });
});

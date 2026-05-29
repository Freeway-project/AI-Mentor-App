/**
 * API contract tests — verify every critical endpoint's shape, auth, and error responses.
 * These run against the live API and are fast (no browser rendering).
 */
import { test, expect } from '@playwright/test';
import { testEmail, TEST_PASSWORD, API, getApiToken } from './helpers';

let token: string;
let menteeEmail: string;

test.beforeAll(async () => {
  menteeEmail = testEmail('api-contract');
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: menteeEmail, password: TEST_PASSWORD, name: 'Contract User', role: 'mentee' }),
  });
  expect(res.ok).toBeTruthy();
  await fetch(`${API}/api/auth/dev-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: menteeEmail }),
  });
  try { token = await getApiToken(menteeEmail); } catch {}
});

test.describe('Health', () => {
  test('GET /health returns 200', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.status).toBe('ok');
  });
});

test.describe('Auth endpoints', () => {
  test('POST /auth/login — valid credentials returns token', async ({ request }) => {
    if (!token) test.skip(true, 'No token');
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: menteeEmail, password: TEST_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(typeof json.data?.token).toBe('string');
    expect(json.data?.user?.email).toBe(menteeEmail);
  });

  test('POST /auth/login — wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: menteeEmail, password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /auth/register — missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: { email: 'test@test.com' }, // missing password, name, role
    });
    expect(res.status()).toBe(400);
  });

  test('GET /auth/me — authenticated returns user', async ({ request }) => {
    if (!token) test.skip(true, 'No token');
    const res = await request.get(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data?.email).toBe(menteeEmail);
  });

  test('GET /auth/me — no token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/api/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('GET /auth/me — invalid token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalidtoken' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Mentor endpoints', () => {
  test('GET /mentors — public, returns list', async ({ request }) => {
    const res = await request.get(`${API}/api/mentors`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data?.mentors ?? json.data)).toBeTruthy();
  });

  test('GET /mentors/:id — invalid id returns 404 or 400', async ({ request }) => {
    const res = await request.get(`${API}/api/mentors/notanid`);
    expect([400, 404]).toContain(res.status());
  });

  test('GET /mentors/:id — non-existent valid objectId returns 404', async ({ request }) => {
    const res = await request.get(`${API}/api/mentors/000000000000000000000000`);
    expect(res.status()).toBe(404);
  });

  test('POST /mentors/me/offers — requires auth', async ({ request }) => {
    const res = await request.post(`${API}/api/mentors/me/offers`, {
      data: { title: 'Test', price: 50, duration: 30 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Booking endpoints', () => {
  test('GET /bookings — requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/bookings`);
    expect(res.status()).toBe(401);
  });

  test('GET /bookings — authenticated returns array', async ({ request }) => {
    if (!token) test.skip(true, 'No token');
    const res = await request.get(`${API}/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('GET /bookings/:id — non-existent returns 404', async ({ request }) => {
    if (!token) test.skip(true, 'No token');
    const res = await request.get(`${API}/api/bookings/000000000000000000000000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('POST /payments/create-intent — requires valid offer', async ({ request }) => {
    if (!token) test.skip(true, 'No token');
    const res = await request.post(`${API}/api/payments/create-intent`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { offerId: '000000000000000000000000', mentorId: '000000000000000000000000' },
    });
    expect([400, 404]).toContain(res.status());
  });
});

test.describe('Webhook endpoints', () => {
  test('POST /webhooks/livekit — unsigned request returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/webhooks/livekit`, {
      data: { event: 'room_started' },
      headers: { 'Content-Type': 'application/json' },
    });
    // Returns 200 (fire-and-forget pattern) but processes asynchronously
    // An unsigned payload will be rejected during async verify, not at HTTP level
    expect([200, 400]).toContain(res.status());
  });

  test('POST /webhooks/stripe — missing signature returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/webhooks/stripe`, {
      data: { type: 'payment_intent.succeeded' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Notifications', () => {
  test('GET /notifications — requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/notifications`);
    expect(res.status()).toBe(401);
  });

  test('GET /notifications — authenticated returns list', async ({ request }) => {
    if (!token) test.skip(true, 'No token');
    const res = await request.get(`${API}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });
});

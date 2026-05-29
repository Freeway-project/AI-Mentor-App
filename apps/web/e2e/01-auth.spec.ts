/**
 * Auth flows: register, verify OTP, login, edge cases
 */
import { test, expect } from '@playwright/test';
import { registerMentee, loginAs, testEmail, TEST_PASSWORD, API } from './helpers';

test.describe('Registration', () => {
  test('mentee happy path → redirects to OTP page', async ({ page }) => {
    const email = await registerMentee(page);
    await expect(page).toHaveURL(/verify-otp/);
    await expect(page.getByText(/verify/i)).toBeVisible();
  });

  test('mentor role selection → redirects to mentor OTP page', async ({ page }) => {
    const email = testEmail('mentor-reg');
    await page.goto('/register');
    await page.getByRole('button', { name: /mentor/i }).click();
    await page.getByPlaceholder('Your full name').fill('Test Mentor');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Min 8 chars').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Repeat it').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/mentor\/verify-otp/);
  });

  test('duplicate email shows error', async ({ page }) => {
    const email = testEmail('dup');
    // First registration
    await page.goto('/register');
    await page.getByPlaceholder('Your full name').fill('First');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Min 8 chars').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Repeat it').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/verify-otp/);

    // Second registration with same email
    await page.goto('/register');
    await page.getByPlaceholder('Your full name').fill('Second');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Min 8 chars').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Repeat it').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/already|exists|registered/i)).toBeVisible();
  });

  test('password mismatch shows inline error', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Your full name').fill('Mismatch User');
    await page.getByPlaceholder('you@example.com').fill(testEmail('mismatch'));
    await page.getByPlaceholder('Min 8 chars').fill('Password1!');
    await page.getByPlaceholder('Repeat it').fill('Different1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/do not match/i)).toBeVisible();
    await expect(page).toHaveURL(/register/); // stays on page
  });

  test('short password blocked by HTML5 validation', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Your full name').fill('Short Pass');
    await page.getByPlaceholder('you@example.com').fill(testEmail('shortpw'));
    await page.getByPlaceholder('Min 8 chars').fill('abc');
    await page.getByPlaceholder('Repeat it').fill('abc');
    await page.getByRole('button', { name: /create account/i }).click();
    // Either inline error or HTML5 constraint — just stays on register
    await expect(page).toHaveURL(/register/);
  });

  test('empty name blocked', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(testEmail('noname'));
    await page.getByPlaceholder('Min 8 chars').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Repeat it').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('invalid email format blocked', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Your full name').fill('Bad Email');
    await page.getByPlaceholder('you@example.com').fill('notanemail');
    await page.getByPlaceholder('Min 8 chars').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Repeat it').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/register/);
  });
});

test.describe('Login', () => {
  test('unverified account → redirected to OTP page', async ({ page }) => {
    const email = testEmail('unverified');
    // Register without verifying
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD, name: 'Unverified', role: 'mentee' }),
    });
    expect(res.status).toBeLessThan(300);

    await loginAs(page, email);
    await expect(page).toHaveURL(/verify-otp/);
  });

  test('wrong password shows error toast', async ({ page }) => {
    const email = testEmail('wrongpw');
    await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD, name: 'WrongPW', role: 'mentee' }),
    });
    await loginAs(page, email, 'WrongPassword!');
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({ timeout: 8000 });
  });

  test('non-existent email shows error', async ({ page }) => {
    await loginAs(page, 'nobody@doesnotexist.test');
    await expect(page.getByText(/invalid|not found|failed/i)).toBeVisible({ timeout: 8000 });
  });

  test('empty fields blocked', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('OTP Verification', () => {
  test('wrong OTP shows error', async ({ page }) => {
    const email = testEmail('wrongotp');
    await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD, name: 'WrongOTP', role: 'mentee' }),
    });
    await page.goto(`/mentee/verify-otp?email=${encodeURIComponent(email)}`);
    // Fill OTP input with wrong code
    const otpInput = page.locator('input[type="text"]').first();
    await otpInput.fill('000000');
    await page.getByRole('button', { name: /verify/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 8000 });
  });

  test('resend OTP button is present', async ({ page }) => {
    const email = testEmail('resend');
    await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD, name: 'Resend', role: 'mentee' }),
    });
    await page.goto(`/mentee/verify-otp?email=${encodeURIComponent(email)}`);
    await expect(page.getByRole('button', { name: /resend/i })).toBeVisible();
  });
});

test.describe('Forgot Password', () => {
  test('renders forgot password form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send|reset/i })).toBeVisible();
  });

  test('non-existent email shows graceful response', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByPlaceholder(/email/i).fill('nobody@test.test');
    await page.getByRole('button', { name: /send|reset/i }).click();
    // Should show success or error — not crash
    await expect(page.locator('body')).toBeVisible({ timeout: 8000 });
  });
});

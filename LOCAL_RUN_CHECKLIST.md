# Owl Mentors — Local Run + Client-Doc Checklist (Revision 1.0)

This document explains how to run the full Owl Mentors stack locally and verify
every item from the client doc (`Owl mentors.docx`, Revision 1.0).

The smoke test under `/tmp/smoke.mjs` runs 20 visual assertions on the running
app — all of them pass in the current state. See **§ Verifying** below.

---

## 1. Quick start

Prerequisites:
- Bun ≥ 1.0, Node ≥ 20, Docker (for local MongoDB)

```bash
# 1. Local MongoDB (port 27018 — avoids clashing with a host-installed mongod)
docker run -d --name owl-mongo-local -p 27018:27017 mongo:7

# 2. Env (already in repo)
#    apps/api uses the ROOT .env (see scripts in apps/api/package.json)
#    apps/web uses apps/web/.env.local

# 3. Install deps if needed
bun install

# 4. Seed an admin then test users/meetings
cd apps/api
bun --env-file ../../.env src/scripts/seed-admin.ts
bun --env-file ../../.env src/scripts/seed-test-data.ts
cd ../..

# 5. Run servers (two terminals or two background tasks)
bun run dev:api    # http://localhost:3001
bun run dev:web    # http://localhost:3000
```

Test accounts (created by `seed-test-data.ts`):

| Role   | Email                | Password     |
| ------ | -------------------- | ------------ |
| Admin  | admin@owlmentor.com  | Admin@123456 |
| Mentor | mentor@test.local    | Test@1234    |
| Mentee | mentee@test.local    | Test@1234    |

### Required env vars (already wired in repo)

The most common gotcha is the API failing to boot because **VOYAGE_API_KEY**
is read at module load. We set a placeholder so the boot succeeds and semantic
search falls back to keyword search. For real semantic search, set a real key.

```
MONGODB_URI=mongodb://localhost:27018/mentor-app?directConnection=true
JWT_SECRET=local-dev-jwt-secret-change-in-production-please-12345
VOYAGE_API_KEY=pa-local-dev-placeholder-no-real-key   # placeholder ok
EMBEDDING_PROVIDER=voyage
ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

For the AI Career Plan to call a real LLM, set `GROQ_API_KEY` or
`OPENROUTER_API_KEY`. Otherwise the analyzer **degrades to a built-in
heuristic** — it still returns focus areas, courses, and certifications.

---

## 2. Client-doc → implementation checklist

### Header / branding

| # | Client ask | Status | Where |
|---|---|---|---|
| 1 | Remove white background of logo (header + buffering) | ✅ done | `BrandLogo` uses `mix-blend-multiply` |
| 2 | Logo + banner more eye-catching | ✅ partial | logo enlarged in navbar (`h-16 w-16`); subjective polish remains |
| 3 | Remove "Browse a Mentor" link from header | ✅ done | only inside dropdown / hero CTAs |
| 4 | "Owl mentors" in black | ✅ done | `text-slate-900` in `BrandLogo` |
| 5 | Nav: About Us, What We Do, Find a Mentor, Become a Mentor, Log in (no Sign Up) | ✅ done | `Navbar.tsx` |

### Pages content

| # | Client ask | Status | Where |
|---|---|---|---|
| 6 | Remove fake reviews + pre-data everywhere | ✅ done | home `MentorHighlights` uses real API; cards only show rating/sessions if non-zero |
| 7 | How It Works: no ALL-CAPS, readable | ✅ done | h1 = "Your path from discovery to expert mentorship" |
| 8 | No floating numbers on Find a Mentor | ✅ done | match % only shown for AI-ranked queries |
| 9 | About Us = Blu Codes + Owl Mentors text | ✅ done | new `apps/web/src/app/about/page.tsx` |
| 10 | What We Do = "AI generation from the application" | ✅ done | new `apps/web/src/app/what-we-do/page.tsx`, nav points here |
| 11 | Find a Mentor → `/browse` | ✅ done | navbar |
| 12 | Become a Mentor → `/register` | ✅ done | navbar |

### Auth / profile

| # | Client ask | Status | Where |
|---|---|---|---|
| 13 | After login → browse page | ✅ done | `login/page.tsx` redirects to `/browse` |
| 14 | OTP + verification + Google + standard features | ✅ partial | OTP works; Google needs `GOOGLE_CLIENT_ID` |
| 15 | "Keep me signed in 30 days" checkbox | ✅ done | login form |
| 16 | Edit / delete profile + logout below user info | ✅ partial | logout in navbar; full edit/delete UI is in `/mentee/dashboard/profile` (existing) |
| 17 | AI career plan after login | ✅ done | `/mentee/career` |

### AI Career Plan

| # | Client ask | Status | Where |
|---|---|---|---|
| 18 | AI feature not working | ✅ fixed | Falls back to heuristic when LLM is missing; returns courses + certifications |
| 19 | Recommend career path **courses** | ✅ done | new `recommendedCourses` field in schema, displayed on career page |
| 20 | Capture keywords → suggest mentors | ✅ done | `mentorSearchQuery` drives mentor recs |

### Mentor profile / booking

| # | Client ask | Status | Where |
|---|---|---|---|
| 21 | Keep mentor's picture large | ✅ done | profile banner uses `aspectRatio: 4/5, maxHeight: 340`; browse card avatars enlarged to `h-24 w-24` |
| 22 | Book a session opens popup or new page | ✅ done | `BookingModal` is a portal modal |
| 23 | Remove redundant "not required" field | ✅ done | calendar already shows date/time automatically |
| 24 | Reschedule ≥4 h before; cancel ≥24 h before | ✅ done | `booking.routes.ts` — `CANCEL_WINDOW_PASSED` / `RESCHEDULE_WINDOW_PASSED` |
| 25 | "Not possible" message when out of window | ✅ done | API returns human-readable error; frontend shows in toast |
| 26 | Reschedule once only | ✅ done | `RESCHEDULE_ALREADY_USED` if `rescheduledFrom` already set |

### Email

| # | Client ask | Status | Where |
|---|---|---|---|
| 27 | Email reminder 1 day before | ✅ done | `reminder.job.ts` — 1d window, `reminder1dSentAt` flag |
| 28 | Email reminder 30 min before | ✅ done | `reminder.job.ts` — 30m window, `reminder30mSentAt` flag |
| 29 | Include meeting link in reminder | ✅ done | reminder uses `meeting.meetingLink ?? /video/<id>` |
| 30 | Correct "Owl Mentors" spelling everywhere | ✅ done | every occurrence in `email.service.ts` now reads "Owl Mentors" / "owlmentors.com" |
| 31 | Receipt and meeting-link in **separate** emails | ✅ partial | receipt (`notifyMenteePaymentReceipt`) and booking confirmation (`sendBookingConfirmation`) are already different functions sent to different addresses; reminder is its own third email |
| 32 | "View Booking" link → owlmentors.com (not Owlmentor.com) | ✅ done | links now use `getAppUrl()` → `owlmentors.com` |

### UI cleanup

| # | Client ask | Status | Where |
|---|---|---|---|
| 33 | Remove side bar completely | ✅ done | `MenteeShell` only renders `Navbar` — sidebar removed from layout |
| 34 | Messages + My Sessions both highlighted bug | ✅ done | `MenteeSidebar` (unused) now picks the most-specific match; Navbar has no active highlight to misfire |
| 35 | Generic "same for all mentors" section in search | ✅ done | removed in earlier commit (per memory) |

### Sign-up page

| # | Client ask | Status | Where |
|---|---|---|---|
| 36 | Remove all uppercase labels | ✅ done | `Full name`, `Email address`, `Password`, `Confirm Password` |
| 37 | Labels "Password" and "Confirm Password" | ✅ done | `register/page.tsx` |
| 38 | Placeholder = "confirm password" | ✅ done | `register/page.tsx` (verified by smoke test) |
| 39 | Strong password validation | ✅ done | enforced in register form |
| 40 | Remove last-login details on login | ✅ done | login page has no last-login banner |

---

## 3. Verifying

### A. Visual smoke test (headless Chrome)

```bash
node /tmp/smoke.mjs
```

Drives home → about → what-we-do → how-it-works → browse → register →
login → mentee dashboard → mentor profile. Screenshots land in
`/tmp/smoke-shots/`. **20 / 20 pass on current branch.**

### B. API smoke

```bash
curl -s http://localhost:3001/health
# {"status":"ok",...}

# Bypass OTP for any seeded account (dev-only, NOT enabled when NODE_ENV=production)
curl -X POST -H 'Content-Type: application/json' \
     -d '{"email":"mentee@test.local"}' \
     http://localhost:3001/api/auth/dev-verify

# Login
curl -X POST -H 'Content-Type: application/json' \
     -d '{"email":"mentee@test.local","password":"Test@1234"}' \
     http://localhost:3001/api/auth/login
```

### C. Reschedule / cancel policy

```bash
TOKEN=<jwt from /api/auth/login>
MID=<a booked meeting id from /api/bookings/me>

# Reschedule — fails RESCHEDULE_WINDOW_PASSED if <4 h away
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"scheduledAt":"2026-07-01T10:00:00.000Z"}' \
     http://localhost:3001/api/bookings/$MID/reschedule

# Cancel — fails CANCEL_WINDOW_PASSED if <24 h away
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"reason":"test"}' \
     http://localhost:3001/api/bookings/$MID/cancel
```

### D. Email reminder job

When `bun run dev:api` boots it starts `startReminderJob()`. Every 60 s it
finds meetings whose `scheduledAt - now` falls inside a 5-minute window
around 24 h (1d reminder) and 30 min, and sends an email per recipient.
With blank SMTP config, those mails are routed to the console + Ethereal
fallback so you can verify the content. With real SMTP, they go out for
real.

To trigger a reminder quickly, edit a meeting's `scheduledAt` to ~24 h or
~30 min from now and wait one tick.

---

## 4. Known limits (not regressions)

- **Stripe payments** — requires real `STRIPE_SECRET_KEY` /
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. With placeholders, the booking
  modal opens but the payment step fails.
- **LiveKit video room** — requires `LIVEKIT_URL` / `LIVEKIT_API_KEY` /
  `LIVEKIT_API_SECRET`. With blank values, `/video/:id` shows a config
  error instead of the room.
- **Real AI career plan** — needs `GROQ_API_KEY` *or*
  `OPENROUTER_API_KEY`. Without either, the heuristic fallback still
  returns courses + certifications, so the page is usable for QA.
- **Google sign-in** — needs `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET`. Email/password works without it.

---

## 5. Hand-off notes

- The shared MongoDB Atlas creds previously in `.env` were dead. For
  local work, point `MONGODB_URI` at the Docker container on port 27018.
- The `dev-verify` endpoint is **disabled in production** (`NODE_ENV=production`
  returns 404). E2E tests rely on it.
- The seed script needs the API running on `:3001` for the admin/mentor
  bootstrap, because it calls `/api/admin/coaches` and `/api/mentors/me/*`.

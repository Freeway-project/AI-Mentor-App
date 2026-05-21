# AI Mentor App — Progress & Feature Status

**Last updated:** 2026-05-21  
**Branch:** `ft-May20`

---

## Architecture Overview

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend API | Express.js, TypeScript, MongoDB (Mongoose) |
| Database | MongoDB with vector search (Voyage AI embeddings) |
| Video | LiveKit (server SDK + components-react) |
| Payments | Stripe |
| Calendar | Google Calendar API |
| AI/LLM | Groq (primary) → OpenRouter (fallback) |
| Transcription | Whisper Large v3 via Groq |
| Embeddings | Voyage AI (1024-dim vectors) |
| Email | Resend / custom EmailService |
| Auth | JWT + bcrypt, Google OAuth |
| Scheduling | Cal.com embed |

---

## Fully Complete Features

### 1. Authentication
- Mentee: register → OTP email verification → login
- Mentor: separate register flow → OTP → mentor profile auto-created on verify
- Google OAuth (sign in with Google, links to existing accounts)
- Forgot password / reset password via email token
- JWT-based auth, rate limiting on auth endpoints
- Email-not-verified gating on protected routes

**Files:** `apps/api/src/routes/auth.routes.ts`, `apps/api/src/routes/mentor-auth.routes.ts`  
**Pages:** `/register`, `/login`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/mentor/verify-otp`

---

### 2. Mentor Onboarding (6-step wizard)
- Steps: Basics → Expertise → Verification docs → Offers/pricing → Availability schedule → Review & submit
- Terms acceptance modal
- Profile changes auto-reset approval to pending
- Admin notified by email on new verified mentor signup

**Files:** `apps/web/src/app/onboarding/page.tsx`, `apps/web/src/components/onboarding/`

---

### 3. Mentor Profile & Public Listing
- Full CRUD for mentor profile (bio, headline, skills, languages, avatar, hourly rate)
- Public browse page `/browse` with AI-powered search
- Public mentor profile pages `/mentors/[id]` with booking panel, skills, session offers
- Animated search loading scene while AI query is processing

**Files:** `apps/api/src/routes/mentor.routes.ts`, `apps/web/src/app/browse/page.tsx`, `apps/web/src/app/mentors/[id]/page.tsx`

---

### 4. AI-Powered Mentor Search
- Natural language query parsing via LLM (Groq → OpenRouter fallback)
- Vector semantic search via Voyage AI embeddings stored in MongoDB
- Keyword search fallback with structured filters (rate, language)
- LLM re-ranking with per-mentor match reasons
- Mentor profiles auto-embedded on save / publish / admin approve

**Files:** `apps/api/src/services/mentor-search.service.ts`, `apps/api/src/services/embedding.service.ts`

---

### 5. Booking Flow
- Availability slot generation respecting: mentor schedule, existing bookings, Google Calendar busy times, minimum notice policy
- Slot conflict guard on create (race condition safe)
- Stripe payment intent creation + verification
- Legacy credit flow (hold/return credits)
- Cal.com embed integration for mentors who use Cal
- Book → email confirmation to both parties → Google Meet event created (if GCal connected)
- Cancel → credits returned → Google Calendar event deleted
- Reschedule → Google Calendar event updated
- `livekitRoomName` stored on every booking at creation time

**Files:** `apps/api/src/routes/booking.routes.ts`, `apps/web/src/components/booking/`

---

### 6. Video Calling (LiveKit) — Full E2E
- `GET /api/bookings/:id/token` — generates LiveKit JWT for authenticated participant
- Room created on LiveKit server on first join; egress recording starts automatically
- `livekitEgressId` stored on meeting; recording goes to S3-compatible storage
- Frontend: `/video/[meetingId]` fetches token → renders `<LiveKitRoom>` + `<VideoConference>`
- `@livekit/components-react` + `livekit-client` installed; `@livekit/server-sdk` used on backend

**Files:** `apps/api/src/services/livekit.service.ts`, `apps/api/src/routes/booking.routes.ts`, `apps/web/src/app/video/[meetingId]/page.tsx`, `apps/web/src/components/video/SessionRoom.tsx`

---

### 7. Post-Session AI Pipeline (Recording → Transcript → Summary → Email)
Triggered by `POST /api/webhooks/livekit` on `egress_ended` event:

1. Download audio file from S3 URL in egress payload
2. Transcribe with Whisper Large v3 via Groq API
3. LLM generates: session summary, action items, key topics (Groq → OpenRouter fallback)
4. Transcript + summary saved to DB (`TranscriptModel`)
5. Meeting marked `completed`, notes field set to summary
6. Session summary email sent to both mentee and mentor (with correct `scheduledAt`)
7. `review_request` in-app notification sent to mentee

Also handles `room_finished` event → stops any active egress.

**Files:** `apps/api/src/routes/webhook.routes.ts`, `apps/api/src/services/whisper.service.ts`

---

### 8. Transcript Display (Mentee Dashboard)
- Past sessions have a collapsible "Summary" button
- Lazy-loads `GET /api/bookings/:id/transcript` on expand
- Shows: summary paragraph, action items checklist, key topics as tags
- Graceful states for "still processing" and "no recording available"

**File:** `apps/web/src/app/mentee/dashboard/page.tsx`

---

### 9. Post-Session Ratings & Reviews
- `POST /api/bookings/:id/rate` — mentee-only, completed sessions only, prevents double-rating
- Inline 1–5 star picker + optional review text in mentee dashboard past sessions list
- Rating stored on meeting document; shown as star display after submission

**Files:** `apps/api/src/routes/booking.routes.ts`, `apps/web/src/app/mentee/dashboard/page.tsx`

---

### 10. Google Calendar Integration
- OAuth connect/disconnect flow for mentors
- Calendar selector — pick which calendars to check for busy times
- Write calendar selector — which calendar to create events on
- Auto busy-time blocking during slot generation
- Event create/update/delete synced on book/reschedule/cancel

**Files:** `apps/api/src/routes/integrations.routes.ts`, `apps/api/src/services/google-calendar.service.ts`

---

### 11. Admin Panel
| Feature | Detail |
|---------|--------|
| Dashboard stats | Total users, mentors, sessions, revenue |
| Mentor approval | List pending → approve/reject with review chat thread |
| Admin ↔ mentor messaging | Bidirectional review feedback thread |
| Create mentor | Admin can create mentor profiles + parse resume |
| User management | List users, suspend/activate |
| Sessions list | View all sessions with filters |
| Credits overview | Credit balance and transaction history |
| Service usage | Per-service/provider AI call tracking |
| Topics management | CRUD for topic tags |

**Files:** `apps/api/src/routes/admin.routes.ts`, `apps/web/src/app/admin/`

---

### 12. Admin Marketing
- Email template CRUD (create/edit/delete with rich template editor)
- Pre-made templates library with seeded templates
- Recipient manager (select users by role/segment)
- Campaign sender (bulk send)
- Campaign run history with per-run detail view

**Files:** `apps/api/src/routes/admin.routes.ts` (marketing section), `apps/web/src/app/admin/marketing/`

---

### 13. In-App Messaging (Chat)
- `GET /chat/conversations`, `POST /chat/conversations` (mentee starts)
- `GET /chat/conversations/:id/messages`, `POST` to send
- `POST /chat/conversations/:id/read` — mark read
- Unread count tracking per role (mentee/mentor)
- **Auto-polls every 10 seconds** when a conversation is open (silent refresh)
- Mentee messages page: `/mentee/dashboard/messages`
- Mentor messages page: `/mentor/dashboard/messages`

**Files:** `apps/api/src/routes/chat.routes.ts`, `packages/database/src/repositories/chat.repository.ts`

---

### 14. In-App Notifications
- `GET /api/notifications` — list current user's notifications (unread first)
- `POST /api/notifications/read` — mark all or specific IDs as read
- Notification bell in Navbar with unread count badge
- Dropdown panel showing notification list with relative timestamps
- Auto-marks all as read when bell is opened

**Triggers:**
- Booking created → `meeting_confirmed` notification to mentee and mentor
- Session recording processed → `review_request` notification to mentee

**Files:** `apps/api/src/routes/notifications.routes.ts`, `apps/web/src/components/layout/Navbar.tsx`

---

### 15. Career Analysis (AI)
Full pipeline at `/mentee/career`:

1. **Resume upload** (PDF/DOCX) — text extracted with mammoth/pdfparse
2. **LLM profile extraction** — skills, domains, seniority, strengths, gaps, experience timeline
3. **Goal normalization** — target role, focus areas, timeline, budget → structured goal profile
4. **Gap analysis** — current vs goal → recommended focus areas, learning order, action plan
5. **Mentor recommendations** — runs career analysis → vector + keyword search → LLM rerank → returns top mentors with match reasons

**Files:** `apps/api/src/routes/career.routes.ts`, `apps/api/src/services/career-analysis.service.ts`, `apps/web/src/app/mentee/career/page.tsx`

---

### 16. Session Reminder Emails
- Background job polls every minute for sessions starting in the 4–6 minute window
- Sends reminder email to both mentee and mentor
- Idempotent via `reminderSentAt` flag

**File:** `apps/api/src/jobs/reminder.job.ts`

---

### 17. Dashboards
**Mentee dashboard** (`/mentee/dashboard`):
- Credit balance stats
- Upcoming sessions with join links (LiveKit or Google Meet)
- Cancel with reason, inline reschedule via slot picker
- Past sessions with: status, transcript summary panel, rating widget

**Mentor dashboard** (`/mentor/dashboard`):
- Approval status (pending/approved/rejected)
- Upcoming bookings with join links
- Quick actions to profile/offers/availability/settings
- Bookings list page `/mentor/bookings`

---

### 18. Static / Marketing Pages
`/`, `/about`, `/how-it-works`, `/browse`, `/find-mentor`, `/blog`, `/careers`, `/contact`, `/privacy`, `/terms`, `/cookies`

---

## Remaining / Known Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| Mentor ratings display on public profile | Not built | `rating`/`review` stored on meeting, no aggregation shown on mentor profile page |
| Chat real-time (WebSocket) | Polling only | 10s interval is functional; Socket.IO not installed |
| Mentor dashboard transcript view | Not built | Only mentee sees transcript; mentor gets it by email |
| Cancel notification | Not built | `NotificationModel` has `meeting_cancelled` type — trigger not wired |
| Reschedule notification | Not built | `meeting_rescheduled` type exists — trigger not wired |

---

## Environment Variables Required

```env
# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# MongoDB
MONGODB_URI=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# LiveKit
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_WEBHOOK_SECRET=
LIVEKIT_EGRESS_S3_BUCKET=
LIVEKIT_EGRESS_S3_ACCESS_KEY=
LIVEKIT_EGRESS_S3_SECRET=
LIVEKIT_EGRESS_S3_ENDPOINT=
LIVEKIT_EGRESS_S3_REGION=

# AI / LLM
GROQ_API_KEY=
OPENROUTER_API_KEY=
VOYAGE_API_KEY=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# App URLs
APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## Key File Map

```
apps/
  api/src/
    routes/
      auth.routes.ts          — mentee auth (register, login, OTP, OAuth)
      mentor-auth.routes.ts   — mentor auth + review chat
      booking.routes.ts       — bookings, slots, token, transcript, rate
      career.routes.ts        — resume upload, analysis, recommendations
      chat.routes.ts          — messaging conversations + messages
      notifications.routes.ts — in-app notifications list + mark-read
      admin.routes.ts         — full admin panel + marketing
      integrations.routes.ts  — Google Calendar OAuth + calendar selection
      webhook.routes.ts       — Stripe + LiveKit egress webhooks
      mentor.routes.ts        — mentor profile CRUD + search
    services/
      livekit.service.ts      — token generation, room creation, egress
      career-analysis.service.ts — full AI career pipeline
      embedding.service.ts    — Voyage AI vector indexing + search
      mentor-search.service.ts — hybrid search + LLM rerank
      whisper.service.ts      — audio transcription via Groq
      email.service.ts        — all transactional emails
      google-calendar.service.ts — GCal event CRUD + busy times
    jobs/
      reminder.job.ts         — 5-min session reminder emails

  web/src/
    app/
      video/[meetingId]/page.tsx   — LiveKit video call page
      mentee/dashboard/page.tsx    — mentee dashboard (sessions, transcripts, ratings)
      mentee/career/page.tsx       — AI career analysis page
      mentor/dashboard/page.tsx    — mentor dashboard
      onboarding/page.tsx          — 6-step mentor onboarding wizard
      admin/                       — full admin panel pages
    components/
      video/SessionRoom.tsx        — LiveKit <LiveKitRoom> + <VideoConference>
      layout/Navbar.tsx            — nav with notification bell
      booking/                     — BookingModal, SlotPicker, BookingConfirmation
      onboarding/                  — all 6 onboarding step components

packages/
  database/src/
    models/                   — Meeting, Mentor, User, Transcript, Notification, Chat, ...
    repositories/             — typed DB access layer for all models
  llm/src/                    — GroqClient, OpenRouterClient, EmbeddingProvider, prompts
  types/src/                  — shared Zod schemas + TypeScript types
```

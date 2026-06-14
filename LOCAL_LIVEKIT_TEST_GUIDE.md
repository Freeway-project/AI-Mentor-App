# Local LiveKit Testing Guide (2 Browsers)

This guide lets you test the full in-app video flow locally with two accounts (mentor + mentee).

## 1) Prerequisites

- Bun installed
- MongoDB running
- A reachable LiveKit deployment (Cloud or self-hosted)

## 2) Required Environment Variables

Set these in your local env files used by API/Web:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

For egress/transcript pipeline testing, also set:

- `LIVEKIT_EGRESS_S3_BUCKET`
- `LIVEKIT_EGRESS_S3_ACCESS_KEY`
- `LIVEKIT_EGRESS_S3_SECRET`
- `LIVEKIT_EGRESS_S3_ENDPOINT`
- optional: `LIVEKIT_EGRESS_S3_REGION`
- optional: `LIVEKIT_EGRESS_S3_FORCE_PATH_STYLE=true`

## 3) Start Services

From repo root:

```bash
bun run dev:api
bun run dev:web
```

- API: `http://localhost:3001`
- Web: `http://localhost:3000`

## 4) Prepare Two Test Accounts

Use two separate browser contexts:

- Browser A: Mentor account
- Browser B: Mentee account

Tip: normal window + incognito/private window works well.

## 5) Mentor Setup (Browser A)

Log in as mentor and ensure:

- profile is approved/published
- at least one active offer exists
- availability is configured

Without these, booking may fail or no slots may appear.

## 6) Book Session (Browser B)

1. Log in as mentee.
2. Browse to mentor profile.
3. Pick a slot and complete booking.
4. Confirm you see the booked meeting in dashboard.

## 7) Join Room from Both Browsers

1. Open booked session from mentee dashboard (Browser B).
2. Open the same meeting from mentor dashboard (Browser A).
3. Both should enter `/video/<meetingId>` and see LiveKit room UI.

## 8) What Should Happen Internally

When joining video page:

1. Web calls `GET /api/bookings/:id/token`.
2. API verifies participant access.
3. API ensures room exists and returns `{ token, serverUrl, roomName }`.
4. Web renders `<LiveKitRoom>` + `<VideoConference>`.

## 9) Quick Troubleshooting

### A) Access denied on `/video/<meetingId>`

- account is not session participant
- account email not verified (token endpoint requires verification)
- auth token stale; log out/in again

### B) One browser joins, other fails auth

Use same host on both browsers.
Do not mix `localhost` and `127.0.0.1`.

### C) Room UI loads but no media

- browser camera/mic permission blocked
- LiveKit URL/key/secret mismatch
- check API logs for token/room errors

### D) Transcript/summary not generated after call

- missing egress S3 env vars
- webhook callback not configured to `/api/webhooks/livekit`
- check API logs for egress/webhook/transcription errors

## 10) Useful Endpoints

- Booking details: `GET /api/bookings/:id`
- LiveKit token: `GET /api/bookings/:id/token`
- Transcript (post processing): `GET /api/bookings/:id/transcript`

## 11) Recommended Local Test Script

1. Mentor logs in and confirms availability.
2. Mentee books nearest slot.
3. Both join same meeting from dashboards.
4. Verify two-way audio/video.
5. End room and verify transcript endpoint later.


# Project Index

## Overview

`AI-Mentor-App` is a Bun-based monorepo for an AI-powered mentor marketplace platform.

- Frontend: Next.js App Router app in `apps/web`
- Backend: Express API in `apps/api`
- Database: shared MongoDB/Mongoose package in `packages/database`
- Shared contracts: Zod schemas and TS types in `packages/types`
- AI integrations: LLM and embedding clients in `packages/llm`
- Shared helpers: logging, formatting, validation, dates in `packages/utils`

## Workspace Map

### Root

- `package.json`: workspace scripts for dev, build, lint, and type checking
- `pnpm-workspace.yaml`: workspace definition
- `bun.lock`: Bun lockfile
- `tsconfig.json`: root TypeScript config
- `docker/`: Dockerfiles and compose setup
- `scripts/auto-deploy.sh`: deployment helper
- `vercel.json`: Vercel configuration

### Applications

- `apps/web`: Next.js 15 frontend
- `apps/api`: Express API running on Bun

### Packages

- `packages/types`: shared schemas and API types
- `packages/database`: DB connection, models, repositories
- `packages/llm`: OpenRouter/Groq clients and embeddings
- `packages/utils`: logger and general utility functions

## Runtime Entry Points

### Backend

- `apps/api/src/server.ts`: process bootstrap, MongoDB connection, reminder job startup, HTTP listener
- `apps/api/src/app.ts`: Express app setup, CORS, security middleware, JSON parsing, `/health`, `/api`, error handling
- `apps/api/src/routes/index.ts`: central API route registration

Mounted route groups under `/api`:

- `/auth`
- `/mentors`
- `/mentors/me/offers`
- `/mentors/me/policies`
- `/admin`
- `/credits`
- `/topics`
- `/mentor-auth`
- `/upload`
- `/integrations`
- `/webhooks`
- `/payments`
- `/` via `booking.routes.ts`

### Frontend

- `apps/web/src/app/layout.tsx`: global app shell, providers, toaster, route transition wrapper
- `apps/web/src/app/page.tsx`: marketing homepage composition
- `apps/web/src/app/providers.tsx`: frontend provider wiring

## Frontend Route Index

### Public pages

- `/`
- `/about`
- `/blog`
- `/browse`
- `/careers`
- `/contact`
- `/cookies`
- `/find-mentor`
- `/forgot-password`
- `/how-it-works`
- `/login`
- `/mentors`
- `/mentors/[id]`
- `/onboarding`
- `/privacy`
- `/register`
- `/reset-password`
- `/terms`
- `/verify-otp`
- `/video/[meetingId]`

### Admin pages

- `/admin`
- `/admin/login`
- `/admin/coaches`
- `/admin/coaches/[id]`
- `/admin/credits`
- `/admin/marketing`
- `/admin/service-usage`
- `/admin/sessions`
- `/admin/topics`
- `/admin/users`

### Mentee pages

- `/mentee/login`
- `/mentee/verify-otp`
- `/mentee/dashboard`

### Mentor pages

- `/mentor/verify-otp`
- `/mentor/bookings`
- `/mentor/dashboard`
- `/mentor/dashboard/profile`
- `/mentor/dashboard/availability`
- `/mentor/dashboard/settings`

## Backend Code Index

### Route modules

- `apps/api/src/routes/auth.routes.ts`
- `apps/api/src/routes/mentor.routes.ts`
- `apps/api/src/routes/offer.routes.ts`
- `apps/api/src/routes/policy.routes.ts`
- `apps/api/src/routes/admin.routes.ts`
- `apps/api/src/routes/credit.routes.ts`
- `apps/api/src/routes/topic.routes.ts`
- `apps/api/src/routes/mentor-auth.routes.ts`
- `apps/api/src/routes/upload.routes.ts`
- `apps/api/src/routes/integrations.routes.ts`
- `apps/api/src/routes/booking.routes.ts`
- `apps/api/src/routes/webhook.routes.ts`
- `apps/api/src/routes/payment.routes.ts`

### Services

- `daily.service.ts`: meeting/video provider integration
- `email.service.ts`: outbound email handling
- `stripe.service.ts`: payment integration
- `mentor-search.service.ts`: mentor/provider search logic
- `r2.service.ts`: object storage integration
- `whisper.service.ts`: transcription pipeline
- `cloudinary.service.ts`: media upload integration
- `google-calendar.service.ts`: calendar integration
- `slot-generator.service.ts`: scheduling slot generation
- `embedding.service.ts`: vector/embedding support
- `service-usage.service.ts`: usage tracking

### Middleware

- `auth.middleware.ts`
- `error.middleware.ts`
- `logger.middleware.ts`
- `rateLimit.middleware.ts`
- `upload.middleware.ts`
- `validation.middleware.ts`

### Jobs and scripts

- `apps/api/src/jobs/reminder.job.ts`
- `apps/api/src/scripts/seed-admin.ts`
- `apps/api/src/scripts/seed-mentors.ts`

## Shared Package Index

### `packages/types`

Exports shared Zod schemas and API-facing TS types.

Key schema groups:

- users
- mentors/providers
- meetings
- chats
- notifications
- offers
- policies
- credits
- topics
- OTP

### `packages/database`

Exports:

- `connectDatabase`, `getDatabase`, `closeDatabase`
- Mongoose models for users, mentors, meetings, chats, notifications, offers, policies, credits, topics, OTP, transcripts, calendar settings, integrations, service usage, campaigns
- repository classes for the same domains

Useful starting files:

- `packages/database/src/connection.ts`
- `packages/database/src/models/`
- `packages/database/src/repositories/`

### `packages/llm`

Exports:

- provider clients for OpenRouter and Groq
- prompt definitions for provider search
- embedding clients for OpenAI and Voyage
- `createLLMClient()` factory driven by `LLM_PROVIDER`

### `packages/utils`

Exports:

- `logger`
- date utilities
- validation helpers
- format helpers

## State and Client Services

Frontend client-side state and API access live in:

- `apps/web/src/store/index.ts`
- `apps/web/src/store/slices/auth.slice.ts`
- `apps/web/src/store/slices/ui.slice.ts`
- `apps/web/src/services/api.ts`
- `apps/web/src/services/admin.service.ts`
- `apps/web/src/services/topic.service.ts`

## Main UI Areas

- `apps/web/src/components/home`: landing page sections
- `apps/web/src/components/onboarding`: mentor onboarding flow
- `apps/web/src/components/booking`: booking UI
- `apps/web/src/components/mentor-profile`: mentor detail page UI
- `apps/web/src/components/admin`: admin tools and marketing UI
- `apps/web/src/components/layout`: nav, sidebars, footer
- `apps/web/src/components/ui`: shared UI primitives

## Root Scripts

- `bun run dev`: run all workspace dev processes
- `bun run dev:web`: run frontend only
- `bun run dev:api`: run backend only
- `bun run build`: build all workspaces
- `bun run type-check`: type-check all workspaces
- `bun run lint`: lint workspaces that define lint scripts

## Fastest Files To Open

If you need to understand the app quickly, start here:

1. `package.json`
2. `apps/api/src/server.ts`
3. `apps/api/src/app.ts`
4. `apps/api/src/routes/index.ts`
5. `apps/web/src/app/layout.tsx`
6. `apps/web/src/app/page.tsx`
7. `packages/database/src/index.ts`
8. `packages/types/src/index.ts`
9. `packages/llm/src/index.ts`
10. `apps/web/src/services/api.ts`

## Notes

- The repository currently contains generated directories like `node_modules` and `.next` inside workspaces.
- `README.md` appears to contain unrelated pasted notes after the license section, so this index is a more reliable high-level map of the current codebase.

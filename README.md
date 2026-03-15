# OWL Mentor

A monorepo for an AI-powered mentor/provider platform built with Bun, Next.js, Express, and MongoDB.

## Tech Stack

- **Runtime & Package Manager**: Bun
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Express, TypeScript
- **Database**: MongoDB
- **LLM**: OpenRouter / Groq
- **Validation**: Zod
- **Monorepo**: Bun Workspaces

## Project Structure

```
apps/
├── web/         # Next.js frontend
└── api/         # Express backend

packages/
├── types/       # Shared TypeScript types and Zod schemas
├── database/    # MongoDB models and repositories
├── llm/         # LLM client wrapper (OpenRouter/Groq)
└── utils/       # Shared utilities (logger, date helpers, etc.)
```

## Getting Started

### Prerequisites

- Bun >= 1.0.0
- MongoDB >= 6.0
- Node.js >= 20 (for compatibility)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Configure your MongoDB URI and API keys in .env files
```

### Development

```bash
# Run both frontend and backend
bun run dev

# Run individually
bun run dev:web    # Frontend at http://localhost:3000
bun run dev:api    # Backend at http://localhost:3001
```

### Build

```bash
# Build all apps
bun run build

# Build individually
bun run build:web
bun run build:api
```

### Production

```bash
bun run start:web
bun run start:api
```

## Docker

Containerized development and deployment are available via the `docker` folder.

- Build and start all services (web, API, MongoDB, Qdrant):

```bash
docker compose -f docker/docker-compose.yml up --build
```

- API available at http://localhost:3001
- Web available at http://localhost:3000
- Qdrant UI available at http://localhost:6333

## Core Features

- Provider profiles with AI-powered search and suggestions
- Scheduling and availability management
- Meeting tracking and history
- Real-time chat
- Notifications and reminders

## Scripts

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps
- `bun run type-check` - Run TypeScript type checking
- `bun run lint` - Run linting
- `bun run clean` - Clean all build artifacts

## Environment Variables

See `.env.example` files for required configuration.

## Organization

Built by Jaddpi

## License

Private
 These are two different architectures.

  Post-call transcript means you do transcription after the meeting ends.

  How it works:

  1. Users join a LiveKit room for the session.
  2. You start a LiveKit Egress job to record the room or participants.
  3. LiveKit writes the recording to storage, usually S3.
  4. When the recording finishes, LiveKit sends a webhook.
  5. Your backend receives that webhook, gets the file URL/path, and runs your existing Whisper transcription flow.
  6. You save the transcript, generate the summary, and email it.

  Why this matches your app:

  - Your current backend already works like this conceptually.
  - Today you already do: recording ready -> fetch media -> transcribe -> summarize -> save transcript.
  - So you mostly replace Daily recording source with LiveKit egress output.

  Pros:

  - simplest migration
  - reuses your current Whisper + summary pipeline
  - easier to debug
  - transcript quality can be improved by swapping STT providers later

  Cons:

  - no live captions during the call
  - transcript only appears after processing finishes
  - recording/storage costs still exist

  Relevant docs:

  - LiveKit Egress Overview (https://docs.livekit.io/home/egress/overview/)
  - LiveKit Webhooks (https://docs.livekit.io/home/server/webhooks/)

  Realtime transcript means transcription happens while the meeting is live.

  There are two variants:

  1. Track Egress -> WebSocket

  - LiveKit streams audio tracks out in real time.
  - Your backend or STT service consumes the stream.
  - You transcribe continuously and store transcript chunks in your DB.

  2. Agents / live transcription

  - LiveKit integrates with STT providers for live transcription.
  - Transcript events are emitted during the session.
  - You still need to persist them yourself if you want history.

  How it works in practice:

  1. Users join room.
  2. Audio is forwarded continuously to STT.
  3. Partial/final transcript segments arrive in real time.
  4. Your app stores segments with timestamps/speaker info.
  5. After call ends, you stitch them together and run summary generation.

  Pros:

  - live captions
  - live coaching/AI features become possible
  - faster post-call summary because transcript already exists

  Cons:

  - much more engineering
  - harder reliability model: reconnects, partials, duplicates, ordering
  - you need your own transcript storage format
  - speaker attribution and final cleanup become your problem

  What you need to build for realtime that you do not need for post-call:

  - transcript chunk schema
  - ordered append/update logic
  - deduplication of partial vs final transcript events
  - participant-to-speaker mapping
  - end-of-call transcript finalization
  - UI if you want live captions

  So the blunt recommendation for your app is:

  - Start with post-call transcript
  - Do not build realtime transcript unless you specifically need live captions or in-call AI features

  For your current codebase, post-call is the safer path because it maps directly onto your existing webhook and Whisper pipeline in
  webhook.routes.ts:65.

  If you want, I can next show the exact LiveKit post-call flow in your backend with endpoints, webhook payloads, and schema changes.
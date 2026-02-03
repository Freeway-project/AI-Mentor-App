# AI Mentor Platform

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

Built by BlueOcean Codes

## License

Private

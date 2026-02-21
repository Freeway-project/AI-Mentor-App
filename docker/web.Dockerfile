# ── Stage 1: Install & Build ─────────────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy manifests for layer caching
COPY package.json bun.lock ./
COPY apps/web/package.json          apps/web/package.json
COPY apps/api/package.json          apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/llm/package.json      packages/llm/package.json
COPY packages/types/package.json    packages/types/package.json
COPY packages/utils/package.json    packages/utils/package.json

RUN bun install

# Copy source
COPY tsconfig.json ./
COPY apps/web  apps/web
COPY packages  packages

# NEXT_PUBLIC_API_URL must be the URL the browser uses to reach the API
# (e.g. https://api.yourdomain.com or http://<server-ip>:3001)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build:web

# ── Stage 2: Minimal runtime ─────────────────────────────────────────────────
# Next.js standalone bundles only what's needed — no full node_modules required
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone output already includes the minimal node_modules
COPY --from=builder /app/apps/web/.next/standalone ./

# Static assets must be copied alongside the standalone server
COPY --from=builder /app/apps/web/.next/static  ./apps/web/.next/static
# public/ may be empty but must exist
RUN mkdir -p ./apps/web/public
COPY --from=builder /app/apps/web/public/        ./apps/web/public/

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Next.js standalone entry point
CMD ["node", "apps/web/server.js"]

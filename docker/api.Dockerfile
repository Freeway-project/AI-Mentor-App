# ── Stage 1: Install & Build ─────────────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy manifests for layer caching
COPY package.json bun.lock ./
COPY apps/api/package.json         apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/llm/package.json      packages/llm/package.json
COPY packages/types/package.json    packages/types/package.json
COPY packages/utils/package.json    packages/utils/package.json

RUN bun install

# Copy source
COPY tsconfig.json ./
COPY apps/api       apps/api
COPY packages       packages

# Bun bundles everything into a single file (target bun = native bun runtime)
RUN bun build apps/api/src/server.ts \
      --outdir apps/api/dist \
      --target bun \
      --minify

# ── Stage 2: Minimal runtime ──────────────────────────────────────────────────
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3001/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["bun", "dist/server.js"]

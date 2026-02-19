FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/llm/package.json packages/llm/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN bun install

# Copy source
COPY . .

# Build Next.js app
RUN bun run build:web

EXPOSE 3000

CMD ["bun", "run", "start:web"]

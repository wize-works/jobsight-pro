# Stage 1: Builder
FROM node:22.8-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

# Accept non-sensitive build-time args
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and config
COPY . .

# Optional env vars just for build (placeholders)
ENV AZURE_STORAGE_ACCOUNT=placeholder
ENV AZURE_STORAGE_KEY=placeholder
ENV AZURE_STORAGE_ENDPOINT=https://placeholder
ENV RESEND_API_KEY=placeholder
ENV OPENAI_API_KEY=placeholder
ENV STRIPE_SECRET_KEY=placeholder
ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=placeholder

# Build the app (generates .next folder)
RUN npm run build

# Stage 2: Runtime
FROM node:22.8-slim

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create an application user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid 1001 --shell /bin/bash --create-home appuser

WORKDIR /app

# Label metadata
ARG GITHUB_SHA
LABEL org.opencontainers.image.source="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.documentation="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.revision=${GITHUB_SHA:-latest}

# Copy full contents from builder
COPY --from=builder /app .

# Set up cache directories with proper permissions
RUN mkdir -p /app/.next/cache/images && \
    mkdir -p /app/.next/cache/fetch-cache && \
    mkdir -p /app/.next/cache/webpack && \
    mkdir -p /app/.next/cache/swc && \
    mkdir -p /app/.next/static && \
    mkdir -p /app/.next/server && \
    chmod -R 755 /app/.next && \
    chown -R appuser:appuser /app

# Switch to application user
USER appuser

# Set Next.js cache environment variables
ENV NEXT_CACHE_HANDLER=default
ENV NEXT_CACHE_DIR=/app/.next/cache

# Runtime envs come from Kubernetes
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npx", "next", "start"]

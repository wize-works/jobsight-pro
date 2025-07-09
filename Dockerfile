# Stage 1: Builder
FROM node:22.8-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

# Accept non-sensitive build-time args
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Accept Clerk build arguments (required for NEXT_PUBLIC_* vars)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

# Accept other build arguments that are passed from CI/CD
ARG OPENWEATHER_API_KEY
ARG NEXT_PUBLIC_APP_URL
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG AZURE_STORAGE_ACCOUNT
ARG AZURE_STORAGE_KEY
ARG AZURE_STORAGE_ENDPOINT
ARG NEXT_PUBLIC_CLARITY_ID
ARG RESEND_API_KEY
ARG SENTRY_AUTH_TOKEN
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG OPENAI_API_KEY

# Set environment variables from build args
ENV OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
ENV AZURE_STORAGE_ACCOUNT=$AZURE_STORAGE_ACCOUNT
ENV AZURE_STORAGE_KEY=$AZURE_STORAGE_KEY
ENV AZURE_STORAGE_ENDPOINT=$AZURE_STORAGE_ENDPOINT
ENV NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=$NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and config
COPY . .

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

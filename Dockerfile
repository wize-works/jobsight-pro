# Stage 1: Builder
FROM node:22-slim AS builder

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
ENV KINDE_ISSUER_URL=https://placeholder
ENV KINDE_CLIENT_ID=placeholder
ENV KINDE_CLIENT_SECRET=placeholder
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
FROM node:22-slim

# Install system dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libglib2.0-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (Debian style)
RUN addgroup app && adduser --disabled-password --gecos "" --ingroup app appuser

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/playwright-artifacts && \
    chmod 777 /tmp/playwright-artifacts && \
    mkdir -p /home/appuser/.cache && \
    chown -R appuser:app /home/appuser/.cache

WORKDIR /app

# Label metadata
ARG GITHUB_SHA
LABEL org.opencontainers.image.source="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.documentation="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.revision=${GITHUB_SHA:-latest}

# Copy full contents from builder
COPY --from=builder /app .

# Install Playwright browsers and dependencies as root
USER root
RUN npx playwright install chromium && \
    npx playwright install-deps chromium

# Set up cache and temp directories with proper permissions
RUN mkdir -p /app/.next/cache/images && \
    mkdir -p /tmp/playwright-artifacts && \
    mkdir -p /home/appuser/.cache/ms-playwright && \
    chmod 755 /tmp/playwright-artifacts && \
    chown -R appuser:app /app && \
    chown -R appuser:app /tmp/playwright-artifacts && \
    chown -R appuser:app /home/appuser/.cache

# Switch to non-root user
USER appuser

# Set environment variables for Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/home/appuser/.cache/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV TMPDIR=/tmp/playwright-artifacts

# Runtime envs come from Kubernetes
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npx", "next", "start"]

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

# Install system dependencies for Puppeteer/Chromium
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

# Create a Puppeteer user (using simple approach for compatibility)
RUN groupadd --gid 1001 puppeteeruser && \
    useradd --uid 1001 --gid 1001 --shell /bin/bash --create-home puppeteeruser

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/puppeteer-artifacts && \
    chmod 777 /tmp/puppeteer-artifacts && \
    mkdir -p /home/puppeteeruser/.cache && \
    chown -R puppeteeruser:puppeteeruser /home/puppeteeruser && \
    chown -R puppeteeruser:puppeteeruser /home/puppeteeruser/.cache

WORKDIR /app

# Label metadata
ARG GITHUB_SHA
LABEL org.opencontainers.image.source="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.documentation="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.revision=${GITHUB_SHA:-latest}

# Copy full contents from builder
COPY --from=builder /app .

# Install Puppeteer and Chromium as root
USER root

# Install Puppeteer directly from package.json and set up browser
RUN npm ls puppeteer || npm install puppeteer

# Install Chrome browser for Puppeteer
RUN npx puppeteer browsers install chrome --path /opt/chrome

# Set up cache and temp directories with proper permissions
RUN mkdir -p /app/.next/cache/images && \
    mkdir -p /app/.next/cache/fetch-cache && \
    mkdir -p /app/.next/cache/webpack && \
    mkdir -p /app/.next/cache/swc && \
    mkdir -p /app/.next/static && \
    mkdir -p /app/.next/server && \
    mkdir -p /tmp/puppeteer-artifacts && \
    mkdir -p /home/puppeteeruser/.cache/puppeteer && \
    mkdir -p /opt/chrome && \
    chmod 755 /tmp/puppeteer-artifacts && \
    chmod 755 /opt/chrome && \
    chmod -R 755 /app/.next && \
    chown -R puppeteeruser:puppeteeruser /app && \
    chown -R puppeteeruser:puppeteeruser /tmp/puppeteer-artifacts && \
    chown -R puppeteeruser:puppeteeruser /home/puppeteeruser/.cache && \
    chown -R puppeteeruser:puppeteeruser /opt/chrome

# Switch to Puppeteer user
USER puppeteeruser

# Set environment variables for Puppeteer
ENV PUPPETEER_CACHE_DIR=/home/puppeteeruser/.cache/puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/opt/chrome/chrome/linux-*/chrome-linux*/chrome
ENV TMPDIR=/tmp/puppeteer-artifacts

# Set Next.js cache environment variables
ENV NEXT_CACHE_HANDLER=default
ENV NEXT_CACHE_DIR=/app/.next/cache

# Runtime envs come from Kubernetes
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npx", "next", "start"]

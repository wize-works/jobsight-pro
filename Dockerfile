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
ENV KINDE_CLIENT_ID=1234567890abcdef
ENV KINDE_CLIENT_SECRET=placeholder
ENV AZURE_STORAGE_ACCOUNT=placeholder
ENV AZURE_STORAGE_KEY=placeholder
ENV AZURE_STORAGE_ENDPOINT=https://placeholder
ENV RESEND_API_KEY=placeholder

# Build the app (generates .next folder)
RUN npm run build

# Stage 2: Runtime
FROM node:22-slim

# Create a non-root user (Debian style)
RUN addgroup app && adduser --disabled-password --gecos "" --ingroup app appuser

WORKDIR /app

# Label metadata
ARG GITHUB_SHA
LABEL org.opencontainers.image.source="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.documentation="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.revision=${GITHUB_SHA:-latest}

# Copy full contents from builder
COPY --from=builder /app .

RUN mkdir -p .next/cache/images && chown -R appuser:app .next
USER appuser

# Runtime envs come from Kubernetes
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npx", "next", "start"]

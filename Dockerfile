# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Accept non-sensitive build-time args
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and config
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY public ./public
COPY src ./src

# Build the app (generates .next folder)
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

# Create a non-root user
RUN addgroup -S app && adduser -S appuser -G app
USER appuser

WORKDIR /app

# Label metadata (optional but useful)
ARG GITHUB_SHA
LABEL org.opencontainers.image.source="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.documentation="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.revision=${GITHUB_SHA:-latest}

# Copy production artifacts from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Runtime environment variables will be injected by Kubernetes, not baked into the image

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npx", "next", "start"]

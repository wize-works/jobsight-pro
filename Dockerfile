# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (including dev for build tools like TypeScript)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and build
COPY . .

RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

# Create non-root user
RUN addgroup -S app && adduser -S appuser -G app
USER appuser

WORKDIR /app

# OpenContainers-compliant labels
LABEL org.opencontainers.image.source="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.documentation="https://github.com/wize-works/jobsight-pro"
LABEL org.opencontainers.image.revision=$GITHUB_SHA

# Copy production files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Environment and port
# Accept build-time NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
EXPOSE 3000

# Optional: Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

# Start the app
CMD ["node", "dist/server.js"]

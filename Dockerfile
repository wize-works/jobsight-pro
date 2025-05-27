# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Accept all required environment variables as build args
ARG KINDE_CLIENT_ID
ARG KINDE_CLIENT_SECRET
ARG KINDE_ISSUER_URL
ARG KINDE_DOMAIN
ARG KINDE_SITE_URL
ARG KINDE_LOGOUT_REDIRECT_URI
ARG KINDE_POST_LOGOUT_REDIRECT_URL
ARG KIDNE_REDIRECT_URI
ARG KINDE_POST_LOGIN_REDIRECT_URL
ARG OPENWEATHER_API_KEY
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NODE_ENV=production

# Expose them to the build environment
ENV KINDE_CLIENT_ID=$KINDE_CLIENT_ID
ENV KINDE_CLIENT_SECRET=$KINDE_CLIENT_SECRET
ENV KINDE_ISSUER_URL=$KINDE_ISSUER_URL
ENV KINDE_DOMAIN=$KINDE_DOMAIN
ENV KINDE_SITE_URL=$KINDE_SITE_URL
ENV KINDE_LOGOUT_REDIRECT_URI=$KINDE_LOGOUT_REDIRECT_URI
ENV KINDE_POST_LOGOUT_REDIRECT_URL=$KINDE_POST_LOGOUT_REDIRECT_URL
ENV KIDNE_REDIRECT_URI=$KIDNE_REDIRECT_URI
ENV KINDE_POST_LOGIN_REDIRECT_URL=$KINDE_POST_LOGIN_REDIRECT_URL
ENV OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NODE_ENV=$NODE_ENV

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY app/ ./app/
COPY components/ ./components/
COPY hooks/ ./hooks/
COPY lib/ ./lib/
COPY styles/ ./styles/
COPY types/ ./types/
COPY utils/ ./utils/
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

# Runtime environment variables will be passed by Kubernetes at runtime — no need to hardcode here.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]

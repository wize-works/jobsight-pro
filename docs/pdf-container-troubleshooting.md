# PDF Export Container Troubleshooting Guide

## Problem
PDF export was failing in containerized environments with the error:
```
Error: browserType.launch: EROFS: read-only file system, mkdtemp '/tmp/playwright-artifacts-qvTwox'
```

## Root Cause
Playwright needs:
1. System dependencies for running Chromium
2. Writable temporary directories for browser artifacts
3. Proper browser installation in the container environment
4. Appropriate Chrome launch arguments for containerized environments

## Solution Implemented

### 1. Updated Dockerfile

#### Added System Dependencies
```dockerfile
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
```

#### Setup Proper Directories and Permissions
```dockerfile
# Create necessary directories with proper permissions
RUN mkdir -p /tmp/playwright-artifacts && \
    chmod 777 /tmp/playwright-artifacts && \
    mkdir -p /home/appuser/.cache && \
    chown -R appuser:app /home/appuser/.cache

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
```

### 2. Updated Chromium Launch Arguments

Updated `/src/app/api/generate-pdf/route.ts` with container-friendly Chrome arguments:

```typescript
const browser = await chromium.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
    ]
});
```

### 3. Added Health Check Endpoints

Created health check endpoints to verify PDF generation:
- `/health` - Basic health check with container info
- `/health/pdf` - Specific PDF generation capability test

### 4. Added Test Script

Created `scripts/test-pdf-container.js` to test PDF generation within the container:
```bash
npm run test:pdf
```

## Testing the Fix

### 1. Build and Run Container
```bash
# Build the container
docker build -t jobsight-pro .

# Run with proper environment variables
docker run -p 3000:3000 \
    -e NODE_ENV=production \
    -e KINDE_ISSUER_URL=your_issuer_url \
    -e KINDE_CLIENT_ID=your_client_id \
    -e KINDE_CLIENT_SECRET=your_client_secret \
    jobsight-pro
```

### 2. Test Health Checks
```bash
# Basic health check
curl http://localhost:3000/health

# PDF generation health check
curl http://localhost:3000/health/pdf
```

### 3. Test PDF Generation
```bash
# Run inside container
docker exec -it <container_id> npm run test:pdf
```

## Key Environment Variables

- `PLAYWRIGHT_BROWSERS_PATH`: Path where Playwright browsers are installed
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`: Skip browser download (since we install them in Docker)
- `TMPDIR`: Temporary directory for Playwright artifacts
- `NODE_ENV`: Should be set to 'production' in container

## Troubleshooting

### If PDF generation still fails:

1. **Check file permissions:**
   ```bash
   docker exec -it <container_id> ls -la /tmp/playwright-artifacts
   docker exec -it <container_id> ls -la /home/appuser/.cache
   ```

2. **Verify browser installation:**
   ```bash
   docker exec -it <container_id> npx playwright --version
   docker exec -it <container_id> ls -la /home/appuser/.cache/ms-playwright
   ```

3. **Test browser launch:**
   ```bash
   docker exec -it <container_id> npm run test:pdf
   ```

4. **Check logs for specific errors:**
   ```bash
   docker logs <container_id>
   ```

### Common Issues and Solutions:

1. **Permission denied errors:**
   - Ensure directories are owned by `appuser`
   - Check that temporary directories are writable

2. **Browser not found errors:**
   - Verify Playwright browsers are installed
   - Check `PLAYWRIGHT_BROWSERS_PATH` environment variable

3. **Memory issues:**
   - Increase container memory limits
   - Consider using `--single-process` Chrome flag (already included)

## Performance Considerations

- PDF generation in containers may be slower than local development
- Consider implementing PDF generation queues for high-traffic scenarios
- Monitor memory usage as Chrome can be memory-intensive

## Security Notes

- Running Chrome in containers requires `--no-sandbox` which reduces security
- This is acceptable for PDF generation in trusted environments
- Consider network isolation for PDF generation containers in production

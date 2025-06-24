# Docker Run Commands for Playwright Testing

## Local Development Testing

When testing the Playwright PDF generation locally, use these Docker commands that follow the official Playwright Docker documentation:

### Basic Run Command (Following Playwright Official Docs)
```bash
docker run -it --rm \
  --init \
  --ipc=host \
  --cap-add=SYS_ADMIN \
  -p 3000:3000 \
  -v $(pwd):/app \
  jobsight-pro:latest
```

### Production-like Run Command
```bash
docker run -it --rm \
  --init \
  --ipc=host \
  --user pwuser \
  --security-opt seccomp=unconfined \
  -p 3000:3000 \
  -e NODE_ENV=production \
  jobsight-pro:latest
```

### Key Flags Explained

- `--init`: Recommended to avoid special treatment for processes with PID=1. Prevents zombie processes.
- `--ipc=host`: **CRITICAL** - Required when using Chromium to avoid memory issues and crashes.
- `--cap-add=SYS_ADMIN`: Sometimes needed for Chromium in development. Use carefully in production.
- `--user pwuser`: Runs as the Playwright user we created (UID 1001).
- `--security-opt seccomp=unconfined`: May be needed for Chromium sandbox in some environments.

### Testing PDF Generation

Once the container is running, test PDF generation:

```bash
# Health check
curl http://localhost:3000/health/pdf

# Test PDF generation API
curl -X POST http://localhost:3000/api/generate-pdf-storage \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Test PDF</h1></body></html>",
    "filename": "test.pdf",
    "businessId": "test-business-id",
    "saveToStorage": false
  }'
```

## Kubernetes Deployment Notes

In Kubernetes, the equivalent of `--ipc=host` is handled by:

1. **Shared Memory Volume**: We've added a memory-backed volume for `/dev/shm`
2. **Proper User Configuration**: Using UID 1001 (pwuser) as recommended
3. **Resource Limits**: Increased memory to handle Chromium processes
4. **Volume Mounts**: Proper temp and cache directories

## Common Issues & Solutions

### Issue: "Browser executable doesn't exist"
**Solution**: Ensure Playwright browsers are installed in the image:
```dockerfile
RUN npx playwright install chromium && npx playwright install-deps chromium
```

### Issue: "Failed to launch browser"
**Solution**: Check IPC configuration and shared memory:
- For Docker: Add `--ipc=host`
- For Kubernetes: Use shared memory volume (already configured)

### Issue: "Out of memory" errors
**Solution**: 
- Increase container memory limits (done: 1Gi limit)
- Use shared memory volume for `/dev/shm` (configured)
- Ensure `--disable-dev-shm-usage` browser flag is set (configured)

### Issue: "Permission denied" errors
**Solution**: 
- Ensure proper user permissions (pwuser UID 1001)
- Check volume mount permissions
- Verify cache directory ownership

## Environment Variables for Debugging

Add these to your deployment for debugging:

```yaml
- name: DEBUG
  value: "pw:browser"
- name: PLAYWRIGHT_BROWSER_WS_ENDPOINT
  value: ""  # Leave empty for local browser
```

## Performance Monitoring

Monitor these metrics:
- Container memory usage (should stay under 1Gi)
- PDF generation time (should be < 10 seconds)
- Browser launch success rate
- Shared memory usage

## Security Considerations

- **Never use `--cap-add=SYS_ADMIN` in production**
- **Always run as non-root user (pwuser)**
- **Use proper seccomp profiles in production**
- **Limit network access for the container**
- **Monitor for resource exhaustion**

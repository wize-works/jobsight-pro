# 🚀 Gotenberg PDF Generation Migration

## Why Gotenberg is Better

### Current Problems with Browser-in-Container
- ❌ Complex browser setup in main application container
- ❌ Large container size (Chrome + dependencies)
- ❌ Permission and cache directory issues
- ❌ Resource-heavy (browser running in app container)
- ❌ Platform-specific compatibility issues

### Gotenberg Advantages
- ✅ **Dedicated microservice** - Runs in separate container
- ✅ **Simple HTTP API** - POST HTML, get PDF back
- ✅ **Zero browser management** - Gotenberg handles everything
- ✅ **Smaller main container** - No browser dependencies
- ✅ **Better reliability** - Purpose-built for containerized PDF
- ✅ **Independent scaling** - Scale PDF service separately

## Architecture

```
┌─────────────────┐    HTTP POST     ┌──────────────────┐
│   JobSight Pro  │ ──────────────► │    Gotenberg     │
│   Application   │                 │   PDF Service    │
│   Container     │ ◄────────────── │                  │
└─────────────────┘    PDF Buffer   └──────────────────┘
```

## Implementation

### 1. Deploy Gotenberg Service
```bash
kubectl apply -f deployment/gotenberg-deployment.yaml
```

### 2. Environment Variables
Add to your application:
```env
GOTENBERG_URL=http://gotenberg-service:3000
```

### 3. Use New Endpoints
- `/api/generate-pdf-gotenberg` - Basic PDF generation
- `/api/generate-pdf-storage-gotenberg` - PDF with storage
- `/health/pdf-gotenberg` - Health check

### 4. Migration Steps

#### Option A: Gradual Migration
1. Deploy Gotenberg alongside current Puppeteer setup
2. Test with new endpoints
3. Switch endpoints when ready
4. Remove Puppeteer dependencies

#### Option B: Full Migration
1. Replace current PDF endpoints
2. Update service actions to use Gotenberg
3. Deploy simplified Dockerfile
4. Remove browser dependencies

## Benefits

### Container Size Reduction
- **Before**: ~800MB (with Puppeteer + Chrome)
- **After**: ~200MB (Node.js only)

### Reliability Improvements
- No browser crashes in main application
- Dedicated PDF service with health monitoring
- Better error isolation

### Resource Optimization
- Main app uses less memory
- PDF generation scales independently
- Better resource allocation

## Testing

### Health Check
```bash
curl http://your-app/health/pdf-gotenberg
```

### Direct PDF Generation
```bash
curl -X POST http://your-app/api/generate-pdf-gotenberg \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>", "filename": "test.pdf"}'
```

## Deployment

### Gotenberg Configuration
- **Memory**: 256Mi-512Mi per replica
- **CPU**: 250m-500m per replica
- **Replicas**: 2+ for high availability
- **Health checks**: Built-in `/health` endpoint

### Application Configuration
- Remove browser dependencies
- Simplified container setup
- Faster startup times
- Better resource efficiency

## Migration Checklist

- [ ] Deploy Gotenberg service
- [ ] Test new PDF endpoints
- [ ] Update service actions
- [ ] Switch production traffic
- [ ] Remove Puppeteer dependencies
- [ ] Update Dockerfile
- [ ] Monitor performance improvements

This architecture follows microservice best practices and will significantly improve your PDF generation reliability and deployment experience!

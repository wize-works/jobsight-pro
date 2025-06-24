# PDF Generation with Media Storage

This document explains the updated PDF generation system that saves PDF artifacts to your Azure media storage instead of using local storage.

## Overview

Previously, Playwright PDF generation relied on local filesystem storage for temporary artifacts, which could cause issues in containerized environments. The new system:

1. **Uploads PDFs directly to Azure Blob Storage** using your existing media storage infrastructure
2. **Links PDFs to relevant entities** (clients, projects) automatically
3. **Reduces local storage dependencies** for Playwright operations
4. **Provides better artifact management** through your media system

## Implementation

### New API Endpoints

- `/api/generate-pdf-storage` - Enhanced PDF generation that saves to media storage
- `/api/generate-pdf` - Original endpoint (still available for backwards compatibility)

### New Server Actions

- `uploadPdfBuffer()` - Uploads PDF buffers directly to Azure storage
- `generatePdfDocument()` - Generic PDF generation service
- `generateClientPdf()` - Specialized client PDF generation

### Playwright Optimizations

The following Playwright browser arguments have been added to minimize local storage usage:

```typescript
const browser = await chromium.launch({
    headless: true,
    args: [
        // ... existing args ...
        '--disable-background-downloads',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--no-default-browser-check',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--disable-logging',
        '--disable-web-resources',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
    ]
});
```

### Environment Variables

New environment variables for enhanced Playwright behavior:

```dockerfile
ENV PLAYWRIGHT_DISABLE_DEV_SHM=1
ENV PLAYWRIGHT_DISABLE_FILE_DOWNLOADS=1
```

## Usage Examples

### Client PDF Generation

```typescript
import { generateClientPdf } from '@/app/actions/pdf-generation';

const result = await generateClientPdf(businessId, clientId, clientName);
if (result.success) {
    console.log('PDF saved to:', result.fileUrl);
    console.log('Media record:', result.media);
}
```

### Generic PDF Generation

```typescript
import { generatePdfDocument } from '@/app/actions/pdf-generation';

const result = await generatePdfDocument({
    html: '<html>...</html>',
    filename: 'report.pdf',
    description: 'Monthly report',
    saveToStorage: true,
    clientId: 'optional-client-id'
});
```

### Direct API Usage

```typescript
const response = await fetch('/api/generate-pdf-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        html: htmlContent,
        filename: 'document.pdf',
        businessId: 'your-business-id',
        clientId: 'optional-client-id',
        description: 'Generated document',
        saveToStorage: true
    })
});
```

## Benefits

1. **Reduced Local Storage**: Minimal filesystem usage during PDF generation
2. **Better Artifact Management**: PDFs are stored with proper metadata and linking
3. **Scalability**: Works better in containerized and serverless environments
4. **Compliance**: All generated documents are properly tracked and stored
5. **Accessibility**: PDFs are accessible through your existing media management system

## Migration

Existing PDF generation functionality continues to work. New implementations should use the media storage approach for better performance and storage management.

## Troubleshooting

### Common Issues

1. **PDF not saving to storage**: Check that `businessId` is provided in the request
2. **Linking failures**: Ensure `clientId` or `projectId` are valid when provided
3. **Memory issues**: The new Playwright arguments should help, but monitor container memory usage

### Environment Verification

Test PDF generation with the health endpoint:
```
GET /health/pdf
```

This will verify that Playwright is working correctly with the new configuration.

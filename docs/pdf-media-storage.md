# PDF Generation with Media Storage

This document explains the updated PDF generation system that uses Gotenberg for reliable PDF generation and saves PDF artifacts to your Azure media storage.

## Overview

The JobSight Pro PDF generation system has been migrated from browser-based solutions (Playwright/Puppeteer) to Gotenberg, providing:

1. **Reliable PDF generation** using a dedicated microservice (Gotenberg)
2. **Container-friendly architecture** without browser dependencies
3. **Uploads PDFs directly to Azure Blob Storage** using your existing media storage infrastructure
4. **Links PDFs to relevant entities** (clients, projects) automatically
5. **Better artifact management** through your media system

## Implementation

### API Endpoints

- `/api/generate-pdf-gotenberg` - PDF generation using Gotenberg
- `/api/generate-pdf-storage-gotenberg` - PDF generation with automatic media storage
- `/api/health/pdf-gotenberg` - Health check for Gotenberg service

### Server Actions

- `uploadPdfBuffer()` - Uploads PDF buffers directly to Azure storage
- `generatePdfDocumentWithGotenberg()` - Generic PDF generation service using Gotenberg
- `generateClientPdf()` - Specialized client PDF generation
- `generateProjectPdfWithGotenberg()` - Project PDF generation

### Gotenberg Integration

The system now uses Gotenberg as a microservice for PDF generation:

```typescript
// Example of calling Gotenberg service
const response = await fetch(gotenbergUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data',
    },
    body: formData // Contains HTML content and options
});
```

### Environment Variables

Required environment variables for Gotenberg integration:

```dockerfile
ENV GOTENBERG_URL=http://gotenberg:3000
```

## Usage Examples

### Client PDF Generation

```typescript
import { generateClientPdf } from '@/app/actions/pdf-generation-gotenberg';

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
const response = await fetch('/api/generate-pdf-storage-gotenberg', {
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

1. **Reliable PDF Generation**: Dedicated Gotenberg service eliminates browser-related issues
2. **Container-Friendly**: No browser dependencies in main application container
3. **Better Artifact Management**: PDFs are stored with proper metadata and linking
4. **Scalability**: Microservice architecture scales independently
5. **Compliance**: All generated documents are properly tracked and stored
6. **Accessibility**: PDFs are accessible through your existing media management system

## Migration

All PDF generation has been migrated to use Gotenberg. The system now uses:
- `/api/generate-pdf-gotenberg` for basic PDF generation
- `/api/generate-pdf-storage-gotenberg` for PDF generation with media storage

## Troubleshooting

### Common Issues

1. **PDF not saving to storage**: Check that `businessId` is provided in the request
2. **Linking failures**: Ensure `clientId` or `projectId` are valid when provided
3. **Gotenberg connection issues**: Verify `GOTENBERG_URL` environment variable is set correctly

### Environment Verification

Test PDF generation with the health endpoint:
```
GET /health/pdf-gotenberg
```

This will verify that Gotenberg service is accessible and working correctly.

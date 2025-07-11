# Photo Upload Implementation Guide

## Overview
We've successfully implemented a comprehensive photo upload and saving system for JobSight Pro. This system includes:

1. **Camera Modal**: A responsive modal that handles camera access, photo capture, and file uploads
2. **Photo Saving**: Robust backend upload with metadata storage and entity linking
3. **Context-Aware Uploads**: Support for linking photos to different business entities

## Features Implemented

### 1. Camera Modal (`PhotoUploadModal`)
- **Direct Camera Access**: Opens camera immediately when modal is displayed
- **Photo Capture**: Canvas-based photo capture with high quality (90% JPEG)
- **File Upload Fallback**: File picker for devices without camera access
- **Photo Preview**: Shows captured/selected photo with editing options
- **Description Input**: Optional description field for photos
- **Mobile Optimized**: Responsive design that works on all devices
- **Error Handling**: Comprehensive error handling for camera permissions and failures

### 2. Photo Upload System
- **Azure Blob Storage**: Secure cloud storage for all photos
- **Media Database**: Structured storage of media metadata
- **Location Metadata**: GPS coordinates and address when available
- **Tagging System**: Flexible tagging for organization
- **Entity Linking**: Link photos to projects, clients, equipment, or daily logs

### 3. Context-Aware Implementation
- **General Photos**: Dashboard photos with basic metadata
- **Project Photos**: Automatically linked to specific projects
- **Client Photos**: Linked to client records
- **Equipment Photos**: Linked to equipment records
- **Daily Log Photos**: Linked to daily log entries

## Usage Examples

### Basic Usage (Dashboard)
```typescript
// Dashboard photo upload (general context)
<PhotoUploadModal
    isOpen={photoUploadModal}
    onClose={() => setPhotoUploadModal(false)}
    onPhotoCapture={async (photoData) => {
        const result = await uploadPhotoWithContext(
            businessId,
            photoData.file,
            { type: 'general' },
            {
                description: photoData.description,
                location: userLocation,
                tags: ['dashboard']
            }
        );
        // Handle result...
    }}
/>
```

### Project Context
```typescript
// Project-specific photo upload
<PhotoUploadModal
    isOpen={photoUploadModal}
    onClose={() => setPhotoUploadModal(false)}
    context={{
        type: 'project',
        id: projectId,
        name: projectName
    }}
    onPhotoCapture={async (photoData) => {
        const result = await uploadPhotoWithContext(
            businessId,
            photoData.file,
            photoData.context!,
            {
                description: photoData.description,
                location: userLocation,
                tags: ['project', 'progress']
            }
        );
        // Handle result...
    }}
/>
```

### Equipment Context
```typescript
// Equipment-specific photo upload
<PhotoUploadModal
    isOpen={photoUploadModal}
    onClose={() => setPhotoUploadModal(false)}
    context={{
        type: 'equipment',
        id: equipmentId,
        name: equipmentName
    }}
    onPhotoCapture={async (photoData) => {
        const result = await uploadPhotoWithContext(
            businessId,
            photoData.file,
            photoData.context!,
            {
                description: photoData.description,
                tags: ['equipment', 'maintenance']
            }
        );
        // Handle result...
    }}
/>
```

## Technical Implementation

### Backend Functions
1. **`uploadPhotoWithContext`**: Main upload function with context awareness
2. **`uploadGeneralPhoto`**: Simple upload for general use cases
3. **`linkMediaTo*`**: Functions to link media to different entities

### Data Flow
1. User opens camera modal
2. Camera initializes and shows live feed
3. User captures photo or selects file
4. Photo is processed into File object
5. Optional description is added
6. Photo is uploaded to Azure Blob Storage
7. Media record is created in database
8. Metadata is stored (location, tags, context)
9. Photo is linked to appropriate business entity
10. Success/error feedback is provided

### Error Handling
- Camera permission errors
- Upload failures
- Network connectivity issues
- File size/type validation
- Database operation errors

## Storage Structure

### Azure Blob Storage
- Container: `images`
- Filename: `{timestamp}={sanitized_filename}`
- Content-Type: `image/jpeg` or original file type

### Database Tables
- **`media`**: Core media information
- **`media_metadata`**: Key-value metadata storage
- **`media_links`**: Links between media and business entities

### Metadata Schema
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  },
  "tags": ["dashboard", "general"],
  "context": {
    "type": "project",
    "id": "proj_123",
    "name": "Office Renovation"
  }
}
```

## Security Features
- Business-scoped uploads (users can only upload to their business)
- User authentication required
- File type validation
- Size limits (configurable)
- Secure upload URLs with expiration
- Permission-based access control

## Future Enhancements
1. **Toast Notifications**: Replace alert() with proper toast system
2. **Batch Upload**: Support multiple photo uploads
3. **Image Editing**: Basic crop/rotate functionality
4. **Offline Support**: Queue uploads when offline
5. **Progressive Upload**: Show upload progress
6. **Compression**: Automatic image compression for large files
7. **Thumbnail Generation**: Create thumbnails for faster loading

## Testing
- Camera functionality works on desktop and mobile
- File upload fallback works when camera unavailable
- Photos are properly stored and linked to entities
- Error handling gracefully manages failures
- Build passes without errors

## Status: ✅ COMPLETE
The photo upload and saving functionality is now fully implemented and production-ready. Users can:
- Take photos directly from the camera modal
- Upload existing photos from their device
- Add descriptions to photos
- Automatically link photos to business entities
- View success/error feedback
- Access photos through the media management system

The implementation is robust, secure, and follows the existing application patterns.

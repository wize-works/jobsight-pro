"use client"

import { useState, useEffect } from "react"
import { Media, MediaType } from "@/types/media"
import { useBusiness } from "@/lib/business-context"
import ErrorBoundary from "@/components/error-boundary"
import UniversalMediaManager from "@/components/universal-media-manager"
import { toast } from "@/hooks/use-toast"

interface MediaTabProps {
    projectId: string
}

export default function MediaTab({ projectId }: MediaTabProps) {
    const { businessId } = useBusiness();
    const [linkedMedia, setLinkedMedia] = useState<Media[]>([]);
    const [availableMedia, setAvailableMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true); useEffect(() => {
        loadMediaData()
    }, [projectId])

    const loadMediaData = async () => {
        try {
            setLoading(true)

            // Get linked media for this project
            const linkedResponse = await fetch(`/api/media?project_id=${projectId}`);
            if (!linkedResponse.ok) {
                throw new Error('Failed to fetch linked media');
            }
            const linkedData = await linkedResponse.json();
            const allLinked = linkedData.data || [];

            // Get available media that can be linked to this project
            const availableResponse = await fetch('/api/media');
            if (!availableResponse.ok) {
                throw new Error('Failed to fetch available media');
            }
            const availableData = await availableResponse.json();
            const available = availableData.data || [];

            setLinkedMedia(allLinked)
            setAvailableMedia(available)
        } catch (error) {
            console.error("Error loading project media:", error)
            toast.error("Failed to load media data")
        } finally {
            setLoading(false)
        }
    }

    const handleMediaUpload = async (
        file: File,
        metadata: { name: string; description: string; type: MediaType }
    ): Promise<boolean> => {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', metadata.name);
            formData.append('description', metadata.description);
            formData.append('type', metadata.type);
            formData.append('project_id', projectId);

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            await loadMediaData(); // Refresh data
            toast.success("Media uploaded successfully");
            return true;
        } catch (error) {
            console.error("Error uploading media:", error);
            toast.error("Failed to upload media");
            return false;
        }
    }

    const handleMediaLink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            // Link each media item to the project
            const linkPromises = mediaIds.map(media_id =>
                fetch('/api/media-links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        media_id,
                        linked_id: projectId,
                        linked_type: 'project',
                    }),
                })
            );

            const responses = await Promise.all(linkPromises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                await loadMediaData(); // Refresh data
                toast.success(`Linked ${mediaIds.length} media item(s)`);
                return { success: true };
            } else {
                throw new Error("Some links failed");
            }
        } catch (error) {
            console.error("Error linking media:", error);
            const errorMessage = "Failed to link media";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    const handleMediaUnlink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            // Unlink each media item from the project
            const unlinkPromises = mediaIds.map(media_id =>
                fetch(`/api/media-links?media_id=${media_id}&linked_id=${projectId}&linked_type=project`, {
                    method: 'DELETE',
                })
            );

            const responses = await Promise.all(unlinkPromises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                await loadMediaData(); // Refresh data
                toast.success(`Unlinked ${mediaIds.length} media item(s)`);
                return { success: true };
            } else {
                throw new Error("Some unlinks failed");
            }
        } catch (error) {
            console.error("Error unlinking media:", error);
            const errorMessage = "Failed to unlink media";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <h2 className="text-lg font-semibold">Project Media</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="loading loading-spinner loading-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <ErrorBoundary fallback={(error) => (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Failed to load media</h3>
                    <div className="text-xs">Project media is temporarily unavailable.</div>
                </div>
            </div>
        )}>
            <div className="card bg-base-100 shadow-md p-6">
                <div className="card-body">
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Project Media</h2>
                        </div>

                        <p className="text-base-content/70">
                            Media files associated with this project
                        </p>

                        <UniversalMediaManager
                            mode="both"
                            entityType="project"
                            onUpload={handleMediaUpload}
                            availableMedia={availableMedia}
                            linkedMedia={linkedMedia}
                            onLink={handleMediaLink}
                            onUnlink={handleMediaUnlink}
                            title="Project Media"
                            description="Upload images, videos, documents, and other files related to this project."
                        />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    )
}

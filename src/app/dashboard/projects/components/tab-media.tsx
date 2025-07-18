"use client"

import { useState, useEffect } from "react"
import { Media, MediaType } from "@/types/media"
import { useBusiness } from "@/lib/business-context"
import ErrorBoundary from "@/components/error-boundary"
import UniversalMediaManager from "@/components/universal-media-manager"
// TODO: Migrate to media hooks for project media operations
// import { useMedia } from "@/hooks/useMedia";
import {
    getMediaByProjectId,
    uploadProjectMedia,
    linkExistingMediaToProject,
    unlinkMediaFromProject,
    getAvailableMediaForProject
} from "@/app/actions/media"
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
            // Get all media types for this project
            const [images, videos, documents, audios, available] = await Promise.all([
                getMediaByProjectId(businessId, projectId, "images"),
                getMediaByProjectId(businessId, projectId, "videos"),
                getMediaByProjectId(businessId, projectId, "documents"),
                getMediaByProjectId(businessId, projectId, "audios"),
                getAvailableMediaForProject(businessId, projectId)
            ])

            const allLinked = [...images, ...videos, ...documents, ...audios]
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
            const success = await uploadProjectMedia(
                businessId,
                projectId,
                file,
                metadata.type,
                metadata.description
            )

            if (success) {
                await loadMediaData() // Refresh data
                toast.success("Media uploaded successfully")
                return true
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            console.error("Error uploading media:", error)
            toast.error("Failed to upload media")
            return false
        }
    }

    const handleMediaLink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const success = await linkExistingMediaToProject(businessId, mediaIds, projectId)

            if (success) {
                await loadMediaData() // Refresh data
                toast.success(`Linked ${mediaIds.length} media item(s)`)
                return { success: true }
            } else {
                throw new Error("Link failed")
            }
        } catch (error) {
            console.error("Error linking media:", error)
            const errorMessage = "Failed to link media"
            toast.error(errorMessage)
            return { success: false, error: errorMessage }
        }
    }

    const handleMediaUnlink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const success = await unlinkMediaFromProject(businessId, mediaIds, projectId); if (success) {
                await loadMediaData() // Refresh data
                toast.success(`Unlinked ${mediaIds.length} media item(s)`)
                return { success: true }
            } else {
                throw new Error("Unlink failed")
            }
        } catch (error) {
            console.error("Error unlinking media:", error)
            const errorMessage = "Failed to unlink media"
            toast.error(errorMessage)
            return { success: false, error: errorMessage }
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

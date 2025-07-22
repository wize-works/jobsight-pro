"use client"

import { useState, useEffect } from "react"
import { Media, MediaType } from "@/types/media"
import { useBusiness } from "@/lib/business-context"
import ErrorBoundary from "@/components/error-boundary"
import UniversalMediaManager from "@/components/universal-media-manager"
import {
    getAllMediaByProjectId,
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMediaData()
    }, [projectId])

    const loadMediaData = async () => {
        try {
            setLoading(true)
            // Get all linked media and available media for this project
            const [linked, available] = await Promise.all([
                getAllMediaByProjectId(businessId, projectId),
                getAvailableMediaForProject(businessId, projectId)
            ])

            setLinkedMedia(linked)
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
                return true
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            console.error("Error uploading media:", error)
            return false
        }
    }

    const handleMediaLink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const success = await linkExistingMediaToProject(businessId, mediaIds, projectId)

            if (success) {
                await loadMediaData() // Refresh data
                return { success: true }
            } else {
                throw new Error("Link failed")
            }
        } catch (error) {
            console.error("Error linking media:", error)
            return { success: false, error: "Failed to link media" }
        }
    }

    const handleMediaUnlink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const success = await unlinkMediaFromProject(businessId, mediaIds, projectId)

            if (success) {
                await loadMediaData() // Refresh data
                return { success: true }
            } else {
                throw new Error("Unlink failed")
            }
        } catch (error) {
            console.error("Error unlinking media:", error)
            return { success: false, error: "Failed to unlink media" }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
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
                enableCamera={true}
            />
        </ErrorBoundary>
    )
}

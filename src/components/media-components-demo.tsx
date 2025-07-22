"use client";

import { useState } from "react";
import UniversalMediaUploader, { MEDIA_CONFIGS } from "./universal-media-uploader";
import UniversalMediaLinker from "./universal-media-linker";
import UniversalMediaManager from "./universal-media-manager";
import { Media, MediaType } from "@/types/media";

// Mock data for testing
const mockAvailableMedia: Media[] = [
    {
        id: "1",
        name: "Project Blueprint.pdf",
        description: "Main project blueprint document",
        type: "document",
        url: "/test-doc.pdf",
        size: 2048000,
        business_id: "test",
        project_id: null,
        uploaded_by: "user1",
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: "user1",
        updated_at: new Date().toISOString(),
        updated_by: "user1",
    },
    {
        id: "2",
        name: "Site Photo 1.jpg",
        description: "Construction site overview",
        type: "image",
        url: "/concrete-pouring.png",
        size: 1024000,
        business_id: "test",
        project_id: null,
        uploaded_by: "user1",
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: "user1",
        updated_at: new Date().toISOString(),
        updated_by: "user1",
    },
    {
        id: "3",
        name: "Progress Video.mp4",
        description: "Weekly progress video",
        type: "video",
        url: "/test-video.mp4",
        size: 10240000,
        business_id: "test",
        project_id: null,
        uploaded_by: "user1",
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: "user1",
        updated_at: new Date().toISOString(),
        updated_by: "user1",
    },
];

export default function MediaComponentsDemo() {
    const [linkedMedia, setLinkedMedia] = useState<Media[]>([]);
    const [activeDemo, setActiveDemo] = useState<"uploader" | "linker" | "manager">("manager");

    // Mock handlers
    const handleUpload = async (file: File, metadata: { name: string; description: string; type: MediaType }) => {
        console.log("Upload:", { file: file.name, metadata });
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return Math.random() > 0.2; // 80% success rate for demo
    };

    const handleLink = async (mediaIds: string[]) => {
        console.log("Link:", mediaIds);
        const newLinked = mockAvailableMedia.filter(m => mediaIds.includes(m.id));
        setLinkedMedia(prev => [...prev, ...newLinked]);
        return { success: true };
    };

    const handleUnlink = async (mediaIds: string[]) => {
        console.log("Unlink:", mediaIds);
        setLinkedMedia(prev => prev.filter(m => !mediaIds.includes(m.id)));
        return { success: true };
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Universal Media Components Demo</h1>
                <p className="text-base-content/70">
                    Test the new standardized media upload and linking components
                </p>
            </div>

            {/* Component Selector */}
            <div className="tabs tabs-box">
                <button
                    className={`tab ${activeDemo === "manager" ? "tab-active" : ""}`}
                    onClick={() => setActiveDemo("manager")}
                >
                    Media Manager (Combined)
                </button>
                <button
                    className={`tab ${activeDemo === "uploader" ? "tab-active" : ""}`}
                    onClick={() => setActiveDemo("uploader")}
                >
                    Uploader Only
                </button>
                <button
                    className={`tab ${activeDemo === "linker" ? "tab-active" : ""}`}
                    onClick={() => setActiveDemo("linker")}
                >
                    Linker Only
                </button>
            </div>

            {/* Demo Components */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    {activeDemo === "uploader" && (
                        <div>
                            <h2 className="card-title mb-4">Universal Media Uploader</h2>
                            <UniversalMediaUploader
                                onUpload={handleUpload}
                                multiple={true}
                                maxFiles={5}
                                maxFileSize={50 * 1024 * 1024}
                                acceptedTypes={["image/*", "video/*", ".pdf", ".doc", ".docx"]}
                                allowedMediaTypes={["images", "videos", "documents"]}
                                title="Upload Test Files"
                                description="Test the universal uploader component"
                                showPreview={true}
                                onComplete={(results) => {
                                    console.log("Upload complete:", results);
                                }}
                            />
                        </div>
                    )}

                    {activeDemo === "linker" && (
                        <div>
                            <h2 className="card-title mb-4">Universal Media Linker</h2>
                            <UniversalMediaLinker
                                availableMedia={mockAvailableMedia}
                                linkedMedia={linkedMedia}
                                onLink={handleLink}
                                onUnlink={handleUnlink}
                                multiple={true}
                                maxSelections={10}
                                title="Link Test Media"
                                description="Test the universal linker component"
                                showSearch={true}
                                showFilters={true}
                            />
                        </div>
                    )}

                    {activeDemo === "manager" && (
                        <div>
                            <h2 className="card-title mb-4">Universal Media Manager</h2>
                            <UniversalMediaManager
                                mode="both"
                                entityType="dailyLog"
                                onUpload={handleUpload}
                                availableMedia={mockAvailableMedia}
                                linkedMedia={linkedMedia}
                                onLink={handleLink}
                                onUnlink={handleUnlink}
                                title="Daily Log Media"
                                description="Manage photos and documents for this daily log"
                                onComplete={(results) => {
                                    console.log("Media manager complete:", results);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Configuration Info */}
            <div className="card bg-base-200">
                <div className="card-body">
                    <h3 className="card-title">Available Configurations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(MEDIA_CONFIGS).map(([key, config]) => (
                            <div key={key} className="p-4 bg-base-100 rounded">
                                <h4 className="font-semibold capitalize">{key}</h4>
                                <p className="text-sm text-base-content/70 mb-2">{config.title}</p>
                                <ul className="text-xs space-y-1">
                                    <li>Multiple: {config.multiple ? "Yes" : "No"}</li>
                                    <li>Max Files: {config.maxFiles}</li>
                                    <li>Max Size: {(config.maxFileSize / 1024 / 1024).toFixed(0)}MB</li>
                                    <li>Types: {config.allowedMediaTypes?.join(", ")}</li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Current State */}
            <div className="card bg-info">
                <div className="card-body">
                    <h3 className="card-title text-info-content">Current Demo State</h3>
                    <div className="text-info-content/80">
                        <p>Linked Media: {linkedMedia.length} items</p>
                        <p>Available Media: {mockAvailableMedia.length} items</p>
                        {linkedMedia.length > 0 && (
                            <div className="mt-2">
                                <p className="font-medium">Linked files:</p>
                                <ul className="list-disc list-inside text-sm">
                                    {linkedMedia.map(m => (
                                        <li key={m.id}>{m.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

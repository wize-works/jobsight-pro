
"use client";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { Media } from "@/types/media";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CrewMember } from "@/types/crew-members";
import TabSafety from "./tab-safety";
import ModalLoading from "@/components/modal-loading";
import UniversalMediaManager from "@/components/universal-media-manager";
import { formatDate } from "@/utils/date";
import { useBusiness } from "@/lib/business-context";
import { toast } from "@/hooks/use-toast";

// Dynamic import for the edit modal
const EditModal = dynamic(() => import("./modal-edit"), {
    loading: () => <ModalLoading message="Loading edit form..." />,
});

// Dynamic import for the materials tab (large component)
const TabMaterials = dynamic(() => import("./tab-materials"), {
    loading: () => <ModalLoading message="Loading materials..." />,
});

// Helper function to extract number from a string
const extractNumber = (str: any) => {
    if (str === null || str === undefined) return 0;
    const match = str.toString().match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

// Helper function to parse weather data
const parseWeatherData = (weatherString: string | null) => {
    if (!weatherString) return null;

    try {
        const weatherData = JSON.parse(weatherString);
        return weatherData;
    } catch {
        // If it's not JSON, treat as legacy string format
        return {
            legacy: true,
            description: weatherString
        };
    }
};

// Helper function to get weather icon
const getWeatherIcon = (condition: string | null, description?: string) => {
    if (!condition && !description) return "fas fa-question";

    const weather = (condition || description || "").toLowerCase();
    if (weather.includes('rain') || weather.includes('drizzle')) return "fas fa-cloud-rain";
    if (weather.includes('sun') || weather.includes('clear')) return "fas fa-sun";
    if (weather.includes('cloud')) return "fas fa-cloud";
    if (weather.includes('snow')) return "fas fa-snowflake";
    if (weather.includes('thunderstorm') || weather.includes('storm')) return "fas fa-bolt";
    if (weather.includes('mist') || weather.includes('fog')) return "fas fa-smog";
    return "fas fa-cloud-sun";
};

type DailyLogDetailProps = {
    log: DailyLogWithDetails;
    crews: Crew[];
    projects: Project[];
    crewMembers: CrewMember[];
};

export default function DailyLogDetail({ log, crews, projects, crewMembers }: DailyLogDetailProps) {
    const { businessId } = useBusiness();
    const [activeTab, setActiveTab] = useState<"overview" | "labor-hours" | "materials-equipment" | "safety-quality" | "photos-documents">("overview");
    const [currentLog, setCurrentLog] = useState<DailyLogWithDetails>(log);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Media state
    const [linkedMedia, setLinkedMedia] = useState<Media[]>([]);
    const [availableMedia, setAvailableMedia] = useState<Media[]>([]);
    const [mediaLoading, setMediaLoading] = useState(false);

    // Load media data when component mounts or log changes
    useEffect(() => {
        loadMediaData();
    }, [currentLog.id, businessId]);

    const loadMediaData = async () => {
        if (!businessId) return;

        setMediaLoading(true);
        try {
            // Fetch linked media for daily log
            const linkedResponse = await fetch(`/api/media?daily_log_id=${currentLog.id}`);
            const linked = linkedResponse.ok ? (await linkedResponse.json()).data || [] : [];

            // Fetch all available media 
            const availableResponse = await fetch('/api/media');
            const available = availableResponse.ok ? (await availableResponse.json()).data || [] : [];

            setLinkedMedia(linked);
            setAvailableMedia(available);
        } catch (error) {
            console.error("Error loading media data:", error);
            toast({
                title: "Error",
                description: "Failed to load media data",
                variant: "error",
            });
        } finally {
            setMediaLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!businessId) {
            toast({
                title: "Error",
                description: "No business context available.",
                variant: "error",
            });
            return;
        }

        setIsDownloading(true);
        try {
            // Generate PDF via API
            const filename = `daily-log-${currentLog.project?.name || 'unknown'}-${formatDate(currentLog.date)}.pdf`;

            const response = await fetch('/api/pdf-generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'daily-log',
                    dailyLogId: currentLog.id,
                    fileName: filename
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Success",
                description: "Daily log PDF downloaded successfully.",
            });
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast({
                title: "Error",
                description: "Failed to download daily log PDF. Please try again.",
                variant: "error",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/dashboard/daily-logs/${currentLog.id}`;

            // Try to use the Web Share API if available (mobile devices)
            if (navigator.share && navigator.canShare({ url: shareUrl })) {
                await navigator.share({
                    title: `Daily Log - ${currentLog.project?.name || 'Unknown Project'}`,
                    text: `Daily log for ${currentLog.project?.name || 'Unknown Project'} from ${formatDate(currentLog.date)}`,
                    url: shareUrl,
                });

                toast({
                    title: "Success",
                    description: "Daily log shared successfully.",
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(shareUrl);

                toast({
                    title: "Link Copied",
                    description: "Daily log link copied to clipboard.",
                });
            }
        } catch (error) {
            console.error('Error sharing daily log:', error);

            // If all else fails, try to copy to clipboard manually
            try {
                const shareUrl = `${window.location.origin}/dashboard/daily-logs/${currentLog.id}`;
                await navigator.clipboard.writeText(shareUrl);

                toast({
                    title: "Link Copied",
                    description: "Daily log link copied to clipboard.",
                });
            } catch (clipboardError) {
                toast({
                    title: "Error",
                    description: "Failed to share daily log. Please copy the URL manually.",
                    variant: "error",
                });
            }
        }
    };// Calculate totals for summary
    const totalMaterialCost = currentLog.materials.reduce((total, material) =>
        total + (extractNumber(material.quantity) * (material.cost || 0)), 0);

    const totalEquipmentHours = currentLog.equipment.reduce((total, equip) =>
        total + (equip.hours || 0), 0);

    const handleLogUpdate = (updatedLog: DailyLogWithDetails) => {
        setCurrentLog(updatedLog);
    };

    // Media upload handler
    const handleMediaUpload = async (file: File, metadata: { name: string; description: string; type: any }) => {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', metadata.name);
            formData.append('description', metadata.description);
            formData.append('type', metadata.type);
            formData.append('daily_log_id', currentLog.id);

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                await loadMediaData(); // Refresh media list
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error uploading media:", error);
            return false;
        }
    };

    // Media link handler
    const handleMediaLink = async (mediaIds: string[]) => {
        try {
            // Link each media item to the daily log
            const linkPromises = mediaIds.map(media_id =>
                fetch('/api/media-links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        media_id,
                        linked_id: currentLog.id,
                        linked_type: 'daily_log',
                    }),
                })
            );

            const responses = await Promise.all(linkPromises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                await loadMediaData(); // Refresh media list
                return { success: true };
            }
            return { success: false, error: "Failed to link media" };
        } catch (error) {
            console.error("Error linking media:", error);
            return { success: false, error: "Failed to link media" };
        }
    };

    // Media unlink handler
    const handleMediaUnlink = async (mediaIds: string[]) => {
        try {
            // Unlink each media item from the daily log
            const unlinkPromises = mediaIds.map(media_id =>
                fetch(`/api/media-links?media_id=${media_id}&linked_id=${currentLog.id}&linked_type=daily_log`, {
                    method: 'DELETE',
                })
            );

            const responses = await Promise.all(unlinkPromises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                await loadMediaData(); // Refresh media list
                return { success: true };
            }
            return { success: false, error: "Failed to unlink media" };
        } catch (error) {
            console.error("Error unlinking media:", error);
            return { success: false, error: "Failed to unlink media" };
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row space-y-4 items-center justify-between">
                <Link href="/dashboard/daily-logs" className="btn btn-outline">
                    <i className="far fa-arrow-left"></i>Back to Daily Logs
                </Link>
                <div className="flex gap-4">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <i className="far fa-edit mr-2"></i>
                        Edit
                    </button>                    <button
                        className="btn btn-outline btn-sm"
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Generating...
                            </>
                        ) : (
                            <>
                                <i className="far fa-download mr-2"></i>
                                Export Log
                            </>
                        )}                    </button>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={handleShare}
                    >
                        <i className="far fa-share mr-2"></i>
                        Share
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tabs tabs-box py-6">
                <button
                    className={`tab tab-bordered ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === "materials-equipment" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("materials-equipment")}
                >
                    Materials & Equipment
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === "safety-quality" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("safety-quality")}
                >
                    Safety & Quality
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === "photos-documents" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("photos-documents")}
                >
                    Photos & Documents
                </button>
            </div>

            {/* Content Area */}
            <div className="container mx-auto">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Work Summary */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-2xl font-bold">Daily Log</h1>
                                            <span className="badge badge-primary">{format(new Date(currentLog.date), "M/d/yyyy")}</span>
                                        </div>
                                        <p className="text-base-content/70">
                                            {currentLog.project?.name} | Logged by {currentLog.crew?.name || "Unknown"}
                                        </p>
                                    </div>
                                    <h3 className="card-title">Work Summary</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold mb-2">Work Completed</h4>
                                            <p className="text-sm">{currentLog.work_completed || "No work completed information provided."}</p>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Work Planned for Next Day</h4>
                                            <p className="text-sm">Continue with foundation work. Begin backfilling operations on east wing.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Delays & Issues</h4>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div>
                                                    <span className="font-medium">Description:</span>
                                                    <p>{currentLog.delays || "No delays reported"}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Impact:</span>
                                                    <p>Minimal - team adjusted work sequence</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Resolution:</span>
                                                    <p>Coordinated with supplier for earlier delivery tomorrow</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Notes</h4>
                                            <p className="text-sm">{currentLog.notes || "No additional notes provided."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>                            {/* Weather Conditions */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Weather Conditions</h3>
                                    {(() => {
                                        const weatherData = parseWeatherData(currentLog.weather);

                                        if (!weatherData) {
                                            return (
                                                <div className="text-center py-8">
                                                    <i className="fas fa-question text-4xl text-base-content/30 mb-2"></i>
                                                    <p className="text-base-content/70">No weather data recorded</p>
                                                    <p className="text-sm text-base-content/50">Weather conditions were not captured for this daily log</p>
                                                </div>
                                            );
                                        }

                                        if (weatherData.legacy) {
                                            return (
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <i className={`${getWeatherIcon(null, weatherData.description)} text-3xl text-primary`}></i>
                                                        <p className="font-medium mt-2">{weatherData.description}</p>
                                                    </div>
                                                    <p className="text-base-content/70">Legacy weather data</p>
                                                </div>
                                            );
                                        }

                                        const { current } = weatherData;

                                        // Check if current exists and has the required properties
                                        if (!current) {
                                            return (
                                                <div className="text-center py-8">
                                                    <i className="fas fa-exclamation-triangle text-4xl text-warning mb-2"></i>
                                                    <p className="text-base-content/70">Invalid weather data format</p>
                                                    <p className="text-sm text-base-content/50">Weather data exists but is malformed</p>
                                                </div>
                                            );
                                        }

                                        const windDirection = current.windDirection ?
                                            ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(current.windDirection / 22.5) % 16] : '';

                                        return (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center">
                                                            <i className={`${getWeatherIcon(current.condition, current.description)} text-4xl text-primary`}></i>
                                                            <p className="font-medium mt-1 capitalize">{current.description || 'Unknown'}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <i className="fas fa-thermometer-half text-3xl text-red-500"></i>
                                                            <p className="font-bold text-xl">{current.temperature || 'N/A'}°F</p>
                                                            <p className="text-sm text-base-content/60">Feels {current.feelsLike || 'N/A'}°F</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <i className="fas fa-wind text-2xl text-blue-500"></i>
                                                            <p className="font-medium">{current.windSpeed || 'N/A'} mph</p>
                                                            <p className="text-sm text-base-content/60">{windDirection}</p>
                                                        </div>                                        <div className="text-center">
                                                            <i className="fas fa-tint text-2xl text-blue-600"></i>
                                                            <p className="font-medium">{current.humidity || 'N/A'}%</p>
                                                            <p className="text-sm text-base-content/60">Humidity</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {weatherData.location ? (
                                                            <>
                                                                <p className="text-base-content/70 text-sm">
                                                                    Captured at {weatherData.location.timestamp ? new Date(weatherData.location.timestamp).toLocaleTimeString() : 'Unknown time'}
                                                                </p>
                                                                <p className="text-base-content/50 text-xs">
                                                                    {weatherData.location.latitude ? weatherData.location.latitude.toFixed(4) : 'N/A'}, {weatherData.location.longitude ? weatherData.location.longitude.toFixed(4) : 'N/A'}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-base-content/70 text-sm">Location data unavailable</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Additional weather details */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-base-300">
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Pressure</p>
                                                        <p className="text-lg">{current.pressure || 'N/A'} hPa</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">UV Index</p>
                                                        <p className="text-lg">{current.uvIndex || 'N/A'}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Cloud Cover</p>
                                                        <p className="text-lg">{current.cloudCover || 'N/A'}%</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Visibility</p>
                                                        <p className="text-lg">{current.visibility ? Math.round(current.visibility / 1000) : 'N/A'} km</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Project Information */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Project Information</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div><span className="font-medium">Client:</span> <a href={`/dashboard/clients/${log.client.id}`}>{log.client.name}</a></div>
                                        <div><span className="font-medium">Project:</span> <a href={`/dashboard/projects/${log.project.id}`}>{currentLog.project?.name}</a></div>
                                        <div><span className="font-medium">Date:</span> {format(new Date(currentLog.date), "M/d/yyyy")}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Crew Information */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Crew Information</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div className="text-lg font-medium">Crew: {currentLog.crew?.name || "Unknown"}</div>
                                        <div>
                                            <span className="font-medium">Crew Members</span>
                                            <div className="mt-2 space-y-1">
                                                {crewMembers.map((member) => (
                                                    <div key={member.id} className="flex justify-between">
                                                        <span>{member.name}</span>
                                                        <span className="text-base-content/60">{member.role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hours Summary */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Hours Summary</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div className="flex justify-between align-top">
                                            <span>Start Time</span>
                                            <span className="text-2xl">{currentLog.start_time}</span>
                                        </div>
                                        <div className="flex justify-between align-center">
                                            <span>End Time</span>
                                            <span className="text-2xl">{currentLog.end_time}</span>
                                        </div>
                                        <div className="flex justify-between align-center">
                                            <span>Overtime Hours</span>
                                            <span className="text-2xl">{currentLog.overtime || "0"} hrs</span>
                                        </div>
                                        <div className="flex justify-between align-center">
                                            <span>Regular Hours</span>
                                            <span className="text-2xl">{currentLog.hours_worked || "0"} hrs</span>
                                        </div>
                                        <div className="divider my-1" />
                                        <div className="flex justify-between align-center">
                                            <span>Total Hours Worked</span>
                                            <span className="text-2xl text-secondary font-bold">{currentLog.hours_worked + currentLog.overtime || "0"} hrs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Site Visitors */}
                            {/* <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Site Visitors</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">Robert Chen</p>
                                                <p className="text-base-content/60">Oakridge Development</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">Client Inspection</p>
                                                <p className="text-base-content/60">Foundation inspection</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">Lisa Wong</p>
                                                <p className="text-base-content/60">City Building Department</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">Foundation inspection</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                )}

                {/* Materials & Equipment Tab */}
                {activeTab === "materials-equipment" && (
                    <TabMaterials materials={log.materials} equipment={log.equipment} />
                )}

                {/* Safety & Quality Tab */}
                {activeTab === "safety-quality" && (
                    <TabSafety safety={log.safety} quality={log.quality} delays={log.delays} />
                )}                {/* Photos & Documents Tab */}
                {activeTab === "photos-documents" && (
                    <div className="space-y-6">
                        {mediaLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="loading loading-spinner loading-lg"></div>
                                <span className="ml-2">Loading media...</span>
                            </div>
                        ) : (
                            <UniversalMediaManager
                                mode="both"
                                entityType="dailyLog"
                                onUpload={handleMediaUpload}
                                availableMedia={availableMedia}
                                linkedMedia={linkedMedia}
                                onLink={handleMediaLink}
                                onUnlink={handleMediaUnlink}
                                title="Daily Log Media"
                                description="Manage photos and documents for this daily log"
                                onComplete={() => {
                                    // Optional: Handle completion events
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EditModal
                log={currentLog}
                crews={crews}
                projects={projects}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleLogUpdate}
            />
        </div>
    );
}

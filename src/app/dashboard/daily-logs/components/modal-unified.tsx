"use client";

import { DailyLogWithDetails, DailyLogInsert } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { Equipment, EquipmentCondition, equipmentConditionOptions } from "@/types/equipment";
import { CrewMember } from "@/types/crew-members";
import { Media } from "@/types/media";
import { useState, useEffect } from "react";
import {
    createDailyLog,
    updateDailyLog,
    getDailyLogWithDetailsById
} from "@/app/actions/daily-logs";
import {
    createDailyLogMaterial,
    updateDailyLogMaterial
} from "@/app/actions/daily-log-materials";
import {
    createDailyLogEquipment,
    updateDailyLogEquipment
} from "@/app/actions/daily-log-equipment";
import {
    getProjects
} from "@/app/actions/projects";
import {
    getCrews
} from "@/app/actions/crews";
import {
    getEquipments
} from "@/app/actions/equipments";
import {
    getCrewMembers
} from "@/app/actions/crew-members";
import {
    getMedias,
    getMediaByDailyLogId,
    uploadDailyLogMedia,
    linkExistingMediaToDailyLog,
    unlinkMediaFromDailyLog
} from "@/app/actions/media";
import { format } from "date-fns";
import { DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useBusiness } from "@/lib/business-context";
import UniversalMediaManager from "@/components/universal-media-manager";

// Helper function to extract number from a string with units
const extractNumber = (str: any) => {
    if (str === null || str === undefined) return 0;
    const match = str.toString().match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

// Helper to extract units from quantity string
const extractUnit = (str: any) => {
    if (str === null || str === undefined) return "";
    if (typeof str !== "string") return "";
    const match = str.match(/[^\d\.\s]+.*/);
    return match ? match[0].trim() : "";
};

type UnifiedDailyLogModalProps = {
    mode: "create" | "edit";
    log?: DailyLogWithDetails | null; // Optional for create mode, required for edit mode
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: DailyLogWithDetails) => void;
};

export default function UnifiedDailyLogModal({
    mode,
    log = null,
    isOpen,
    onClose,
    onSave
}: UnifiedDailyLogModalProps) {
    const { user, isLoaded } = useUser();
    const searchParams = useSearchParams();
    const { businessId } = useBusiness();

    // Data loading states
    const [crews, setCrews] = useState<Crew[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // UI states
    const [activeTab, setActiveTab] = useState<"general" | "materials" | "equipment" | "notes" | "media">("general");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        project_id: "",
        crew_id: "",
        start_time: "08:00",
        end_time: "17:00",
        hours_worked: 8,
        overtime: 0,
        work_completed: "",
        work_planned: "",
        safety: "",
        quality: "",
        delays: "",
        notes: "",
        weather: "",
    });

    const [materials, setMaterials] = useState<Array<{
        id: string;
        name: string | null;
        quantity?: string | null;
        cost?: number | null;
        unit?: string | null;
        supplier?: string | null;
        notes?: string | null;
        quantityValue: number;
        quantityUnit: string;
        isNew?: boolean;
    }>>([]);

    const [equipment, setEquipment] = useState<Array<{
        id: string;
        equipmentId?: string;
        name: string | null;
        operator?: string;
        crewMemberId?: string | null;
        hours: number | null;
        condition?: string;
        isNew?: boolean;
    }>>([]);

    // Media state
    const [linkedMedia, setLinkedMedia] = useState<Media[]>([]);
    const [availableMedia, setAvailableMedia] = useState<Media[]>([]);
    const [mediaLoading, setMediaLoading] = useState(false);

    // Fetch dropdown data when component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!businessId) {
                    console.error("No business ID found");
                    setFetchError("Business ID is not available. Please try again later.");
                    return;
                }
                setLoadingData(true);
                const [fetchedCrews, fetchedProjects, fetchedEquipments, fetchedCrewMembers] = await Promise.all([
                    getCrews(businessId),
                    getProjects(businessId),
                    getEquipments(businessId),
                    getCrewMembers(businessId)
                ]);
                setCrews(fetchedCrews);
                setProjects(fetchedProjects);
                setEquipments(fetchedEquipments);
                setCrewMembers(fetchedCrewMembers);
            } catch (error) {
                console.error("Error fetching data:", error);
                setFetchError("Failed to load data. Please try again later.");
            } finally {
                setLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [businessId, isOpen]);

    // Initialize form data based on mode
    useEffect(() => {
        if (!isOpen) return;

        if (mode === "edit" && log) {
            // Edit mode: populate with existing log data
            setFormData({
                date: format(new Date(log.date), "yyyy-MM-dd"),
                project_id: log.project_id || "",
                crew_id: log.crew_id || "",
                start_time: log.start_time || "08:00",
                end_time: log.end_time || "17:00",
                hours_worked: log.hours_worked || 0,
                overtime: log.overtime || 0,
                work_completed: log.work_completed || "",
                work_planned: log.work_planned || "",
                safety: log.safety || "",
                quality: log.quality || "",
                delays: log.delays || "",
                notes: log.notes || "",
                weather: log.weather || "",
            });

            const processedMaterials = log.materials.map(material => ({
                ...material,
                quantity: material.quantity === null || material.quantity === undefined ? null : String(material.quantity),
                quantityValue: extractNumber(material.quantity),
                quantityUnit: extractUnit(material.quantity)
            }));

            setMaterials(processedMaterials);
            setEquipment(log.equipment);
        } else if (mode === "create") {
            // Create mode: check for AI-generated data or URL parameters
            const aiLogData = sessionStorage.getItem('aiGeneratedLog');
            if (aiLogData) {
                try {
                    const parsedData = JSON.parse(aiLogData);
                    console.log('Processing AI log data:', parsedData);

                    // Pre-fill form with AI-generated data
                    const aiFormData: any = {
                        date: format(new Date(), "yyyy-MM-dd"),
                        project_id: "",
                        crew_id: "",
                        start_time: "08:00",
                        end_time: "17:00",
                        hours_worked: 8,
                        overtime: 0,
                        work_completed: "",
                        work_planned: "",
                        safety: "",
                        quality: "",
                        delays: "",
                        notes: "",
                        weather: "",
                    };

                    if (parsedData.summary) {
                        aiFormData.work_completed = parsedData.summary;
                    }
                    if (parsedData.work_completed) {
                        if (Array.isArray(parsedData.work_completed)) {
                            aiFormData.work_completed = parsedData.work_completed.join('. ');
                        } else {
                            aiFormData.work_completed = parsedData.work_completed;
                        }
                    }
                    if (parsedData.weather) {
                        aiFormData.weather = parsedData.weather;
                    }
                    if (parsedData.safety_notes) {
                        aiFormData.safety = parsedData.safety_notes;
                    }
                    if (parsedData.issues) {
                        if (Array.isArray(parsedData.issues)) {
                            aiFormData.delays = parsedData.issues.join('. ');
                        } else {
                            aiFormData.delays = parsedData.issues;
                        }
                    }

                    setFormData(aiFormData);

                    // Handle materials
                    if (parsedData.materials_used && Array.isArray(parsedData.materials_used)) {
                        const aiMaterials = parsedData.materials_used.map((material: any, index: number) => ({
                            id: `ai-${index}`,
                            name: material.name || material || '',
                            quantity: material.quantity || '0',
                            cost: 0,
                            quantityValue: parseFloat(material.quantity) || 0,
                            quantityUnit: material.unit || '',
                            supplier: '',
                            isNew: true
                        }));
                        setMaterials(aiMaterials);
                    }

                    // Handle equipment
                    if (parsedData.equipment_used && Array.isArray(parsedData.equipment_used)) {
                        const aiEquipment = parsedData.equipment_used.map((equip: any, index: number) => ({
                            id: `ai-equip-${index}`,
                            equipmentId: '',
                            name: equip.name || equip || '',
                            operator: '',
                            crewMemberId: null,
                            hours: 8,
                            condition: 'good',
                            isNew: true
                        }));
                        setEquipment(aiEquipment);
                    }

                    // Clear from session storage
                    sessionStorage.removeItem('aiGeneratedLog');
                    console.log('AI data processed and cleared from sessionStorage');
                } catch (err) {
                    console.error('Error parsing AI log data:', err);
                }
            } else {
                // Check for AI-generated content from URL parameters
                const aiSummary = searchParams.get('ai_summary');
                const aiTranscription = searchParams.get('ai_transcription');
                const aiSafetyNotes = searchParams.get('ai_safety_notes');
                const aiWeather = searchParams.get('ai_weather');
                const aiCrewNotes = searchParams.get('ai_crew_notes');

                if (aiSummary || aiTranscription) {
                    setFormData(prev => ({
                        ...prev,
                        work_completed: aiSummary || aiTranscription || "",
                        safety: aiSafetyNotes || "",
                        weather: aiWeather || "",
                        notes: aiCrewNotes || "",
                    }));
                }
            }
        }
    }, [mode, log, isOpen, searchParams]);

    // Load media data when in edit mode or when actively managing media
    useEffect(() => {
        const loadMediaData = async () => {
            if (!businessId || !isOpen) return;

            setMediaLoading(true);
            try {
                if (mode === "edit" && log?.id) {
                    const [linked, available] = await Promise.all([
                        getMediaByDailyLogId(businessId, log.id),
                        getMedias(businessId)
                    ]);
                    setLinkedMedia(linked);
                    setAvailableMedia(available);
                } else {
                    // In create mode, just load available media for potential linking
                    const available = await getMedias(businessId);
                    setLinkedMedia([]);
                    setAvailableMedia(available);
                }
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

        if (isOpen && (mode === "edit" || activeTab === "media")) {
            loadMediaData();
        }
    }, [businessId, isOpen, mode, log?.id, activeTab]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === "" ? 0 : Number(value);
        setFormData(prev => ({
            ...prev,
            [name]: numValue
        }));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate hours worked when start/end time changes
            if (name === "start_time" || name === "end_time") {
                const startTime = name === "start_time" ? value : prev.start_time;
                const endTime = name === "end_time" ? value : prev.end_time;

                if (startTime && endTime) {
                    const start = new Date(`2000-01-01T${startTime}`);
                    const end = new Date(`2000-01-01T${endTime}`);

                    // Handle overnight shifts
                    if (end < start) {
                        end.setDate(end.getDate() + 1);
                    }

                    const diffMs = end.getTime() - start.getTime();
                    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2; // Round to nearest 0.5
                    updated.hours_worked = Math.max(0, diffHours);
                }
            }

            return updated;
        });
    };

    // Handle material changes
    const handleMaterialChange = (index: number, field: string, value: any) => {
        setMaterials(prevMaterials => {
            const updatedMaterials = [...prevMaterials];

            if (field === "quantity") {
                const numValue = extractNumber(value);
                const unitPart = extractUnit(value) || updatedMaterials[index].quantityUnit;

                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    [field]: unitPart ? `${numValue} ${unitPart}` : String(numValue),
                    quantityValue: numValue,
                    quantityUnit: unitPart
                };
            } else if (field === "quantityValue") {
                const numValue = value === "" ? 0 : Number(value);
                const unitPart = updatedMaterials[index].quantityUnit;

                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    quantity: unitPart ? `${numValue} ${unitPart}` : String(numValue),
                    quantityValue: numValue
                };
            } else if (field === "quantityUnit") {
                const numValue = updatedMaterials[index].quantityValue;

                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    quantity: value ? `${numValue} ${value}` : String(numValue),
                    quantityUnit: value
                };
            } else if (field === "cost") {
                const numValue = value === "" ? null : Number(value);
                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    [field]: numValue
                };
            } else {
                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    [field]: value
                };
            }

            return updatedMaterials;
        });
    };

    // Handle equipment changes
    const handleEquipmentChange = (index: number, field: string, value: any) => {
        setEquipment(prevEquipment => {
            const updatedEquipment = [...prevEquipment];

            if (field === "hours") {
                updatedEquipment[index] = {
                    ...updatedEquipment[index],
                    [field]: value === "" ? null : Number(value)
                };
            } else {
                updatedEquipment[index] = {
                    ...updatedEquipment[index],
                    [field]: value
                };
            }

            return updatedEquipment;
        });
    };

    // Add new material
    const addMaterial = () => {
        setMaterials(prev => [
            ...prev,
            {
                id: `temp-${Date.now()}`,
                name: "",
                quantity: "0",
                cost: 0,
                supplier: "",
                notes: "",
                quantityValue: 0,
                quantityUnit: "",
                isNew: true
            }
        ]);
    };

    // Add new equipment
    const addEquipment = () => {
        setEquipment(prev => [
            ...prev,
            {
                id: `temp-${Date.now()}`,
                equipmentId: "",
                name: "",
                hours: 0,
                crewMemberId: null,
                operator: "",
                condition: "good",
                isNew: true
            }
        ]);
    };

    // Remove material
    const removeMaterial = (index: number) => {
        setMaterials(prev => prev.filter((_, i) => i !== index));
    };

    // Remove equipment
    const removeEquipment = (index: number) => {
        setEquipment(prev => prev.filter((_, i) => i !== index));
    };

    // Media upload handler
    const handleMediaUpload = async (file: File, metadata: { name: string; description: string; type: any }) => {
        if (!businessId) return false;

        try {
            if (mode === "edit" && log?.id) {
                // Edit mode: upload and link to existing daily log
                const success = await uploadDailyLogMedia(businessId, log.id, file, metadata.type, metadata.description);
                if (success) {
                    // Reload media data
                    const [linked, available] = await Promise.all([
                        getMediaByDailyLogId(businessId, log.id),
                        getMedias(businessId)
                    ]);
                    setLinkedMedia(linked);
                    setAvailableMedia(available);
                    return true;
                }
            } else {
                // Create mode: store file for later upload after daily log is created
                toast({
                    title: "Note",
                    description: "Media will be attached after the daily log is saved",
                });
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
        if (!businessId || mode !== "edit" || !log?.id) {
            toast({
                title: "Error",
                description: "Can only link media to existing daily logs",
                variant: "error",
            });
            return { success: false, error: "Can only link media to existing daily logs" };
        }

        try {
            const success = await linkExistingMediaToDailyLog(businessId, mediaIds, log.id);
            if (success) {
                // Reload media data
                const [linked, available] = await Promise.all([
                    getMediaByDailyLogId(businessId, log.id),
                    getMedias(businessId)
                ]);
                setLinkedMedia(linked);
                setAvailableMedia(available);
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
        if (!businessId || mode !== "edit" || !log?.id) {
            return { success: false, error: "Can only unlink media from existing daily logs" };
        }

        try {
            // Unlink all provided media IDs
            const unlinkPromises = mediaIds.map(mediaId =>
                unlinkMediaFromDailyLog(businessId, mediaId, log.id)
            );
            const results = await Promise.all(unlinkPromises);

            // Check if all unlinks were successful
            const allSuccessful = results.every(result => result);

            if (allSuccessful) {
                // Reload media data
                const [linked, available] = await Promise.all([
                    getMediaByDailyLogId(businessId, log.id),
                    getMedias(businessId)
                ]);
                setLinkedMedia(linked);
                setAvailableMedia(available);
                return { success: true };
            }
            return { success: false, error: "Failed to unlink some media files" };
        } catch (error) {
            console.error("Error unlinking media:", error);
            return { success: false, error: "Failed to unlink media" };
        }
    };

    // Capture current weather
    const captureCurrentWeather = async () => {
        setWeatherLoading(true);
        try {
            // Request location permission
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });

            const { latitude, longitude } = position.coords;

            // Fetch weather data
            const response = await fetch(`/api/weather/current?lat=${latitude}&lon=${longitude}`);

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const weatherData = await response.json();

            // Format weather data for storage
            const weatherInfo = {
                location: {
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                },
                current: {
                    temperature: Math.round(weatherData.current.temp),
                    feelsLike: Math.round(weatherData.current.feels_like),
                    humidity: weatherData.current.humidity,
                    windSpeed: Math.round(weatherData.current.wind_speed),
                    windDirection: weatherData.current.wind_deg,
                    pressure: weatherData.current.pressure,
                    visibility: weatherData.current.visibility,
                    uvIndex: weatherData.current.uvi,
                    cloudCover: weatherData.current.clouds,
                    condition: weatherData.current.weather[0].main,
                    description: weatherData.current.weather[0].description,
                    icon: weatherData.current.weather[0].icon
                }
            };

            // Store as JSON string
            setFormData(prev => ({
                ...prev,
                weather: JSON.stringify(weatherInfo)
            }));

            toast({
                title: "Weather Captured",
                description: `Current weather conditions saved: ${weatherInfo.current.description}, ${weatherInfo.current.temperature}°F`,
            });

        } catch (error) {
            console.error('Error capturing weather:', error);
            let errorMessage = "Failed to capture weather data.";

            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                }
            }

            toast({
                title: "Weather Error",
                description: errorMessage,
                variant: "error",
            });
        } finally {
            setWeatherLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            date: format(new Date(), "yyyy-MM-dd"),
            project_id: "",
            crew_id: "",
            start_time: "08:00",
            end_time: "17:00",
            hours_worked: 8,
            overtime: 0,
            work_completed: "",
            work_planned: "",
            safety: "",
            quality: "",
            delays: "",
            notes: "",
            weather: "",
        });
        setMaterials([]);
        setEquipment([]);
        setActiveTab("general");
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.project_id) {
                throw new Error("Please select a project");
            }

            if (!formData.work_completed.trim()) {
                throw new Error("Please describe the work completed");
            }

            if (mode === "create") {
                // CREATE MODE
                const dailyLogData = {
                    author_id: user?.id,
                    project_id: formData.project_id,
                    crew_id: formData.crew_id || null,
                    date: formData.date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    hours_worked: formData.hours_worked,
                    overtime: formData.overtime,
                    work_completed: formData.work_completed,
                    work_planned: formData.work_planned,
                    safety: formData.safety || null,
                    quality: formData.quality || null,
                    delays: formData.delays || null,
                    notes: formData.notes || null,
                    weather: formData.weather || null,
                };

                const createdLog = await createDailyLog(businessId, dailyLogData as DailyLogInsert);

                if (!createdLog) {
                    throw new Error("Failed to create daily log");
                }

                // Create materials if any
                const materialPromises = materials
                    .filter(material => material.name?.trim())
                    .map(async (material) => {
                        const materialData: DailyLogMaterialInsert = {
                            id: crypto.randomUUID(),
                            daily_log_id: createdLog.id,
                            business_id: businessId,
                            name: material.name!,
                            quantity: material.quantityValue || null,
                            cost: material.cost || null,
                            unit: material.quantityUnit || null,
                            supplier: material.supplier || null,
                            notes: material.notes || null,
                            created_at: new Date().toISOString(),
                            created_by: user?.id || null,
                            updated_at: new Date().toISOString(),
                            updated_by: user?.id || null,
                        };

                        return await createDailyLogMaterial(businessId, materialData);
                    });

                // Create equipment if any
                const equipmentPromises = equipment
                    .filter(equip => equip.name?.trim())
                    .map(async (equip) => {
                        const equipmentData: DailyLogEquipmentInsert = {
                            id: crypto.randomUUID(),
                            daily_log_id: createdLog.id,
                            business_id: businessId,
                            equipment_id: equip.equipmentId || "",
                            crew_member_id: equip.crewMemberId || null,
                            name: equip.name!,
                            operator: equip.operator || null,
                            hours: equip.hours || 0,
                            condition: equip.condition || null,
                            created_at: new Date().toISOString(),
                            created_by: user?.id || null,
                            updated_at: new Date().toISOString(),
                            updated_by: user?.id || null,
                        };

                        return await createDailyLogEquipment(businessId, equipmentData);
                    });

                // Wait for all materials and equipment to be created
                await Promise.all([...materialPromises, ...equipmentPromises]);

                // Get the updated log with all details
                const refreshedLog = await getDailyLogWithDetailsById(businessId, createdLog.id);

                toast.success({
                    title: "Success",
                    description: "Daily log created successfully"
                });

                onSave(refreshedLog);
                resetForm();
                onClose();

            } else {
                // EDIT MODE
                if (!log) {
                    throw new Error("No log data provided for edit mode");
                }

                const dailyLogUpdateData = {
                    id: log.id,
                    author_id: log.author_id,
                    business_id: log.business_id,
                    project_id: formData.project_id,
                    crew_id: formData.crew_id || "",
                    date: formData.date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    work_planned: formData.work_planned,
                    work_completed: formData.work_completed,
                    hours_worked: formData.hours_worked,
                    overtime: formData.overtime,
                    safety: formData.safety,
                    quality: formData.quality,
                    delays: formData.delays,
                    notes: formData.notes,
                    weather: formData.weather,
                    updated_by: user?.id || log.updated_by,
                    created_at: log.created_at ?? new Date().toISOString(),
                    created_by: log.created_by ?? log.author_id,
                    updated_at: new Date().toISOString(),
                };

                // Update the main daily log
                const updatedLog = await updateDailyLog(businessId, log.id, dailyLogUpdateData);

                if (!updatedLog) {
                    throw new Error("Failed to update daily log");
                }

                // Handle materials updates
                const materialPromises = materials.map(async (material) => {
                    if (material.isNew) {
                        const newMaterial = {
                            id: material.id.startsWith('temp-') ? crypto.randomUUID() : material.id,
                            daily_log_id: log.id,
                            business_id: updatedLog.business_id,
                            name: material.name || "",
                            quantity: material.quantity,
                            cost: material.cost,
                            supplier: material.supplier || "",
                            notes: material.notes || "",
                        } as DailyLogMaterialInsert;

                        return await createDailyLogMaterial(businessId, newMaterial);
                    } else {
                        const materialUpdateData = {
                            name: material.name,
                            quantity: material.quantity,
                            cost: material.cost,
                            supplier: material.supplier || "",
                            notes: material.notes || "",
                        } as DailyLogMaterialUpdate;

                        return await updateDailyLogMaterial(businessId, material.id, materialUpdateData);
                    }
                });

                // Handle equipment updates
                const equipmentPromises = equipment.map(async (equip) => {
                    if (equip.isNew) {
                        const newEquipment = {
                            id: equip.id.startsWith('temp-') ? crypto.randomUUID() : equip.id,
                            daily_log_id: log.id,
                            business_id: updatedLog.business_id,
                            equipment_id: equip.equipmentId || "",
                            crew_member_id: equip.crewMemberId || null,
                            name: equip.name || "",
                            operator: equip.operator || null,
                            hours: equip.hours || 0,
                            condition: equip.condition || null,
                            created_at: new Date().toISOString(),
                            created_by: user?.id || null,
                            updated_at: new Date().toISOString(),
                            updated_by: user?.id || null,
                        } as DailyLogEquipmentInsert;

                        return await createDailyLogEquipment(businessId, newEquipment);
                    } else {
                        const equipmentUpdateData = {
                            equipment_id: equip.equipmentId,
                            crew_member_id: equip.crewMemberId,
                            name: equip.name,
                            operator: equip.operator,
                            hours: equip.hours,
                            condition: equip.condition,
                            updated_at: new Date().toISOString(),
                            updated_by: user?.id || null,
                        } as DailyLogEquipmentUpdate;

                        return await updateDailyLogEquipment(businessId, equip.id, equipmentUpdateData);
                    }
                });

                // Wait for all updates to complete
                await Promise.all([...materialPromises, ...equipmentPromises]);

                // Get the updated log with all details
                const refreshedLog = await getDailyLogWithDetailsById(businessId, log.id);

                toast.success({
                    title: "Success",
                    description: "Daily log updated successfully"
                });

                onSave(refreshedLog);
                onClose();
            }
        } catch (err) {
            console.error(`Error ${mode === "create" ? "creating" : "updating"} daily log:`, err);
            const errorMessage = err instanceof Error ? err.message : `An error occurred while ${mode === "create" ? "creating" : "updating"} the daily log`;
            setError(errorMessage);
            toast.error({
                title: "Error",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (mode === "create") {
            resetForm();
        }
        onClose();
    };

    if (!isLoaded) {
        return <div className="loading">Loading...</div>;
    }

    if (mode === "create" && !user) {
        throw new Error("User not authenticated");
    }

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {mode === "create" ? "Create Daily Log" : "Edit Daily Log"}
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loadingData && (
                    <div className="p-6 text-center">
                        <span className="loading loading-spinner loading-lg"></span>
                        <p className="mt-2">Loading data...</p>
                    </div>
                )}

                {/* Error State */}
                {fetchError && (
                    <div className="p-6">
                        <div className="alert alert-error">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{fetchError}</span>
                        </div>
                    </div>
                )}

                {/* Modal Body */}
                {!loadingData && !fetchError && (
                    <div className="p-6 overflow-y-auto max-h-[75vh]">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Tab Navigation */}
                            <div className="tabs tabs-boxed bg-base-200 p-1">
                                <button
                                    type="button"
                                    className={`tab ${activeTab === "general" ? "tab-active" : ""}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveTab("general");
                                    }}
                                >
                                    General
                                </button>
                                <button
                                    type="button"
                                    className={`tab ${activeTab === "materials" ? "tab-active" : ""}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveTab("materials");
                                    }}
                                >
                                    Materials
                                </button>
                                <button
                                    type="button"
                                    className={`tab ${activeTab === "equipment" ? "tab-active" : ""}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveTab("equipment");
                                    }}
                                >
                                    Equipment
                                </button>
                                <button
                                    type="button"
                                    className={`tab ${activeTab === "notes" ? "tab-active" : ""}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveTab("notes");
                                    }}
                                >
                                    Notes
                                </button>
                                <button
                                    type="button"
                                    className={`tab ${activeTab === "media" ? "tab-active" : ""}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveTab("media");
                                    }}
                                >
                                    Media
                                </button>
                            </div>

                            {/* General Tab */}
                            {activeTab === "general" && (
                                <div className="space-y-6">
                                    {/* Basic Information Section */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-calendar-alt text-primary"></i>
                                                Basic Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Date *</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={formData.date}
                                                        onChange={handleInputChange}
                                                        className="input input-bordered input-secondary w-full"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Project *</span>
                                                    </label>
                                                    {loadingData ? (
                                                        <select className="select select-bordered select-secondary w-full" disabled>
                                                            <option>Loading projects...</option>
                                                        </select>
                                                    ) : (
                                                        <select
                                                            name="project_id"
                                                            value={formData.project_id}
                                                            onChange={handleInputChange}
                                                            className="select select-bordered select-secondary w-full"
                                                            required
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Project</option>
                                                            {projects.map((project) => (
                                                                <option key={project.id} value={project.id}>
                                                                    {project.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Crew</span>
                                                    </label>
                                                    {loadingData ? (
                                                        <select className="select select-bordered select-secondary w-full" disabled>
                                                            <option>Loading crews...</option>
                                                        </select>
                                                    ) : (
                                                        <select
                                                            name="crew_id"
                                                            value={formData.crew_id}
                                                            onChange={handleInputChange}
                                                            className="select select-bordered select-secondary w-full"
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Crew</option>
                                                            {crews.map((crew) => (
                                                                <option key={crew.id} value={crew.id}>
                                                                    {crew.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Hours Worked</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        name="hours_worked"
                                                        value={formData.hours_worked}
                                                        onChange={handleNumberInputChange}
                                                        className="input input-bordered input-secondary w-full"
                                                        min="0"
                                                        max="24"
                                                        placeholder="8.0"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Tracking Section */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-clock text-primary"></i>
                                                Time Tracking
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Start Time</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        name="start_time"
                                                        value={formData.start_time}
                                                        onChange={handleTimeChange}
                                                        className="input input-bordered input-secondary w-full"
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">End Time</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        name="end_time"
                                                        value={formData.end_time}
                                                        onChange={handleTimeChange}
                                                        className="input input-bordered input-secondary w-full"
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Overtime Hours</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        name="overtime"
                                                        value={formData.overtime}
                                                        onChange={handleNumberInputChange}
                                                        className="input input-bordered input-secondary w-full"
                                                        min="0"
                                                        max="12"
                                                        placeholder="0"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Work Description Section */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-tasks text-primary"></i>
                                                Work Description
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Work Completed *</span>
                                                        <span className="label-text-alt">Describe what was accomplished today</span>
                                                    </label>
                                                    <textarea
                                                        name="work_completed"
                                                        value={formData.work_completed}
                                                        onChange={handleInputChange}
                                                        className="textarea textarea-bordered textarea-secondary h-32 w-full"
                                                        placeholder="Describe the work completed today..."
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Work Planned</span>
                                                        <span className="label-text-alt">Describe what's planned for tomorrow</span>
                                                    </label>
                                                    <textarea
                                                        name="work_planned"
                                                        value={formData.work_planned}
                                                        onChange={handleInputChange}
                                                        className="textarea textarea-bordered textarea-secondary h-24 w-full"
                                                        placeholder="Describe the work planned for tomorrow..."
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Materials Tab */}
                            {activeTab === "materials" && (
                                <div className="space-y-6">
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    <i className="far fa-boxes text-primary"></i>
                                                    Materials Used
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addMaterial}
                                                    className="btn btn-primary btn-sm"
                                                    disabled={loading}
                                                >
                                                    <i className="far fa-plus mr-2"></i>
                                                    Add Material
                                                </button>
                                            </div>

                                            {materials.length === 0 ? (
                                                <div className="text-center py-8 text-base-content/60">
                                                    No materials added yet. Click "Add Material" to get started.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {materials.map((material, index) => (
                                                        <div key={material.id} className="card bg-base-100 border border-base-300">
                                                            <div className="card-body p-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                                    <div className="form-control md:col-span-3">
                                                                        <label className="label">
                                                                            <span className="label-text">Material Name</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={material.name || ""}
                                                                            onChange={(e) => handleMaterialChange(index, "name", e.target.value)}
                                                                            className="input input-bordered input-secondary input-sm w-full"
                                                                            placeholder="Enter material name"
                                                                        />
                                                                    </div>

                                                                    <div className="form-control md:col-span-2">
                                                                        <label className="label">
                                                                            <span className="label-text">Supplier</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={material.supplier || ""}
                                                                            onChange={(e) => handleMaterialChange(index, "supplier", e.target.value)}
                                                                            className="input input-bordered input-secondary input-sm"
                                                                            placeholder="Enter supplier name"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeMaterial(index)}
                                                                        className="btn btn-error btn-sm mt-7"
                                                                    >
                                                                        Remove
                                                                    </button>

                                                                    <div className="form-control md:col-span-2">
                                                                        <label className="label">
                                                                            <span className="label-text">Quantity</span>
                                                                        </label>
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="number"
                                                                                step="0.1"
                                                                                value={material.quantityValue}
                                                                                onChange={(e) => handleMaterialChange(index, "quantityValue", e.target.value)}
                                                                                className="input input-bordered input-secondary input-sm flex-1"
                                                                                placeholder="0"
                                                                                min="0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="form-control md:col-span-2">
                                                                        <label className="label">
                                                                            <span className="label-text">Unit</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={material.quantityUnit}
                                                                            onChange={(e) => handleMaterialChange(index, "quantityUnit", e.target.value)}
                                                                            className="input input-bordered input-secondary input-sm"
                                                                            placeholder="Unit"
                                                                        />
                                                                    </div>

                                                                    <div className="form-control md:col-span-2">
                                                                        <label className="label">
                                                                            <span className="label-text">Cost ($)</span>
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={material.cost || ""}
                                                                            onChange={(e) => handleMaterialChange(index, "cost", e.target.value)}
                                                                            className="input input-bordered input-secondary input-sm"
                                                                            placeholder="0.00"
                                                                            min="0"
                                                                        />
                                                                    </div>
                                                                    <div className="form-control md:col-span-6">
                                                                        <label className="label">
                                                                            <span className="label-text">Notes</span>
                                                                        </label>
                                                                        <textarea
                                                                            value={material.notes || ""}
                                                                            onChange={(e) => handleMaterialChange(index, "notes", e.target.value)}
                                                                            className="textarea textarea-bordered textarea-sm w-full textarea-secondary"
                                                                            placeholder="Additional notes"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}                            {/* Equipment Tab */}
                            {activeTab === "equipment" && (
                                <div className="space-y-6">
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    <i className="far fa-tools text-primary"></i>
                                                    Equipment Used
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addEquipment}
                                                    className="btn btn-primary btn-sm"
                                                    disabled={loading}
                                                >
                                                    <i className="far fa-plus mr-2"></i>
                                                    Add Equipment
                                                </button>
                                            </div>

                                            {equipment.length === 0 ? (
                                                <div className="text-center py-8 text-base-content/60">
                                                    No equipment added yet. Click "Add Equipment" to get started.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {equipment.map((equip, index) => (
                                                        <div key={equip.id} className="card bg-base-100 border border-base-300">
                                                            <div className="card-body p-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                    <div className="form-control">
                                                                        <label className="label">
                                                                            <span className="label-text">Equipment Name</span>
                                                                        </label>
                                                                        <select
                                                                            value={equip.equipmentId || ""}
                                                                            onChange={(e) => {
                                                                                const selectedEquipment = equipments.find(eq => eq.id === e.target.value);
                                                                                handleEquipmentChange(index, "equipmentId", e.target.value);
                                                                                handleEquipmentChange(index, "name", selectedEquipment?.name || "");
                                                                            }}
                                                                            className="select select-bordered select-secondary select-sm"
                                                                        >
                                                                            <option value="">Select Equipment</option>
                                                                            {equipments.map((equipment) => (
                                                                                <option key={equipment.id} value={equipment.id}>
                                                                                    {equipment.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        {/* Show custom name field if "Other" or custom equipment */}
                                                                        {(!equip.equipmentId || equip.equipmentId === "") && (
                                                                            <input
                                                                                type="text"
                                                                                value={equip.name || ""}
                                                                                onChange={(e) => handleEquipmentChange(index, "name", e.target.value)}
                                                                                className="input input-bordered input-secondary input-sm mt-2"
                                                                                placeholder="Enter custom equipment name"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="form-control">
                                                                        <label className="label">
                                                                            <span className="label-text">Hours Used</span>
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.5"
                                                                            value={equip.hours || ""}
                                                                            onChange={(e) => handleEquipmentChange(index, "hours", e.target.value)}
                                                                            className="input input-bordered input-secondary input-sm"
                                                                            placeholder="0"
                                                                            min="0"
                                                                        />
                                                                    </div>

                                                                    <div className="form-control">
                                                                        <label className="label">
                                                                            <span className="label-text">Operator</span>
                                                                        </label>
                                                                        <select
                                                                            value={equip.crewMemberId || ""}
                                                                            onChange={(e) => {
                                                                                const selectedMember = crewMembers.find(member => member.id === e.target.value);
                                                                                handleEquipmentChange(index, "crewMemberId", e.target.value);
                                                                                handleEquipmentChange(index, "operator", selectedMember?.name || "");
                                                                            }}
                                                                            className="select select-bordered select-secondary select-sm"
                                                                        >
                                                                            <option value="">Select Operator</option>
                                                                            {crewMembers.map((member) => (
                                                                                <option key={member.id} value={member.id}>
                                                                                    {member.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        {/* Show custom operator field if no crew member selected */}
                                                                        {(!equip.crewMemberId || equip.crewMemberId === "") && (
                                                                            <input
                                                                                type="text"
                                                                                value={equip.operator || ""}
                                                                                onChange={(e) => handleEquipmentChange(index, "operator", e.target.value)}
                                                                                className="input input-bordered input-secondary input-sm mt-2"
                                                                                placeholder="Enter operator name"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <div className="form-control">
                                                                        <label className="label">
                                                                            <span className="label-text">Actions</span>
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeEquipment(index)}
                                                                            className="btn btn-error btn-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes Tab */}
                            {activeTab === "notes" && (
                                <div className="space-y-6">
                                    {/* Safety & Quality Section */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-shield-alt text-primary"></i>
                                                Safety & Quality
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Safety Notes</span>
                                                        <span className="label-text-alt">Any safety observations or incidents</span>
                                                    </label>
                                                    <textarea
                                                        name="safety"
                                                        value={formData.safety}
                                                        onChange={handleInputChange}
                                                        className="textarea textarea-bordered textarea-secondary h-24 w-full"
                                                        placeholder="Record any safety observations, incidents, or concerns..."
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Quality Notes</span>
                                                        <span className="label-text-alt">Quality observations and inspections</span>
                                                    </label>
                                                    <textarea
                                                        name="quality"
                                                        value={formData.quality}
                                                        onChange={handleInputChange}
                                                        className="textarea textarea-bordered textarea-secondary h-24 w-full"
                                                        placeholder="Record quality observations, inspections, and standards compliance..."
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Issues & Weather Section */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-exclamation-triangle text-primary"></i>
                                                Issues & Conditions
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Delays & Issues</span>
                                                        <span className="label-text-alt">Any delays, issues, or problems encountered</span>
                                                    </label>
                                                    <textarea
                                                        name="delays"
                                                        value={formData.delays}
                                                        onChange={handleInputChange}
                                                        className="textarea textarea-bordered textarea-secondary h-24 w-full"
                                                        placeholder="Describe any delays, issues, or problems that occurred..."
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Weather Conditions</span>
                                                        <button
                                                            type="button"
                                                            onClick={captureCurrentWeather}
                                                            disabled={weatherLoading || loading}
                                                            className="btn btn-outline btn-sm ml-2"
                                                        >
                                                            {weatherLoading ? (
                                                                <>
                                                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                                                    Capturing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="far fa-cloud-sun mr-2"></i>
                                                                    Capture Current Weather
                                                                </>
                                                            )}
                                                        </button>
                                                    </label>
                                                    <textarea
                                                        name="weather"
                                                        value={formData.weather}
                                                        onChange={handleInputChange}
                                                        className="textarea textarea-bordered textarea-secondary h-24 w-full"
                                                        placeholder="Describe weather conditions during work..."
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Notes Section */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-sticky-note text-primary"></i>
                                                Additional Notes
                                            </h3>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">General Notes</span>
                                                    <span className="label-text-alt">Any additional observations or information</span>
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    className="textarea textarea-bordered textarea-secondary h-32 w-full"
                                                    placeholder="Add any additional notes, observations, or information..."
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Media Tab */}
                            {activeTab === "media" && (
                                <div className="space-y-6">
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-images text-primary"></i>
                                                Photos & Documents
                                            </h3>

                                            {mode === "create" ? (
                                                <div className="text-center py-8">
                                                    <div className="alert alert-info">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div>
                                                            <h4 className="font-bold">Media Upload Available After Save</h4>
                                                            <div className="text-sm">
                                                                You can upload photos and documents after creating this daily log.
                                                                Save the log first, then edit it to add media files.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : mediaLoading ? (
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
                                                    enableCamera={true}
                                                    cameraQuality="high"
                                                    title="Daily Log Media"
                                                    description="Upload photos and documents or link existing media to this daily log"
                                                    onComplete={() => {
                                                        // Optional: Handle completion events
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-outline"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="btn btn-primary"
                            disabled={loading || loadingData}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {mode === "create" ? "Creating..." : "Updating..."}
                                </>
                            ) : (
                                mode === "create" ? "Create Log" : "Update Log"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

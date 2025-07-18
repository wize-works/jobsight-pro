"use client";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { useState, useEffect } from "react";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { DailyLogAPI } from "@/lib/api/daily-logs";
import { format } from "date-fns";
import { DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";

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

type EditModalProps = {
    log: DailyLogWithDetails;
    crews: Crew[];
    projects: Project[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedLog: DailyLogWithDetails) => void;
};

export default function EditModal({
    log,
    crews,
    projects,
    isOpen,
    onClose,
    onSave
}: EditModalProps) {
    const { businessId } = useBusiness();
    const { updateDailyLog, getDailyLogWithDetails } = useDailyLogs();

    const [formData, setFormData] = useState({
        date: "",
        project_id: "",
        crew_id: "",
        start_time: "08:00",
        end_time: "17:00",
        hours_worked: 0,
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
        quantity: string | null;
        cost: number | null;
        quantityValue: number;
        quantityUnit: string;
        isNew?: boolean;
    }>>([]);

    const [equipment, setEquipment] = useState<Array<{
        id: string;
        name: string | null;
        hours: number | null;
        isNew?: boolean;
    }>>([]);
    const [activeTab, setActiveTab] = useState<"general" | "materials" | "equipment" | "notes">("general");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);    // Initialize form data from log
    useEffect(() => {
        if (log) {
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
        }
    }, [log]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }; const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                name: "",
                hours: 0,
                isNew: true
            }
        ]);
    };

    // Remove material
    const removeMaterial = (index: number) => {
        setMaterials(prev => prev.filter((_, i) => i !== index));
    };    // Remove equipment
    const removeEquipment = (index: number) => {
        setEquipment(prev => prev.filter((_, i) => i !== index));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {            // Update the main daily log first
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
                quality: formData.quality, delays: formData.delays,
                notes: formData.notes,
                weather: formData.weather,
                updated_by: log.updated_by ?? null,
                created_at: log.created_at ?? new Date().toISOString(),
                created_by: log.created_by ?? log.author_id,
                updated_at: new Date().toISOString(),
            };

            // Update the main daily log
            const updatedLog = await updateDailyLog(log.id, dailyLogUpdateData);

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
                    } as DailyLogMaterialInsert;

                    return await DailyLogAPI.createMaterial(log.id, newMaterial);
                } else {
                    const materialUpdateData = {
                        name: material.name,
                        quantity: material.quantity,
                        cost: material.cost,
                    } as DailyLogMaterialUpdate;

                    return await DailyLogAPI.updateMaterial(log.id, material.id, materialUpdateData);
                }
            });

            // Handle equipment updates
            const equipmentPromises = equipment.map(async (equip) => {
                if (equip.isNew) {
                    const newEquipment = {
                        id: equip.id.startsWith('temp-') ? crypto.randomUUID() : equip.id,
                        daily_log_id: log.id,
                        business_id: updatedLog.business_id,
                        equipment_id: "",
                        name: equip.name || "",
                        hours: equip.hours,
                    } as DailyLogEquipmentInsert;

                    return await DailyLogAPI.createEquipment(log.id, newEquipment);
                } else {
                    const equipmentUpdateData = {
                        name: equip.name,
                        hours: equip.hours,
                    } as DailyLogEquipmentUpdate;

                    return await DailyLogAPI.updateEquipment(log.id, equip.id, equipmentUpdateData);
                }
            });

            // Wait for all updates to complete
            await Promise.all([...materialPromises, ...equipmentPromises]);

            // Get the updated log with all details
            const refreshedLog = await getDailyLogWithDetails(log.id);
            if (!refreshedLog) {
                throw new Error("Failed to refresh log data");
            }

            toast.success({
                title: "Success",
                description: "Daily log updated successfully"
            });

            // Update the UI with the refreshed data
            onSave(refreshedLog);
            onClose();
        } catch (err) {
            console.error("Error updating daily log:", err);
            const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the daily log";
            setError(errorMessage);
            toast.error({
                title: "Error",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            Edit Daily Log
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tabs */}
                        <div className="tabs tabs-boxed bg-base-200 p-1">
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "general" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("general")}
                            >
                                <i className="far fa-clipboard-list"></i>
                                <span className="hidden md:inline">General</span>
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "materials" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("materials")}
                            >
                                <i className="far fa-boxes"></i>
                                <span className="hidden md:inline">Materials</span>
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "equipment" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("equipment")}
                            >
                                <i className="far fa-truck"></i>
                                <span className="hidden md:inline">Equipment</span>
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "notes" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("notes")}
                            >
                                <i className="far fa-sticky-note"></i>
                                <span className="hidden md:inline">Notes</span>
                            </button>
                        </div>                        {/* General Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-info-circle text-primary"></i>
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
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Project *</span>
                                                </label>
                                                <select
                                                    name="project_id"
                                                    className="select select-bordered select-secondary w-full"
                                                    value={formData.project_id}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={loading}
                                                >
                                                    <option value="">Select a project</option>
                                                    {projects.map(project => (
                                                        <option key={project.id} value={project.id}>
                                                            {project.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Crew</span>
                                                </label>
                                                <select
                                                    name="crew_id"
                                                    className="select select-bordered select-secondary w-full"
                                                    value={formData.crew_id}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                >
                                                    <option value="">No crew assigned</option>
                                                    {crews.map(crew => (
                                                        <option key={crew.id} value={crew.id}>
                                                            {crew.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Weather</span>
                                                </label>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary gap-2"
                                                        onClick={captureCurrentWeather}
                                                        disabled={loading || weatherLoading}
                                                    >
                                                        {weatherLoading ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-sm"></span>
                                                                Capturing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="far fa-map-marker-alt"></i>
                                                                Capture Current Weather
                                                            </>
                                                        )}
                                                    </button>

                                                    {formData.weather && (
                                                        <div className="flex items-center gap-2 text-sm text-success">
                                                            <i className="far fa-check-circle"></i>
                                                            Weather data captured
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {formData.weather && (() => {
                                            try {
                                                const weatherInfo = JSON.parse(formData.weather);
                                                return (
                                                    <div className="alert alert-info">
                                                        <i className="far fa-info-circle"></i>
                                                        <div>
                                                            <div className="font-medium">Current Conditions</div>
                                                            <div className="text-sm">
                                                                {weatherInfo.current.description} • {weatherInfo.current.temperature}°F
                                                                (feels like {weatherInfo.current.feelsLike}°F) •
                                                                Wind: {weatherInfo.current.windSpeed} mph •
                                                                Humidity: {weatherInfo.current.humidity}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            } catch {
                                                return (
                                                    <div className="text-sm text-base-content/60">
                                                        Weather data: {formData.weather.substring(0, 100)}...
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>

                                {/* Schedule & Hours */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-clock text-primary"></i>
                                            Schedule & Hours
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Start Time</span>
                                                </label>
                                                <input
                                                    type="time"
                                                    name="start_time"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.start_time}
                                                    onChange={handleTimeChange}
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
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.end_time}
                                                    onChange={handleTimeChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Hours Worked</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="hours_worked"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.hours_worked}
                                                    onChange={handleNumberInputChange}
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="8.0"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Overtime Hours</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="overtime"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.overtime}
                                                    onChange={handleNumberInputChange}
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="0.0"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Work Details */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-cogs text-primary"></i>
                                            Work Details
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Work Completed *</span>
                                                </label>
                                                <textarea
                                                    name="work_completed"
                                                    className="textarea textarea-bordered textarea-secondary w-full"
                                                    value={formData.work_completed}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the work completed today..."
                                                    rows={4}
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Work Planned for Next Day</span>
                                                </label>
                                                <textarea
                                                    name="work_planned"
                                                    className="textarea textarea-bordered textarea-secondary w-full"
                                                    value={formData.work_planned}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe work planned for the next day..."
                                                    rows={3}
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Safety Concerns</span>
                                                    </label>
                                                    <textarea
                                                        name="safety"
                                                        className="textarea textarea-bordered textarea-secondary w-full"
                                                        value={formData.safety}
                                                        onChange={handleInputChange}
                                                        placeholder="Any safety concerns or incidents..."
                                                        rows={3}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Quality Assessment</span>
                                                    </label>
                                                    <textarea
                                                        name="quality"
                                                        className="textarea textarea-bordered textarea-secondary w-full"
                                                        value={formData.quality}
                                                        onChange={handleInputChange}
                                                        placeholder="Quality assessment notes..."
                                                        rows={3}
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Delays</span>
                                                </label>
                                                <textarea
                                                    name="delays"
                                                    className="textarea textarea-bordered textarea-secondary w-full"
                                                    value={formData.delays}
                                                    onChange={handleInputChange}
                                                    placeholder="Any delays or setbacks..."
                                                    rows={3}
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
                                                className="btn btn-primary btn-sm gap-2"
                                                onClick={addMaterial}
                                                disabled={loading}
                                            >
                                                <i className="far fa-plus"></i>
                                                Add Material
                                            </button>
                                        </div>

                                        {materials.length === 0 ? (
                                            <div className="text-center py-8">
                                                <i className="far fa-boxes text-4xl text-base-content/30 mb-2"></i>
                                                <p className="text-base-content/70">No materials added yet</p>
                                                <p className="text-sm text-base-content/50">Click "Add Material" to track materials used</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {materials.map((material, index) => (
                                                    <div key={material.id} className="border border-base-300 rounded-lg p-4 bg-base-50">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="font-medium">Material #{index + 1}</h4>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-square btn-ghost text-error hover:bg-error hover:text-error-content"
                                                                onClick={() => removeMaterial(index)}
                                                                disabled={loading}
                                                            >
                                                                <i className="far fa-trash"></i>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Material Name *</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={material.name || ""}
                                                                    onChange={(e) => handleMaterialChange(index, "name", e.target.value)}
                                                                    placeholder="e.g., Concrete, Lumber, Rebar..."
                                                                    required
                                                                    disabled={loading}
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Cost ($)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={material.cost || ""}
                                                                    onChange={(e) => handleMaterialChange(index, "cost", e.target.value)}
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    min="0"
                                                                    disabled={loading}
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Quantity</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={material.quantityValue}
                                                                    onChange={(e) => handleMaterialChange(index, "quantityValue", e.target.value)}
                                                                    placeholder="0"
                                                                    min="0"
                                                                    step="0.01"
                                                                    disabled={loading}
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Unit</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={material.quantityUnit || ""}
                                                                    onChange={(e) => handleMaterialChange(index, "quantityUnit", e.target.value)}
                                                                    placeholder="e.g., pieces, yards, tons"
                                                                    disabled={loading}
                                                                />
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

                        {/* Equipment Tab */}
                        {activeTab === "equipment" && (
                            <div className="space-y-6">
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <i className="far fa-truck text-primary"></i>
                                                Equipment Used
                                            </h3>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm gap-2"
                                                onClick={addEquipment}
                                                disabled={loading}
                                            >
                                                <i className="far fa-plus"></i>
                                                Add Equipment
                                            </button>
                                        </div>

                                        {equipment.length === 0 ? (
                                            <div className="text-center py-8">
                                                <i className="far fa-truck text-4xl text-base-content/30 mb-2"></i>
                                                <p className="text-base-content/70">No equipment added yet</p>
                                                <p className="text-sm text-base-content/50">Click "Add Equipment" to track equipment used</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {equipment.map((equip, index) => (
                                                    <div key={equip.id} className="border border-base-300 rounded-lg p-4 bg-base-50">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="font-medium">Equipment #{index + 1}</h4>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-square btn-ghost text-error hover:bg-error hover:text-error-content"
                                                                onClick={() => removeEquipment(index)}
                                                                disabled={loading}
                                                            >
                                                                <i className="far fa-trash"></i>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Equipment Name *</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={equip.name || ""}
                                                                    onChange={(e) => handleEquipmentChange(index, "name", e.target.value)}
                                                                    placeholder="e.g., Excavator, Bulldozer, Crane..."
                                                                    required
                                                                    disabled={loading}
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Hours Used</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={equip.hours || ""}
                                                                    onChange={(e) => handleEquipmentChange(index, "hours", e.target.value)}
                                                                    placeholder="0.0"
                                                                    min="0"
                                                                    step="0.5"
                                                                    disabled={loading}
                                                                />
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
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-sticky-note text-primary"></i>
                                            Additional Notes
                                        </h3>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Notes</span>
                                            </label>
                                            <textarea
                                                name="notes"
                                                className="textarea textarea-bordered textarea-secondary w-full"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                placeholder="Any additional notes, observations, or important details about today's work..."
                                                rows={10}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="far fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-save"></i>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
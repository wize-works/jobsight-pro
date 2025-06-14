"use client";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { DailyLogInsert, DailyLogWithDetails } from "@/types/daily-logs";
import { useState, useEffect } from "react";
import { createDailyLog } from "@/app/actions/daily-logs";
import { createDailyLogMaterial } from "@/app/actions/daily-log-materials";
import { createDailyLogEquipment } from "@/app/actions/daily-log-equipment";
import { format } from "date-fns";
import { DailyLogMaterialInsert } from "@/types/daily-log-materials";
import { DailyLogEquipmentInsert } from "@/types/daily-log-equipment";
import { toast } from "@/hooks/use-toast";
import { Equipment, EquipmentCondition, equipmentConditionOptions } from "@/types/equipment";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { CrewMember } from "@/types/crew-members";
import { useRouter, useSearchParams } from "next/navigation";

type CreateDailyLogModalProps = {
    crews: Crew[];
    projects: Project[];
    equipments: Equipment[];
    crewMembers?: CrewMember[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (newLog: DailyLogWithDetails) => void;
};

export default function CreateDailyLogModal({
    crews,
    projects,
    equipments,
    crewMembers = [],
    isOpen,
    onClose,
    onSave
}: CreateDailyLogModalProps) {
    const [activeTab, setActiveTab] = useState<"general" | "materials" | "equipment" | "notes">("general");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        name: string;
        quantity: string;
        cost: number;
        quantityValue: number;
        quantityUnit: string;
        supplier: string;
    }>>([]);

    const [equipment, setEquipment] = useState<Array<{
        id: string;
        equipmentId?: string;
        name: string;
        operator: string;
        crewMemberId: string | null;
        hours: number;
        condition: string;
    }>>([]);
    const { getUser, isLoading } = useKindeAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = getUser();

    // Check for AI-generated log data on component mount
    useEffect(() => {
        const aiLogData = sessionStorage.getItem('aiGeneratedLog');
        if (aiLogData) {
            try {
                const parsedData = JSON.parse(aiLogData);
                console.log('Processing AI log data:', parsedData);
                
                // Pre-fill form with AI-generated data
                if (parsedData.summary) {
                    setFormData(prev => ({ ...prev, work_completed: parsedData.summary }));
                }
                if (parsedData.work_completed) {
                    if (Array.isArray(parsedData.work_completed)) {
                        setFormData(prev => ({
                            ...prev,
                            work_completed: parsedData.work_completed.join('. ')
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, work_completed: parsedData.work_completed }));
                    }
                }
                if (parsedData.weather) {
                    setFormData(prev => ({ ...prev, weather: parsedData.weather }));
                }
                if (parsedData.safety_notes) {
                    setFormData(prev => ({ ...prev, safety: parsedData.safety_notes }));
                }
                if (parsedData.issues) {
                    if (Array.isArray(parsedData.issues)) {
                        setFormData(prev => ({
                            ...prev,
                            delays: parsedData.issues.join('. ')
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, delays: parsedData.issues }));
                    }
                }

                // Handle materials
                if (parsedData.materials_used && Array.isArray(parsedData.materials_used)) {
                    const aiMaterials = parsedData.materials_used.map((material: any, index: number) => ({
                        id: `ai-${index}`,
                        name: material.name || material || '',
                        quantity: material.quantity || '0',
                        cost: 0,
                        quantityValue: parseFloat(material.quantity) || 0,
                        quantityUnit: material.unit || '',
                        supplier: ''
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
                        condition: 'good'
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
    }, [searchParams.toString()]);

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
                    const start = new Date(`2000-01-01T${startTime}:00`);
                    const end = new Date(`2000-01-01T${endTime}:00`);
                    let diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                    // Handle overnight shifts
                    if (diffHours < 0) {
                        diffHours += 24;
                    }

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

            if (field === "quantityValue") {
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
                const numValue = value === "" ? 0 : Number(value);
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
                    [field]: value === "" ? 0 : Number(value)
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
                supplier: ""
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

            // Create the main daily log
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

            const createdLog = await createDailyLog(dailyLogData as DailyLogInsert);

            if (!createdLog) {
                throw new Error("Failed to create daily log");
            }

            // Create materials if any
            const materialPromises = materials
                .filter(material => material.name.trim())
                .map(async (material) => {
                    const materialData: DailyLogMaterialInsert = {
                        id: crypto.randomUUID(),
                        daily_log_id: createdLog.id,
                        business_id: "", // Will be set by the server action
                        name: material.name,
                        quantity: Number(material.quantity) || null,
                        cost: material.cost || null,
                        supplier: material.supplier || null,
                        notes: null,
                    } as DailyLogMaterialInsert;

                    return await createDailyLogMaterial(materialData);
                });

            // Create equipment if any
            const equipmentPromises = equipment
                .filter(equip => equip.name.trim())
                .map(async (equip) => {
                    const equipmentData: DailyLogEquipmentInsert = {
                        daily_log_id: createdLog.id,
                        business_id: "", // Will be set by the server action
                        equipment_id: "", // For now, we're not linking to specific equipment
                        crew_member_id: null, // Not linking to specific crew member
                        name: equip.name,
                        operator: equip.operator || null,
                        hours: equip.hours || null,
                        condition: equip.condition || null,
                    } as DailyLogEquipmentInsert;

                    return await createDailyLogEquipment(equipmentData);
                });

            // Wait for all materials and equipment to be created
            await Promise.all([...materialPromises, ...equipmentPromises]);

            // Find the selected project and crew for the response
            const selectedProject = projects.find(p => p.id === formData.project_id);
            const selectedCrew = crews.find(c => c.id === formData.crew_id);

            // Create a mock DailyLogWithDetails for the UI update
            const newLogWithDetails: DailyLogWithDetails = {
                ...createdLog,
                materials: materials
                    .filter(material => material.name.trim())
                    .map(material => ({
                        id: crypto.randomUUID(),
                        name: material.name,
                        quantity: Number(material.quantityValue) || null,
                        cost: material.cost || 0,
                        supplier: material.supplier || null,
                    })),
                equipment: equipment
                    .filter(equip => equip.name.trim())
                    .map(equip => ({
                        id: crypto.randomUUID(),
                        name: equip.name,
                        operator: equip.operator || null,
                        crew_member_id: equip.crewMemberId || null,
                        condition: equip.condition || "good",
                        equipment_id: equip.equipmentId || null,
                        hours: equip.hours || 0,
                    })),
                project: selectedProject ? {
                    id: selectedProject.id,
                    name: selectedProject.name,
                    description: selectedProject.description,
                } : {
                    id: "",
                    name: "Unknown Project",
                    description: null,
                },
                crew: selectedCrew ? {
                    id: selectedCrew.id,
                    name: selectedCrew.name,
                } : null,
                client: {
                    id: "",
                    name: null,
                    contact_name: null,
                    contact_email: null,
                    contact_phone: null,
                }
            };

            toast.success({
                title: "Success",
                description: "Daily log created successfully"
            });

            // Update the UI and close modal
            onSave(newLogWithDetails);
            resetForm();
            onClose();
        } catch (err) {
            console.error("Error creating daily log:", err);
            const errorMessage = err instanceof Error ? err.message : "An error occurred while creating the daily log";
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
        resetForm();
        onClose();
    };


    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }
    if (!user) {
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
                            Create Daily Log
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tabs */}
                        <div className="tabs tabs-box p-1">
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "general" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("general")}
                            >
                                <i className="fas fa-clipboard-list"></i>
                                <span className="hidden md:inline">General</span>
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "materials" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("materials")}
                            >
                                <i className="fas fa-boxes"></i>
                                <span className="hidden md:inline">Materials</span>
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "equipment" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("equipment")}
                            >
                                <i className="fas fa-truck"></i>
                                <span className="hidden md:inline">Equipment</span>
                            </button>
                            <button
                                type="button"
                                className={`tab tab-sm md:tab-md gap-2 ${activeTab === "notes" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("notes")}
                            >
                                <i className="fas fa-sticky-note"></i>
                                <span className="hidden md:inline">Notes</span>
                            </button>
                        </div>

                        {/* General Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="fas fa-info-circle text-primary"></i>
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
                                                <input
                                                    type="text"
                                                    name="weather"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.weather}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., Sunny, 75°F"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule & Hours */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="fas fa-clock text-primary"></i>
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
                                            <i className="fas fa-cogs text-primary"></i>
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
                                                <i className="fas fa-boxes text-primary"></i>
                                                Materials Used
                                            </h3>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm gap-2"
                                                onClick={addMaterial}
                                                disabled={loading}
                                            >
                                                <i className="fas fa-plus"></i>
                                                Add Material
                                            </button>
                                        </div>

                                        {materials.length === 0 ? (
                                            <div className="text-center py-8">
                                                <i className="fas fa-boxes text-4xl text-base-content/30 mb-2"></i>
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
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                                                                    <span className="label-text font-medium">Supplier</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={material.supplier || ""}
                                                                    onChange={(e) => handleMaterialChange(index, "supplier", e.target.value)}
                                                                    placeholder="Supplier name or company"
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
                                                <i className="fas fa-truck text-primary"></i>
                                                Equipment Used
                                            </h3>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm gap-2"
                                                onClick={addEquipment}
                                                disabled={loading}
                                            >
                                                <i className="fas fa-plus"></i>
                                                Add Equipment
                                            </button>
                                        </div>

                                        {equipment.length === 0 ? (
                                            <div className="text-center py-8">
                                                <i className="fas fa-truck text-4xl text-base-content/30 mb-2"></i>
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
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Equipment</span>
                                                                </label>
                                                                <select className="select select-bordered select-secondary w-full"
                                                                    value={equip.id || ""}
                                                                    onChange={(e) => handleEquipmentChange(index, "id", e.target.value)}
                                                                    disabled={loading}
                                                                >
                                                                    <option value="">Select Equipment</option>
                                                                    {equipments.map((eq) => (
                                                                        <option key={eq.id} value={eq.id}>
                                                                            {eq.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Equipment Name*</span>
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
                                                                    <span className="label-text font-medium">Crew Member</span>
                                                                </label>
                                                                <select className="select select-bordered select-secondary w-full"
                                                                    value={equip.crewMemberId || ""}
                                                                    onChange={(e) => handleEquipmentChange(index, "crew_member", e.target.value)}
                                                                    disabled={loading}
                                                                >
                                                                    <option value="">Select Crew Member</option>
                                                                    {crewMembers.map((member) => (
                                                                        <option key={member.id} value={member.id}>
                                                                            {member.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Operator</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary w-full"
                                                                    value={equip.operator || ""}
                                                                    onChange={(e) => handleEquipmentChange(index, "operator", e.target.value)}
                                                                    placeholder="Operator name"
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
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Condition</span>
                                                                </label>
                                                                {equipmentConditionOptions.select(
                                                                    equip.condition as EquipmentCondition,
                                                                    (value) => handleEquipmentChange(index, "condition", value),
                                                                    "select-secondary w-full"

                                                                )}
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
                                            <i className="fas fa-sticky-note text-primary"></i>
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
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={loading || !formData.project_id || !formData.work_completed.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus"></i>
                                    Create Daily Log
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { useState, useEffect } from "react";
import { updateDailyLog, getDailyLogWithDetailsById } from "@/app/actions/daily-logs";
import { createDailyLogMaterial, updateDailyLogMaterial } from "@/app/actions/daily-log-materials";
import { createDailyLogEquipment, updateDailyLogEquipment } from "@/app/actions/daily-log-equipment";
import { format } from "date-fns";
import { DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";
import { toast } from "@/hooks/use-toast";

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
    const [formData, setFormData] = useState({
        date: "",
        project_id: "",
        crew_id: "",
        hours_worked: 0,
        work_completed: "",
        safety: "",
        quality: "",
        delays: "",
        notes: "",
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

    // Initialize form data from log
    useEffect(() => {
        if (log) {
            setFormData({
                date: format(new Date(log.date), "yyyy-MM-dd"),
                project_id: log.project_id || "",
                crew_id: log.crew_id || "",
                hours_worked: log.hours_worked || 0,
                work_completed: log.work_completed || "",
                safety: log.safety || "",
                quality: log.quality || "",
                delays: log.delays || "",
                notes: log.notes || "",
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
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === "" ? 0 : Number(value);
        setFormData(prev => ({
            ...prev,
            [name]: numValue
        }));
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
    };

    // Remove equipment
    const removeEquipment = (index: number) => {
        setEquipment(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Update the main daily log first
            const dailyLogUpdateData = {
                id: log.id,
                author_id: log.author_id,
                business_id: log.business_id,
                project_id: formData.project_id,
                crew_id: formData.crew_id || "",
                date: formData.date,
                start_time: log.start_time ?? "",
                end_time: log.end_time ?? "",
                work_planned: log.work_planned ?? "",
                work_completed: formData.work_completed,
                hours_worked: formData.hours_worked,
                safety: formData.safety,
                quality: formData.quality,
                delays: formData.delays,
                notes: formData.notes,
                weather: log.weather ?? "",
                updated_by: log.updated_by ?? null,
                overtime: log.overtime ?? 0,
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

                    return await createDailyLogMaterial(newMaterial);
                } else {
                    const materialUpdateData = {
                        name: material.name,
                        quantity: material.quantity,
                        cost: material.cost,
                    } as DailyLogMaterialUpdate;

                    return await updateDailyLogMaterial(material.id, materialUpdateData);
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

                    return await createDailyLogEquipment(newEquipment);
                } else {
                    const equipmentUpdateData = {
                        name: equip.name,
                        hours: equip.hours,
                    } as DailyLogEquipmentUpdate;

                    return await updateDailyLogEquipment(equip.id, equipmentUpdateData);
                }
            });

            // Wait for all updates to complete
            await Promise.all([...materialPromises, ...equipmentPromises]);

            // Get the updated log with all details
            const refreshedLog = await getDailyLogWithDetailsById(log.id);

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
                            <i className="fas fa-times"></i>
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
                                                    className="input input-bordered input-secondary"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    required
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
                                                    className="input input-bordered input-secondary"
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
                                                    <span className="label-text font-medium">Project *</span>
                                                </label>
                                                <select
                                                    name="project_id"
                                                    className="select select-bordered select-secondary"
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
                                                    className="select select-bordered select-secondary"
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
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Work Completed *</span>
                                            </label>
                                            <textarea
                                                name="work_completed"
                                                className="textarea textarea-bordered textarea-secondary"
                                                value={formData.work_completed}
                                                onChange={handleInputChange}
                                                placeholder="Describe the work completed today..."
                                                rows={4}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Safety Concerns</span>
                                                </label>
                                                <textarea
                                                    name="safety"
                                                    className="textarea textarea-bordered textarea-secondary"
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
                                                    className="textarea textarea-bordered textarea-secondary"
                                                    value={formData.quality}
                                                    onChange={handleInputChange}
                                                    placeholder="Quality assessment notes..."
                                                    rows={3}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-control mt-4">
                                            <label className="label">
                                                <span className="label-text font-medium">Delays</span>
                                            </label>
                                            <textarea
                                                name="delays"
                                                className="textarea textarea-bordered textarea-secondary"
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
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-medium">Material Name *</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary"
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
                                                                    className="input input-bordered input-secondary"
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
                                                                    className="input input-bordered input-secondary"
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
                                                                    className="input input-bordered input-secondary"
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
                                                                    <span className="label-text font-medium">Equipment Name *</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-secondary"
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
                                                                    className="input input-bordered input-secondary"
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
                                            <i className="fas fa-sticky-note text-primary"></i>
                                            Additional Notes
                                        </h3>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Notes</span>
                                            </label>
                                            <textarea
                                                name="notes"
                                                className="textarea textarea-bordered textarea-secondary"
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
                                    <i className="fas fa-save"></i>
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
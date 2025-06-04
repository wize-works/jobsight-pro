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
        cost_per_unit: number | null;
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
                // Extract the numeric part
                const numValue = extractNumber(value);
                const unitPart = extractUnit(value) || updatedMaterials[index].quantityUnit;

                // Combine them back or use just the number if no unit
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
            } else if (field === "cost_per_unit") {
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
                cost_per_unit: 0,
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
    }; const handleSubmit = async (e: React.FormEvent) => {
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
                // Add any other required fields with defaults or from log as needed
            };

            // Update the main daily log
            const updatedLog = await updateDailyLog(log.id, dailyLogUpdateData);

            if (!updatedLog) {
                throw new Error("Failed to update daily log");
            }

            // Handle materials updates
            const materialPromises = materials.map(async (material) => {
                // New materials need to be created
                if (material.isNew) {
                    const newMaterial = {
                        id: material.id.startsWith('temp-') ? crypto.randomUUID() : material.id,
                        daily_log_id: log.id,
                        business_id: updatedLog.business_id,
                        name: material.name || "",
                        quantity: material.quantity,
                        cost: material.cost_per_unit,
                    } as DailyLogMaterialInsert;

                    return await createDailyLogMaterial(newMaterial);
                }
                // Existing materials need to be updated
                else {
                    const materialUpdateData = {
                        name: material.name,
                        quantity: material.quantity,
                        cost: material.cost_per_unit,
                    } as DailyLogMaterialUpdate;

                    return await updateDailyLogMaterial(material.id, materialUpdateData);
                }
            });

            // Handle equipment updates
            const equipmentPromises = equipment.map(async (equip) => {
                // New equipment entries need to be created
                if (equip.isNew) {
                    const newEquipment = {
                        id: equip.id.startsWith('temp-') ? crypto.randomUUID() : equip.id,
                        daily_log_id: log.id,
                        business_id: updatedLog.business_id,
                        equipment_id: "", // This would need to be the actual equipment ID if available
                        name: equip.name || "",
                        hours: equip.hours,
                    } as DailyLogEquipmentInsert;

                    return await createDailyLogEquipment(newEquipment);
                }
                // Existing equipment entries need to be updated
                else {
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

            // Update the UI with the refreshed data
            onSave(refreshedLog);
            onClose();
        } catch (err) {
            console.error("Error updating daily log:", err);
            setError(err instanceof Error ? err.message : "An error occurred while saving the daily log");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-full max-w-4xl max-h-[90vh] p-0">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-base-300">
                    <h2 className="text-xl font-bold text-base-content">
                        <i className="far fa-edit mr-2 text-primary"></i>
                        Edit Daily Log
                    </h2>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <i className="far fa-times"></i>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Tabs */}
                        <div className="tabs tabs-lifted mb-6">
                            <button
                                type="button"
                                className={`tab tab-lg ${activeTab === "general" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("general")}
                            >
                                <i className="far fa-clipboard-list fa-fw mr-2"></i>
                                General
                            </button>
                            <button
                                type="button"
                                className={`tab tab-lg ${activeTab === "materials" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("materials")}
                            >
                                <i className="far fa-boxes fa-fw mr-2"></i>
                                Materials
                            </button>
                            <button
                                type="button"
                                className={`tab tab-lg ${activeTab === "equipment" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("equipment")}
                            >
                                <i className="far fa-truck-container fa-fw mr-2"></i>
                                Equipment
                            </button>
                            <button
                                type="button"
                                className={`tab tab-lg ${activeTab === "notes" ? "tab-active" : ""}`}
                                onClick={() => setActiveTab("notes")}
                            >
                                <i className="far fa-sticky-note fa-fw mr-2"></i>
                                Notes
                            </button>
                        </div>

                        {/* General Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="input input-bordered w-full"
                                            required
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">Hours Worked</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="hours_worked"
                                            value={formData.hours_worked}
                                            onChange={handleNumberInputChange}
                                            className="input input-bordered w-full"
                                            min="0"
                                            step="0.5"
                                            placeholder="8.0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">Project</span>
                                        </label>
                                        <select
                                            name="project_id"
                                            value={formData.project_id}
                                            onChange={handleInputChange}
                                            className="select select-bordered w-full"
                                            required
                                        >
                                            <option value="" disabled>Select a project</option>
                                            {projects.map(project => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">Crew</span>
                                        </label>
                                        <select
                                            name="crew_id"
                                            value={formData.crew_id}
                                            onChange={handleInputChange}
                                            className="select select-bordered w-full"
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

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">Work Completed</span>
                                    </label>
                                    <textarea
                                        name="work_completed"
                                        value={formData.work_completed}
                                        onChange={handleInputChange}
                                        className="textarea textarea-bordered h-32 w-full"
                                        placeholder="Describe the work completed today..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">Safety Concerns</span>
                                        </label>
                                        <textarea
                                            name="safety"
                                            value={formData.safety}
                                            onChange={handleInputChange}
                                            className="textarea textarea-bordered h-32 w-full"
                                            placeholder="Any safety concerns or incidents..."
                                        ></textarea>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">Quality Assessment</span>
                                        </label>
                                        <textarea
                                            name="quality"
                                            value={formData.quality}
                                            onChange={handleInputChange}
                                            className="textarea textarea-bordered h-32 w-full"
                                            placeholder="Quality assessment notes..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">Delays</span>
                                    </label>
                                    <textarea
                                        name="delays"
                                        value={formData.delays}
                                        onChange={handleInputChange}
                                        className="textarea textarea-bordered h-32 w-full"
                                        placeholder="Any delays or setbacks..."
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* Materials Tab */}
                        {activeTab === "materials" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-base-content">Materials Used</h3>
                                        <p className="text-sm text-base-content/70">Track materials consumed during this work day</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm gap-2"
                                        onClick={addMaterial}
                                    >
                                        <i className="far fa-plus"></i>
                                        Add Material
                                    </button>
                                </div>

                                {materials.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="far fa-info-circle"></i>
                                        <span>No materials added yet. Click "Add Material" to track materials used in this log.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {materials.map((material, index) => (
                                            <div key={material.id} className="card bg-base-100 border border-base-300 shadow-sm">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                            <h4 className="font-semibold text-base-content">Material #{index + 1}</h4>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-square btn-ghost text-error hover:bg-error hover:text-error-content"
                                                            onClick={() => removeMaterial(index)}
                                                        >
                                                            <i className="far fa-trash-alt"></i>
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label">
                                                                <span className="label-text font-medium">Material Name</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.name || ""}
                                                                onChange={(e) => handleMaterialChange(index, "name", e.target.value)}
                                                                className="input input-bordered w-full"
                                                                placeholder="e.g., Concrete, Lumber, Rebar..."
                                                                required
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label">
                                                                <span className="label-text font-medium">Cost Per Unit ($)</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={material.cost_per_unit || ""}
                                                                onChange={(e) => handleMaterialChange(index, "cost_per_unit", e.target.value)}
                                                                className="input input-bordered w-full"
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label">
                                                                <span className="label-text font-medium">Quantity</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={material.quantityValue}
                                                                onChange={(e) => handleMaterialChange(index, "quantityValue", e.target.value)}
                                                                className="input input-bordered w-full"
                                                                placeholder="0"
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label">
                                                                <span className="label-text font-medium">Unit</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.quantityUnit || ""}
                                                                onChange={(e) => handleMaterialChange(index, "quantityUnit", e.target.value)}
                                                                className="input input-bordered w-full"
                                                                placeholder="e.g., pieces, yards, tons"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="divider my-2"></div>
                                                    <div className="bg-base-200 p-3 rounded-lg">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-semibold text-base-content">Total Cost:</span>
                                                            <span className="text-lg font-bold text-primary">
                                                                ${((material.quantityValue || 0) * (material.cost_per_unit || 0)).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Equipment Tab */}
                        {activeTab === "equipment" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-base-content">Equipment Used</h3>
                                        <p className="text-sm text-base-content/70">Track equipment usage and hours worked</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm gap-2"
                                        onClick={addEquipment}
                                    >
                                        <i className="far fa-plus"></i>
                                        Add Equipment
                                    </button>
                                </div>

                                {equipment.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="far fa-info-circle"></i>
                                        <span>No equipment added yet. Click "Add Equipment" to track equipment used in this log.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {equipment.map((equip, index) => (
                                            <div key={equip.id} className="card bg-base-100 border border-base-300 shadow-sm">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                                            <h4 className="font-semibold text-base-content">Equipment #{index + 1}</h4>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-square btn-ghost text-error hover:bg-error hover:text-error-content"
                                                            onClick={() => removeEquipment(index)}
                                                        >
                                                            <i className="far fa-trash-alt"></i>
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label">
                                                                <span className="label-text font-medium">Equipment Name</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={equip.name || ""}
                                                                onChange={(e) => handleEquipmentChange(index, "name", e.target.value)}
                                                                className="input input-bordered w-full"
                                                                placeholder="e.g., Excavator, Bulldozer, Crane..."
                                                                required
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label">
                                                                <span className="label-text font-medium">Hours Used</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={equip.hours || ""}
                                                                onChange={(e) => handleEquipmentChange(index, "hours", e.target.value)}
                                                                className="input input-bordered w-full"
                                                                placeholder="0.0"
                                                                min="0"
                                                                step="0.5"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes Tab */}
                        {activeTab === "notes" && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-base-content mb-2">Additional Notes</h3>
                                    <p className="text-sm text-base-content/70">Add any additional observations, comments, or important details</p>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        className="textarea textarea-bordered h-64 w-full"
                                        placeholder="Any additional notes, observations, or important details about today's work..."
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-error mt-6">
                                <i className="far fa-exclamation-triangle"></i>
                                <span>{error}</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="modal-action p-6 border-t border-base-300">
                    <button
                        className="btn btn-outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <i className="far fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="far fa-save mr-2"></i>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { ClientInteraction, ClientInteractionType, clientInteractionTypeOptions } from "@/types/client-interactions";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface InteractionModalProps {
    clientId: string;
    interaction: Partial<ClientInteraction>;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

export default function InteractionModal({
    clientId,
    interaction,
    isOpen,
    onClose,
    onSubmit
}: InteractionModalProps) {
    const [form, setForm] = useState({
        date: interaction?.date || new Date().toISOString().split('T')[0],
        type: interaction?.type || "" as ClientInteractionType,
        summary: interaction?.summary || "",
        staff: interaction?.staff || "",
        follow_up_date: interaction?.follow_up_date || "",
        follow_up_task: interaction?.follow_up_task || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await onSubmit(form);
            toast.success({
                title: "Success",
                description: interaction?.id ? "Interaction updated successfully" : "Interaction added successfully"
            });
            onClose();
        } catch (err: any) {
            const errorMessage = err.message || "Failed to save interaction";
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
            <div className="modal-box max-w-4xl max-h-[90vh] p-0">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {interaction?.id ? 'Edit Interaction' : 'Add New Interaction'}
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
                        {/* Interaction Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-primary"></i>
                                    Interaction Details
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
                                            value={form.date}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Type *</span>
                                        </label>
                                        <select
                                            name="type"
                                            className="select select-bordered select-secondary"
                                            value={form.type}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Select interaction type</option>
                                            {Object.entries(clientInteractionTypeOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control md:col-span-2">
                                        <label className="label">
                                            <span className="label-text font-medium">Staff Member</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="staff"
                                            className="input input-bordered input-secondary"
                                            value={form.staff}
                                            onChange={handleChange}
                                            placeholder="Enter staff member name"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Summary *</span>
                                    </label>
                                    <textarea
                                        name="summary"
                                        className="textarea textarea-bordered textarea-secondary"
                                        value={form.summary}
                                        onChange={handleChange}
                                        placeholder="Describe the interaction details..."
                                        rows={4}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Follow-up Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-calendar-check text-primary"></i>
                                    Follow-up Information
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Follow-up Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="follow_up_date"
                                            className="input input-bordered input-secondary"
                                            value={form.follow_up_date}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Follow-up Task</span>
                                        </label>
                                        <textarea
                                            name="follow_up_task"
                                            className="textarea textarea-bordered textarea-secondary"
                                            value={form.follow_up_task}
                                            onChange={handleChange}
                                            placeholder="Describe any follow-up tasks or actions required..."
                                            rows={3}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
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
                            disabled={loading || !form.date || !form.type || !form.summary}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {interaction?.id ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <i className={interaction?.id ? "fas fa-save" : "fas fa-plus"}></i>
                                    {interaction?.id ? 'Update Interaction' : 'Add Interaction'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
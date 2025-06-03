import { ClientInteraction, ClientInteractionType, clientInteractionTypeOptions } from "@/types/client-interactions";
import { useState } from "react";

export default function InteractionModal({ clientId, interaction, onClose, onSubmit }: { clientId: string; interaction: Partial<ClientInteraction>; onClose: () => void; onSubmit: (formData: any) => void }) {
    const [form, setForm] = useState({
        date: interaction.date || "",
        type: interaction.type || "",
        summary: interaction.summary || "",
        staff: interaction.staff || "",
        follow_up_date: interaction.follow_up_date || "",
        follow_up_task: interaction.follow_up_task || "",
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
        } catch (err: any) {
            setError(err.message || "Failed to update interaction");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold mb-4">Interaction Details</h2>
                        {error && <div className="text-error">{error}</div>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Date</label>
                            <input
                                type="date"
                                name="date"
                                className="input input-bordered w-full"
                                value={form.date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">Type</label>
                            {clientInteractionTypeOptions.select(
                                form.type as ClientInteractionType,
                                (value) => setForm((prev) => ({ ...prev, type: value })),
                            )}
                        </div>
                        <div className="form-control col-span-2">
                            <label className="label">Summary</label>
                            <textarea
                                name="summary"
                                className="textarea textarea-bordered w-full"
                                value={form.summary}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">Staff</label>
                            <input
                                name="staff"
                                className="input input-bordered w-full"
                                value={form.staff}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">Follow-up Date</label>
                            <input
                                type="date"
                                name="follow_up_date"
                                className="input input-bordered w-full"
                                value={form.follow_up_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-control col-span-2">
                            <label className="label">Follow-up Task</label>
                            <textarea
                                name="follow_up_task"
                                className="textarea textarea-bordered w-full"
                                value={form.follow_up_task}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className={`btn btn-primary mt-4 ${loading ? "loading" : ""}`}>
                            {interaction.id ? "Update Interaction" : "Add Interaction"}
                        </button>
                        <button type="button" className="btn btn-outline mt-4 ml-2" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
"use client";

import { useState } from "react";
import { Crew } from "@/types/crews";
import { CrewMember } from "@/types/crew-members";
import { useRouter } from "next/navigation";

export default function CrewEditForm({
    crew,
    members = [],
    onSubmit
}: {
    crew: Crew;
    members: CrewMember[];
    onSubmit: (formData: any) => void
}) {
    const router = useRouter();
    const [form, setForm] = useState({
        name: crew.name || "",
        status: crew.status || "active",
        leader_id: crew.leader_id || "",
        specialty: crew.specialty || "",
        notes: crew.notes || ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [certInput, setCertInput] = useState("");

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
            router.push(`/dashboard/crews/${crew.id}`);
        } catch (err: any) {
            setError(err.message || "Failed to update crew");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-4 col-span-2">
                <div className="card bg-base-100 shadow-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold mb-4">Crew Information</h2>
                        {error && <div className="text-error">{error}</div>}
                        <div className="flex gap-2 justify-end">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="form-control">
                                <label className="label">Crew Name</label>
                                <input
                                    name="name"
                                    className="input input-bordered w-full"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">Specialty</label>
                                <input
                                    name="specialty"
                                    className="input input-bordered w-full"
                                    value={form.specialty}
                                    onChange={handleChange}
                                    placeholder="e.g. Framing, Electrical, Plumbing"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="form-control">
                                <label className="label">Status</label>
                                <select
                                    name="status"
                                    className="select select-bordered w-full"
                                    value={form.status}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>                            <div className="form-control">
                                <label className="label">Leader ID</label>
                                <select name="leader_id" className="select select-bordered w-full" value={form.leader_id} onChange={handleChange} required>
                                    <option value="">Select Crew Leader</option>
                                    {members.map((member: CrewMember) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} ({member.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Notes</h2>
                    <div className="form-control">
                        <textarea
                            name="notes"
                            className="textarea textarea-bordered w-full h-32"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Enter any additional notes about the crew"
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="flex flex-col space-y-4">
            </div>
        </form>
    );
}

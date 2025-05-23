"use client";

import { useState } from "react";

export default function ClientEditForm({ client, onSubmit }: { client: any; onSubmit: (formData: any) => void }) {
    const [form, setForm] = useState({
        name: client.name || "",
        type: client.type || "",
        industry: client.industry || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        website: client.website || "",
        status: client.status || "active",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await onSubmit(form);
        } catch (err: any) {
            setError(err.message || "Failed to update client");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label">Name</label>
                <input
                    name="name"
                    className="input input-bordered w-full"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label className="label">Type</label>
                <input
                    name="type"
                    className="input input-bordered w-full"
                    value={form.type}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="label">Industry</label>
                <input
                    name="industry"
                    className="input input-bordered w-full"
                    value={form.industry}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="label">Email</label>
                <input
                    name="email"
                    type="email"
                    className="input input-bordered w-full"
                    value={form.email}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="label">Phone</label>
                <input
                    name="phone"
                    className="input input-bordered w-full"
                    value={form.phone}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="label">Address</label>
                <input
                    name="address"
                    className="input input-bordered w-full"
                    value={form.address}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="label">Website</label>
                <input
                    name="website"
                    className="input input-bordered w-full"
                    value={form.website}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="label">Status</label>
                <select
                    name="status"
                    className="select select-bordered w-full"
                    value={form.status}
                    onChange={handleChange}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                </select>
            </div>
            {error && <div className="text-error">{error}</div>}
            <div className="flex gap-2 justify-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}

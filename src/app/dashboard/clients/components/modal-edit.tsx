"use client";

import { Client, clientStatusOptions } from "@/types/clients";
import { useState } from "react";

export default function ClientEditForm({ client, onSubmit }: { client: Client; onSubmit: (formData: any) => void }) {
    const [form, setForm] = useState({
        name: client.name || "",
        type: client.type || "",
        industry: client.industry || "",
        contact: client.contact_name || "",
        email: client.contact_email || "",
        phone: client.contact_phone || "",
        website: client.website || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        zip: client.zip || "",
        country: client.country || "USA",
        taxId: client.tax_id || "",
        notes: client.notes || "",
        logoUrl: client.logo_url || "",
        status: client.status || "active",
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
            setError(err.message || "Failed to update client");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold mb-4">Client Information</h2>
                {error && <div className="text-error">{error}</div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label">Business Name</label>
                    <input
                        name="name"
                        className="input input-bordered w-full"
                        value={form.name}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-control">
                    <label className="label">Tax ID</label>
                    <input
                        name="taxId"
                        className="input input-bordered w-full"
                        value={form.taxId}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-control">
                    <label className="label">Type</label>
                    <select name="type" className="select select-bordered w-full" value={form.type} onChange={handleChange}>
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                        <option value="government">Government</option>
                        <option value="nonprofit">Nonprofit</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label">Industry</label>
                    <select name="industry" className="select select-bordered w-full" value={form.industry} onChange={handleChange}>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                    </select>
                </div>
                <div className="form-control">
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
                <div className="form-control">
                    <label className="label">Contact</label>
                    <input
                        name="contact"
                        className="input input-bordered w-full"
                        value={form.contact}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-control">
                    <label className="label">Email</label>
                    <input
                        name="email"
                        type="email"
                        className="input input-bordered w-full"
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-control">
                    <label className="label">Phone</label>
                    <input
                        name="phone"
                        className="input input-bordered w-full"
                        value={form.phone}
                        onChange={handleChange}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 col-span-2">
                    <div className="form-control col-span-6">
                        <label className="label">Address</label>
                        <input
                            name="address"
                            className="input input-bordered w-full"
                            value={form.address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-control col-span-3">
                        <label className="label">City</label>
                        <input
                            name="city"
                            className="input input-bordered w-full"
                            value={form.city}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-control col-span-1">
                        <label className="label">State</label>
                        <input
                            name="state"
                            className="input input-bordered w-full"
                            value={form.state}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-control col-span-2">
                        <label className="label">Zip</label>
                        <input
                            name="zip"
                            className="input input-bordered w-full"
                            value={form.zip}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                    <div className="form-control">
                        <label className="label">Website</label>
                        <input
                            name="website"
                            className="input input-bordered w-full"
                            value={form.website}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">Logo Url</label>
                        <input
                            name="logoUrl"
                            className="input input-bordered w-full"
                            value={form.logoUrl}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-control col-span-2">
                    <label className="label">Notes</label>
                    <textarea
                        name="notes"
                        className="textarea textarea-bordered w-full"
                        value={form.notes}
                        onChange={handleChange}
                    ></textarea>
                </div>
                <div className="flex gap-2 justify-end col-span-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => console.log("Cancel")}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}

"use client";

import { Client, clientStatusOptions } from "@/types/clients";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ClientEditModalProps {
    client: Client;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

export default function ClientEditModal({ client, isOpen, onClose, onSubmit }: ClientEditModalProps) {
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
            toast.success({
                title: "Success",
                description: "Client updated successfully"
            });
            onClose();
        } catch (err: any) {
            const errorMessage = err.message || "Failed to update client";
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
                            Edit Client
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
                                            <span className="label-text font-medium">Business Name *</span>
                                        </label>
                                        <input
                                            name="name"
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter business name"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Tax ID</span>
                                        </label>
                                        <input
                                            name="taxId"
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={form.taxId}
                                            onChange={handleChange}
                                            placeholder="Enter tax ID"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Type</span>
                                        </label>
                                        <select
                                            name="type"
                                            className="select select-bordered select-secondary"
                                            value={form.type}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            <option value="">Select type</option>
                                            <option value="individual">Individual</option>
                                            <option value="business">Business</option>
                                            <option value="government">Government</option>
                                            <option value="nonprofit">Nonprofit</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Industry</span>
                                        </label>
                                        <select
                                            name="industry"
                                            className="select select-bordered select-secondary"
                                            value={form.industry}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            <option value="">Select industry</option>
                                            <option value="technology">Technology</option>
                                            <option value="finance">Finance</option>
                                            <option value="healthcare">Healthcare</option>
                                            <option value="education">Education</option>
                                            <option value="retail">Retail</option>
                                            <option value="manufacturing">Manufacturing</option>
                                            <option value="construction">Construction</option>
                                            <option value="real-estate">Real Estate</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status</span>
                                        </label>
                                        <select
                                            name="status"
                                            className="select select-bordered select-secondary"
                                            value={form.status}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(clientStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Country</span>
                                        </label>
                                        <select
                                            name="country"
                                            className="select select-bordered select-secondary"
                                            value={form.country}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            <option value="USA">United States</option>
                                            <option value="CAN">Canada</option>
                                            <option value="MEX">Mexico</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-user text-primary"></i>
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Contact Person</span>
                                        </label>
                                        <input
                                            name="contact"
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={form.contact}
                                            onChange={handleChange}
                                            placeholder="Primary contact name"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Email</span>
                                        </label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="input input-bordered input-secondary"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="contact@example.com"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Phone</span>
                                        </label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            className="input input-bordered input-secondary"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="(555) 123-4567"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Website</span>
                                        </label>
                                        <input
                                            name="website"
                                            type="url"
                                            className="input input-bordered input-secondary"
                                            value={form.website}
                                            onChange={handleChange}
                                            placeholder="https://example.com"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-map-marker-alt text-primary"></i>
                                    Address Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Street Address</span>
                                        </label>
                                        <input
                                            name="address"
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="123 Main Street"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div className="form-control md:col-span-3">
                                            <label className="label">
                                                <span className="label-text font-medium">City</span>
                                            </label>
                                            <input
                                                name="city"
                                                type="text"
                                                className="input input-bordered input-secondary"
                                                value={form.city}
                                                onChange={handleChange}
                                                placeholder="City"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-control md:col-span-1">
                                            <label className="label">
                                                <span className="label-text font-medium">State</span>
                                            </label>
                                            <input
                                                name="state"
                                                type="text"
                                                className="input input-bordered input-secondary"
                                                value={form.state}
                                                onChange={handleChange}
                                                placeholder="State"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-control md:col-span-2">
                                            <label className="label">
                                                <span className="label-text font-medium">ZIP Code</span>
                                            </label>
                                            <input
                                                name="zip"
                                                type="text"
                                                className="input input-bordered input-secondary"
                                                value={form.zip}
                                                onChange={handleChange}
                                                placeholder="12345"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-sticky-note text-primary"></i>
                                    Additional Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Logo URL</span>
                                        </label>
                                        <input
                                            name="logoUrl"
                                            type="url"
                                            className="input input-bordered input-secondary"
                                            value={form.logoUrl}
                                            onChange={handleChange}
                                            placeholder="https://example.com/logo.png"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Notes</span>
                                        </label>
                                        <textarea
                                            name="notes"
                                            className="textarea textarea-bordered textarea-secondary"
                                            value={form.notes}
                                            onChange={handleChange}
                                            placeholder="Additional notes about this client..."
                                            rows={4}
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
                            disabled={loading || !form.name}
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
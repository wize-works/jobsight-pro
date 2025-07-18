"use client";

import { Client, ClientIndustry, clientIndustryOptions, ClientStatus, clientStatusOptions, ClientType, clientTypeOptions } from "@/types/clients";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import { useClientLogo } from "@/hooks/useMedia";

interface ClientModalProps {
    client?: Client | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<void>;
    loading?: boolean;
}

export default function ClientModal({ client, isOpen, onClose, onSubmit, loading = false }: ClientModalProps) {
    const isEditing = !!client;
    const { businessId } = useBusiness();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadClientLogo } = useClientLogo(client?.id || "");

    const [form, setForm] = useState({
        name: client?.name || "",
        type: client?.type || "Commercial",
        industry: client?.industry || "",
        contact_name: client?.contact_name || "",
        contact_email: client?.contact_email || "",
        contact_phone: client?.contact_phone || "",
        website: client?.website || "",
        address: client?.address || "",
        city: client?.city || "",
        state: client?.state || "",
        zip: client?.zip || "",
        country: client?.country || "USA",
        tax_id: client?.tax_id || "",
        notes: client?.notes || "",
        logo_url: client?.logo_url || "",
        status: client?.status || "prospect",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [uploadingLogo, setUploadingLogo] = useState(false);    // Reset form when client changes or modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setForm({
                name: client?.name || "",
                type: client?.type || "Commercial",
                industry: client?.industry || "",
                contact_name: client?.contact_name || "",
                contact_email: client?.contact_email || "",
                contact_phone: client?.contact_phone || "",
                website: client?.website || "",
                address: client?.address || "",
                city: client?.city || "",
                state: client?.state || "",
                zip: client?.zip || "",
                country: client?.country || "USA",
                tax_id: client?.tax_id || "",
                notes: client?.notes || "",
                logo_url: client?.logo_url || "",
                status: client?.status || "prospect",
            });
            setError("");
            setLogoFile(null);
            setLogoPreview("");
        }
    }, [client, isOpen]); const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setLogoFile(file);
        setUploadingLogo(true);

        try {
            if (isEditing && client?.id) {
                // For existing clients, upload immediately
                const result = await uploadClientLogo(file);
                if (result.success && result.media) {
                    setForm(prev => ({ ...prev, logo_url: result.media!.url }));
                    toast.success("Logo uploaded successfully");
                } else {
                    throw new Error("Upload failed");
                }
            } else {
                // For new clients, just show preview 
                const reader = new FileReader();
                reader.onload = (e) => {
                    setForm(prev => ({ ...prev, logo_url: e.target?.result as string }));
                };
                reader.readAsDataURL(file);
                toast.success("Logo selected - will be saved with client");
            }
        } catch (error) {
            console.error("Error processing logo:", error);
            toast.error("Failed to process logo");
        } finally {
            setUploadingLogo(false);
        }
    }; const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await onSubmit(form);
            toast.success("Client " + (isEditing ? "updated" : "created") + " successfully");
            onClose();
        } catch (err: any) {
            const errorMessage = err.message || `Failed to ${isEditing ? "update" : "create"} client`;
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isLoading = loading || isSubmitting;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl p-0">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg">
                            {isEditing ? "Edit Client" : "Add New Client"}
                        </h2>
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-info-circle text-primary"></i>
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Business Name *</span>
                                        </label>
                                        <input
                                            name="name"
                                            type="text"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter business name"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Tax ID</span>
                                        </label>
                                        <input
                                            name="tax_id"
                                            type="text"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.tax_id}
                                            onChange={handleChange}
                                            placeholder="Enter tax ID"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Type</span>
                                        </label>
                                        {clientTypeOptions.select(
                                            form.type as ClientType,
                                            (value: string) => handleChange({ target: { name: "type", value } } as React.ChangeEvent<HTMLInputElement>),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Industry</span>
                                        </label>
                                        {clientIndustryOptions.select(
                                            form.industry as ClientIndustry,
                                            (value: ClientIndustry) => handleChange({ target: { name: "industry", value } } as React.ChangeEvent<HTMLInputElement>),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status</span>
                                        </label>
                                        {clientStatusOptions.select(
                                            form.status as ClientStatus,
                                            (value: string) => handleChange({ target: { name: "status", value } } as React.ChangeEvent<HTMLInputElement>),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Country</span>
                                        </label>
                                        <select
                                            name="country"
                                            className="select select-bordered select-secondary w-full"
                                            value={form.country}
                                            onChange={handleChange}
                                            disabled={isLoading}
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
                            <div className="card-body">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-user text-primary"></i>
                                    Contact Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Contact Person</span>
                                        </label>
                                        <input
                                            name="contact_name"
                                            type="text"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.contact_name}
                                            onChange={handleChange}
                                            placeholder="Primary contact name"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Email</span>
                                        </label>
                                        <input
                                            name="contact_email"
                                            type="email"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.contact_email}
                                            onChange={handleChange}
                                            placeholder="contact@example.com"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Phone</span>
                                        </label>
                                        <input
                                            name="contact_phone"
                                            type="tel"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.contact_phone}
                                            onChange={handleChange}
                                            placeholder="(555) 123-4567"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Website</span>
                                        </label>
                                        <input
                                            name="website"
                                            type="url"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.website}
                                            onChange={handleChange}
                                            placeholder="https://example.com"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-map-marker-alt text-primary"></i>
                                    Address Information
                                </h4>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Street Address</span>
                                        </label>
                                        <input
                                            name="address"
                                            type="text"
                                            className="input input-bordered input-secondary w-full"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="123 Main Street"
                                            disabled={isLoading}
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
                                                className="input input-bordered input-secondary w-full"
                                                value={form.city}
                                                onChange={handleChange}
                                                placeholder="City"
                                                disabled={isLoading}
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
                                                disabled={isLoading}
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
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-sticky-note text-primary"></i>
                                    Additional Information
                                </h4>                                <div className="space-y-4">
                                    {/* Logo URL with Upload Button */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Company Logo</span>
                                        </label>
                                        <div className="join w-full">
                                            <input
                                                name="logo_url"
                                                type="url"
                                                className="input input-bordered input-secondary join-item flex-1"
                                                value={form.logo_url}
                                                onChange={handleChange}
                                                placeholder="Enter logo URL or upload a file"
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                className="btn join-item btn-secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading || uploadingLogo}
                                                title="Upload logo file"
                                            >
                                                {uploadingLogo ? (
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                ) : (
                                                    <i className="far fa-file-arrow-up fa-xl"></i>
                                                )}Upload
                                            </button>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                            disabled={isLoading}
                                        />
                                        {form.logo_url && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <img
                                                    src={form.logo_url}
                                                    alt="Logo preview"
                                                    className="w-8 h-8 object-cover rounded border"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <span className="text-sm text-base-content/60">Logo preview</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Notes</span>
                                        </label>
                                        <textarea
                                            name="notes"
                                            className="textarea textarea-bordered textarea-secondary w-full"
                                            value={form.notes}
                                            onChange={handleChange}
                                            placeholder="Additional notes about this client..."
                                            rows={4}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
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
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={isLoading || !form.name}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isEditing ? "Saving..." : "Creating..."}
                                </>
                            ) : (
                                <>
                                    <i className={`far ${isEditing ? "fa-save" : "fa-plus"}`}></i>
                                    {isEditing ? "Save Changes" : "Create Client"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { ClientContact } from "@/types/client-contacts";

interface ContactData {
    id?: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    is_primary: boolean;
}

interface ModalContactProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: ContactData) => Promise<{ success: boolean }>;
    initialData?: ContactData; // For edit mode
    clientName?: string;
}

const ModalContact: React.FC<ModalContactProps> = ({
    title,
    loading,
    onClose,
    onSubmit,
    initialData,
    clientName
}) => {
    const [formData, setFormData] = useState<ContactData>({
        name: "",
        title: "",
        email: "",
        phone: "",
        is_primary: false,
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Populate form data when editing
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof ContactData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await onSubmit(formData);
        if (result.success) {
            onClose();
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl w-full">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg -m-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">{title}</h3>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                    {clientName && (
                        <p className="text-primary-content/80 mt-2">
                            for {clientName}
                        </p>
                    )}
                </div>

                {/* Body */}
                <div className="space-y-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Section */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-6">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-user text-primary"></i>
                                    Basic Information
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`input input-bordered input-secondary ${errors.name ? 'input-error' : ''}`}
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Enter contact name"
                                            disabled={loading}
                                            required
                                        />
                                        {errors.name && (
                                            <label className="label">
                                                <span className="label-text-alt text-error">{errors.name}</span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Title / Position</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            placeholder="Enter job title"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-6">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-phone text-primary"></i>
                                    Contact Information
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Email</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={`input input-bordered input-secondary ${errors.email ? 'input-error' : ''}`}
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="Enter email address"
                                            disabled={loading}
                                        />
                                        {errors.email && (
                                            <label className="label">
                                                <span className="label-text-alt text-error">{errors.email}</span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="input input-bordered input-secondary"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="Enter phone number"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Section */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-6">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-cog text-primary"></i>
                                    Settings
                                </h4>

                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={formData.is_primary}
                                            onChange={(e) => handleInputChange('is_primary', e.target.checked)}
                                            disabled={loading}
                                        />
                                        <span className="label-text font-medium">Set as Primary Contact</span>
                                    </label>
                                    <div className="label">
                                        <span className="label-text-alt text-base-content/60">
                                            Primary contacts are highlighted and used as the default contact for this client
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg -m-6 mt-6 border-t border-base-300">
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
                            {loading && <span className="loading loading-spinner loading-sm"></span>}
                            {loading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Contact" : "Create Contact")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalContact;

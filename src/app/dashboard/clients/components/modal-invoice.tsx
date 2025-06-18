import React, { useState, useEffect } from "react";
import { Invoice, InvoiceInsert, invoiceStatusOptions } from "@/types/invoices";
import { InvoiceItem, InvoiceItemInsert } from "@/types/invoice-items";
import { Project } from "@/types/projects";

interface ModalInvoiceProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;
    clientName: string;
    clientId: string;
    projects?: Project[];
    invoice?: Invoice | null;
}

interface InvoiceFormData {
    invoice_number: string;
    project_id: string;
    issue_date: string;
    due_date: string;
    status: string;
    amount: number;
    tax_rate: number;
    notes: string;
    items: InvoiceItemInsert[];
}

interface InvoiceItemFormData {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

const ModalInvoice: React.FC<ModalInvoiceProps> = ({
    title,
    loading,
    onClose,
    onSubmit,
    clientName,
    clientId,
    projects = [],
    invoice
}) => {
    const [form, setForm] = useState<InvoiceFormData>({
        invoice_number: invoice?.invoice_number || "",
        project_id: invoice?.project_id || "",
        issue_date: invoice?.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoice?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: invoice?.status || "draft",
        amount: invoice?.amount || 0,
        tax_rate: invoice?.tax_rate || 0,
        notes: invoice?.notes || "",
        items: []
    });

    const [items, setItems] = useState<InvoiceItemFormData[]>([
        { description: "", quantity: 1, unit_price: 0, amount: 0 }
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Calculate derived values
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (form.tax_rate / 100);
    const total = subtotal + taxAmount;

    // Calculate totals when items change
    useEffect(() => {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = subtotal * (form.tax_rate / 100);
        const total = subtotal + taxAmount;

        setForm(prev => ({
            ...prev,
            amount: total
        }));
    }, [items, form.tax_rate]);

    // Generate invoice number if creating new invoice
    useEffect(() => {
        if (!invoice && !form.invoice_number) {
            const invoiceNumber = `INV-${Date.now()}`;
            setForm(prev => ({ ...prev, invoice_number: invoiceNumber }));
        }
    }, [invoice, form.invoice_number]);

    const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleItemChange = (index: number, field: keyof InvoiceItemFormData, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };

            // Recalculate amount for this item
            if (field === 'quantity' || field === 'unit_price') {
                newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
            }

            return newItems;
        });
    };

    const addItem = () => {
        setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.invoice_number.trim()) {
            newErrors.invoice_number = "Invoice number is required";
        }

        if (!form.issue_date) {
            newErrors.issue_date = "Issue date is required";
        }

        if (!form.due_date) {
            newErrors.due_date = "Due date is required";
        }

        if (items.length === 0 || items.every(item => !item.description.trim())) {
            newErrors.items = "At least one invoice item is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const invoiceItems: InvoiceItemInsert[] = items
            .filter(item => item.description.trim())
            .map((item, index) => ({
                id: `temp-${index}`,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.amount,
                tax_rate: null,
                tax_amount: null,
                total_price: item.amount,
                invoice_id: "", // Will be set when invoice is created
                business_id: "", // Will be set by the action
                created_at: new Date().toISOString(),
                created_by: "",
                updated_at: new Date().toISOString(),
                updated_by: ""
            }));

        const formData = {
            ...form,
            client_id: clientId,
            items: invoiceItems
        };

        const result = await onSubmit(formData);
        if (result.success) {
            onClose();
        }
    };

    if (!title) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl p-0">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                    <p className="text-sm text-primary-content/70 mt-2">Client: {clientName}</p>
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
                                            <span className="label-text font-medium">Invoice Number *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`input input-bordered input-secondary ${errors.invoice_number ? 'input-error' : ''}`}
                                            value={form.invoice_number}
                                            onChange={(e) => handleInputChange("invoice_number", e.target.value)}
                                            placeholder="INV-001"
                                            required
                                            disabled={loading}
                                        />
                                        {errors.invoice_number && <span className="text-error text-sm mt-1">{errors.invoice_number}</span>}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-secondary"
                                            value={form.project_id}
                                            onChange={(e) => handleInputChange("project_id", e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="">No project</option>
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status *</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-secondary"
                                            value={form.status}
                                            onChange={(e) => handleInputChange("status", e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="sent">Sent</option>
                                            <option value="paid">Paid</option>
                                            <option value="pending">Pending</option>
                                            <option value="overdue">Overdue</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Issue Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            className={`input input-bordered input-secondary ${errors.issue_date ? 'input-error' : ''}`}
                                            value={form.issue_date}
                                            onChange={(e) => handleInputChange("issue_date", e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                        {errors.issue_date && <span className="text-error text-sm mt-1">{errors.issue_date}</span>}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Due Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            className={`input input-bordered input-secondary ${errors.due_date ? 'input-error' : ''}`}
                                            value={form.due_date}
                                            onChange={(e) => handleInputChange("due_date", e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                        {errors.due_date && <span className="text-error text-sm mt-1">{errors.due_date}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Items */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                        <i className="far fa-list text-primary"></i>
                                        Invoice Items
                                    </h4>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm gap-2"
                                        onClick={addItem}
                                        disabled={loading}
                                    >
                                        <i className="far fa-plus"></i>
                                        Add Item
                                    </button>
                                </div>

                                {errors.items && <div className="text-error text-sm mb-2">{errors.items}</div>}

                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Description *</th>
                                                <th>Qty</th>
                                                <th>Rate</th>
                                                <th>Amount</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="input input-bordered input-sm w-full"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                                            placeholder="Item description"
                                                            disabled={loading}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered input-sm w-20"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                            disabled={loading}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered input-sm w-24"
                                                            value={item.unit_price}
                                                            onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                            disabled={loading}
                                                        />
                                                    </td>
                                                    <td>
                                                        <span className="font-medium">${item.amount.toFixed(2)}</span>
                                                    </td>
                                                    <td>
                                                        {items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-xs text-error"
                                                                onClick={() => removeItem(index)}
                                                                disabled={loading}
                                                            >
                                                                <i className="far fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-calculator text-primary"></i>
                                    Totals
                                </h4>
                                <div className="flex justify-end">
                                    <div className="w-80">
                                        <div className="flex justify-between py-2">
                                            <span>Subtotal:</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span>Tax Rate (%):</span>
                                            <input
                                                type="number"
                                                className="input input-bordered input-sm w-20"
                                                value={form.tax_rate}
                                                onChange={(e) => handleInputChange("tax_rate", parseFloat(e.target.value) || 0)}
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span>Tax Amount:</span>
                                            <span>${taxAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-base-300 font-bold text-lg">
                                            <span>Total:</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-comment text-primary"></i>
                                    Notes
                                </h4>
                                <div className="form-control">
                                    <textarea
                                        className="textarea textarea-bordered h-20"
                                        value={form.notes}
                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                        placeholder="Payment terms, additional notes..."
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="modal-action justify-end bg-base-200 p-6 rounded-b-lg border-t border-base-300">
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
                        className="btn btn-primary"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                Creating...
                            </>
                        ) : (
                            <>
                                <i className="far fa-file-invoice mr-2"></i>
                                {invoice ? "Update Invoice" : "Create Invoice"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalInvoice;

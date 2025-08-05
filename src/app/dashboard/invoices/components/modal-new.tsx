"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createInvoice } from "@/app/actions/invoices";
import { createInvoiceItem } from "@/app/actions/invoice-items";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { InvoiceInsert, InvoiceStatus, invoiceStatusOptions } from "@/types/invoices";
import { InvoiceItemInsert } from "@/types/invoice-items";
import { Client } from "@/types/clients";
import { Project } from "@/types/projects";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";

interface InvoiceNewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: any) => void;
}

interface InvoiceItemRow {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export default function InvoiceNewModal({ isOpen, onClose, onSave }: InvoiceNewModalProps) {
    const router = useRouter();
    const { businessId } = useBusiness();
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        client_id: "",
        project_id: "",
        invoice_number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        tax_rate: 8.5,
        notes: "",
        status: "draft" as InvoiceStatus,
    });

    const [items, setItems] = useState<InvoiceItemRow[]>([
        {
            id: "item1",
            description: "",
            quantity: 1,
            unit_price: 0,
            amount: 0,
        },
    ]);

    // Load initial data
    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen, businessId]);

    const loadInitialData = async () => {
        setLoadingData(true);
        try {
            const [clientsData, projectsData] = await Promise.all([
                getClients(businessId),
                getProjects(businessId),
            ]);
            setClients(clientsData);
            setProjects(projectsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error({
                title: "Error",
                description: "Failed to load data",
            });
        } finally {
            setLoadingData(false);
        }
    };

    // Get client details based on selected client
    const selectedClient = clients.find((c) => c.id === formData.client_id);

    // Get filtered projects based on selected client
    const filteredProjects = formData.client_id
        ? projects.filter((p) => p.client_id === formData.client_id)
        : projects;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset project when client changes
        if (name === "client_id") {
            setFormData(prev => ({
                ...prev,
                project_id: ""
            }));
        }
    };

    // Update item
    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate amount if quantity or unit_price changes
        if (field === "quantity" || field === "unit_price") {
            newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
        }

        setItems(newItems);
    };

    // Add new item
    const addItem = () => {
        setItems([...items, {
            id: `item${items.length + 1}`,
            description: "",
            quantity: 1,
            unit_price: 0,
            amount: 0,
        }]);
    };

    // Remove item
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = subtotal * (formData.tax_rate / 100);
    const total = subtotal + tax;

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); try {
            const invoiceData: InvoiceInsert = {
                id: crypto.randomUUID(),
                business_id: businessId,
                client_id: formData.client_id,
                project_id: formData.project_id || null,
                invoice_number: formData.invoice_number,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                paid_date: null,
                payment_method: null,
                amount: total,
                tax_rate: formData.tax_rate,
                notes: formData.notes || null,
                status: formData.status,
                created_at: new Date().toISOString(),
                created_by: user?.id || null,
                updated_at: new Date().toISOString(),
                updated_by: user?.id || null,
            }; const newInvoice = await createInvoice(businessId, invoiceData);

            if (newInvoice) {
                // Create invoice items
                const itemCreationPromises = items.map(async (item) => {
                    const itemData: InvoiceItemInsert = {
                        id: crypto.randomUUID(),
                        invoice_id: newInvoice.id,
                        business_id: businessId,
                        description: item.description,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        amount: item.amount,
                        tax_rate: null,
                        tax_amount: null,
                        total_price: item.amount,
                        created_at: new Date().toISOString(),
                        created_by: user?.id || null,
                        updated_at: new Date().toISOString(),
                        updated_by: user?.id || null,
                    };
                    return createInvoiceItem(businessId, itemData);
                });

                await Promise.all(itemCreationPromises);

                toast.success({
                    title: "Success",
                    description: "Invoice created successfully"
                });
                onSave(newInvoice);
                onClose();
                router.refresh();
            } else {
                toast.error({
                    title: "Error",
                    description: "Failed to create invoice"
                });
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error({
                title: "Error",
                description: "Failed to create invoice"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-6xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Create New Invoice</h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    {loadingData ? (
                        <div className="flex justify-center items-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left column - Main content */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Client & Project Information */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-info-circle text-primary"></i>
                                                Client & Project Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Client *</span>
                                                    </label>
                                                    <select
                                                        name="client_id"
                                                        className="select select-bordered select-secondary w-full"
                                                        value={formData.client_id}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={loading}
                                                    >
                                                        <option value="">Select a client</option>
                                                        {clients.map((client) => (
                                                            <option key={client.id} value={client.id}>
                                                                {client.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Project</span>
                                                    </label>
                                                    <select
                                                        name="project_id"
                                                        className="select select-bordered select-secondary w-full"
                                                        value={formData.project_id}
                                                        onChange={handleInputChange}
                                                        disabled={!formData.client_id || loading}
                                                    >
                                                        <option value="">
                                                            {formData.client_id ? "Select a project (optional)" : "Select a client first"}
                                                        </option>
                                                        {filteredProjects.map((project) => (
                                                            <option key={project.id} value={project.id}>
                                                                {project.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Billing Address Display */}
                                            {selectedClient && (
                                                <div className="mt-4">
                                                    <h4 className="font-medium mb-2">Billing Address:</h4>
                                                    <div className="p-4 bg-base-200 rounded-lg">
                                                        <p className="font-bold">{selectedClient.name}</p>
                                                        {selectedClient.contact_name && (
                                                            <p>Attn: {selectedClient.contact_name}</p>
                                                        )}
                                                        {selectedClient.address && <p>{selectedClient.address}</p>}
                                                        {selectedClient.city && selectedClient.state && (
                                                            <p>{selectedClient.city}, {selectedClient.state} {selectedClient.zip}</p>
                                                        )}                                                        {selectedClient.contact_email && (
                                                            <p className="mt-2">Email: {selectedClient.contact_email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Invoice Items */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    <i className="far fa-list text-primary"></i>
                                                    Invoice Items
                                                </h3>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline"
                                                    onClick={addItem}
                                                    disabled={loading}
                                                >
                                                    <i className="far fa-plus mr-2"></i> Add Item
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="table w-full">
                                                    <thead>
                                                        <tr>
                                                            <th>Description *</th>
                                                            <th>Quantity</th>
                                                            <th>Unit Price</th>
                                                            <th>Amount</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-secondary w-full"
                                                                        placeholder="Item description"
                                                                        value={item.description}
                                                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                                                        required
                                                                        disabled={loading}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="input input-bordered input-secondary w-full"
                                                                        min="1"
                                                                        step="1"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                                                                        required
                                                                        disabled={loading}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="input input-bordered input-secondary w-full"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                                                                        required
                                                                        disabled={loading}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-secondary w-full"
                                                                        value={formatCurrency(item.amount)}
                                                                        readOnly
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-sm text-error"
                                                                        onClick={() => removeItem(index)}
                                                                        disabled={items.length <= 1 || loading}
                                                                    >
                                                                        <i className="far fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-sticky-note text-primary"></i>
                                                Additional Notes
                                            </h3>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Notes</span>
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    className="textarea textarea-bordered textarea-secondary w-full"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    placeholder="Add notes to the invoice (optional)"
                                                    rows={4}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right column - Invoice Details & Summary */}
                                <div className="space-y-6">
                                    {/* Invoice Details */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-file-invoice text-primary"></i>
                                                Invoice Details
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Invoice Number</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="invoice_number"
                                                        className="input input-bordered input-secondary"
                                                        value={formData.invoice_number}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Issue Date *</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="issue_date"
                                                        className="input input-bordered input-secondary"
                                                        value={formData.issue_date}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Due Date *</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="due_date"
                                                        className="input input-bordered input-secondary"
                                                        value={formData.due_date}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Tax Rate (%)</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="tax_rate"
                                                        className="input input-bordered input-secondary"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={formData.tax_rate}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-medium">Status</span>
                                                    </label>
                                                    {invoiceStatusOptions.select(
                                                        formData.status,
                                                        (value: InvoiceStatus) => setFormData(prev => ({ ...prev, status: value })),
                                                        "select-secondary w-full"
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice Summary */}
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body p-4">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <i className="far fa-calculator text-primary"></i>
                                                Invoice Summary
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>{formatCurrency(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tax ({formData.tax_rate}%):</span>
                                                    <span>{formatCurrency(tax)}</span>
                                                </div>
                                                <div className="divider my-2"></div>
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total:</span>
                                                    <span>{formatCurrency(total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <div className="dropdown dropdown-top dropdown-end">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn btn-primary gap-2"
                                style={{ pointerEvents: loading ? 'none' : 'auto' }}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <i className="far fa-save"></i>
                                        Save Invoice
                                        <i className="far fa-chevron-up ml-1"></i>
                                    </>
                                )}
                            </div>
                            {!loading && (
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, status: "draft" }));
                                                setTimeout(() => document.querySelector('form')?.requestSubmit(), 100);
                                            }}
                                        >
                                            Save as Draft
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, status: "sent" }));
                                                setTimeout(() => document.querySelector('form')?.requestSubmit(), 100);
                                            }}
                                        >
                                            Save & Send
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

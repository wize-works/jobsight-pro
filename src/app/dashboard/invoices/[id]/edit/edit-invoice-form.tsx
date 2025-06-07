"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Invoice, InvoiceStatus, invoiceStatusOptions } from "@/types/invoices";
import { InvoiceItem } from "@/types/invoice-items";
import { Client } from "@/types/clients";
import { Project } from "@/types/projects";
import { updateInvoice } from "@/app/actions/invoices";
import { upsertInvoiceItems } from "@/app/actions/invoice-items";

interface EditInvoiceFormProps {
    invoice: Invoice;
    invoiceItems: InvoiceItem[];
    clients: Client[];
    projects: Project[];
    invoiceId: string;
}

export default function EditInvoiceForm({
    invoice,
    invoiceItems,
    clients,
    projects,
    invoiceId,
}: EditInvoiceFormProps) {
    const router = useRouter();    // Form state
    const [client, setClient] = useState(invoice.client_id || "");
    const [project, setProject] = useState(invoice.project_id || "");
    const [issueDate, setIssueDate] = useState(invoice.issue_date || "");
    const [dueDate, setDueDate] = useState(invoice.due_date || "");
    const [notes, setNotes] = useState(invoice.notes || "");
    const [taxRate, setTaxRate] = useState(invoice.tax_rate || 0);
    const [items, setItems] = useState<InvoiceItem[]>(invoiceItems || []);
    const [status, setStatus] = useState<InvoiceStatus>(invoice.status as InvoiceStatus ?? "draft" as InvoiceStatus);

    // Get client details based on selected client
    const selectedClient = clients.find((c) => c.id === client);    // Get filtered projects based on selected client
    const filteredProjects = client ? projects.filter((p) => p.client_id === client) : projects;    // Update item
    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate amount if quantity or unit_price changes
        if (field === "quantity" || field === "unit_price") {
            newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
        }

        setItems(newItems);
    };    // Add new item
    const addItem = () => {
        setItems([
            ...items,
            {
                id: `item${items.length + 1}`,
                invoice_id: invoiceId,
                business_id: "",
                description: "",
                quantity: 1,
                unit_price: 0,
                amount: 0,
                tax_rate: null,
                tax_amount: null,
                total_price: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: null,
                updated_by: null,
            },
        ]);
    };

    // Remove item
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);

    // Calculate tax
    const tax = subtotal * (taxRate / 100);

    // Calculate total
    const total = subtotal + tax;

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {

            await updateInvoice(invoiceId, {
                id: invoiceId,
                client_id: client,
                project_id: project,
                issue_date: issueDate ? new Date(issueDate).toISOString() : null,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                notes,
                tax_rate: taxRate,
                business_id: invoice.business_id,
                invoice_number: invoice.invoice_number,
                amount: total,
                status: status,
                paid_date: invoice.paid_date ? new Date(invoice.paid_date).toISOString() : null,
                payment_method: invoice.payment_method,
                created_at: invoice.created_at,
                created_by: invoice.created_by,
                updated_at: invoice.updated_at,
                updated_by: invoice.updated_by
            });

            await upsertInvoiceItems(items);

            // For now, just redirect back to the invoice detail page
            router.push(`/dashboard/invoices/${invoiceId}`);
        } catch (error) {
            console.error("Error updating invoice:", error);
            // Handle error (show toast, etc.)
        }
    };

    const isPaid = invoice.status === "paid";

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Invoice {invoice.invoice_number} {invoiceStatusOptions.badge(status as InvoiceStatus)}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Client & Project */}
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h2 className="card-title">Client & Project</h2>
                                <div className="divider mt-0"></div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Client</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={client}
                                            onChange={(e) => {
                                                setClient(e.target.value);
                                                setProject(""); // Reset project when client changes
                                            }}
                                            required
                                            disabled={isPaid}
                                        >
                                            <option value="" disabled>
                                                Select a client
                                            </option>
                                            {clients.map((clientItem) => (
                                                <option key={clientItem.id} value={clientItem.id}>
                                                    {clientItem.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Project</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={project}
                                            onChange={(e) => setProject(e.target.value)}
                                            required
                                            disabled={!client || isPaid}
                                        >
                                            <option value="" disabled>
                                                {client ? "Select a project" : "Select a client first"}
                                            </option>
                                            {filteredProjects.map((projectItem) => (
                                                <option key={projectItem.id} value={projectItem.id}>
                                                    {projectItem.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {selectedClient && (
                                    <div className="mt-4">
                                        <h3 className="font-medium mb-2">Billing Address:</h3>
                                        <div className="p-4 bg-base-200 rounded-lg">
                                            <p className="font-bold">{selectedClient.name}</p>
                                            {selectedClient.contact_name && (
                                                <p>Attn: {selectedClient.contact_name}</p>
                                            )}
                                            {selectedClient.address && (
                                                <p>{selectedClient.address}</p>
                                            )}
                                            {(selectedClient.city || selectedClient.state || selectedClient.zip) && (
                                                <p>
                                                    {selectedClient.city && selectedClient.city}
                                                    {selectedClient.city && selectedClient.state && ", "}
                                                    {selectedClient.state && selectedClient.state}
                                                    {selectedClient.zip && ` ${selectedClient.zip}`}
                                                </p>
                                            )}
                                            {selectedClient.country && (
                                                <p>{selectedClient.country}</p>
                                            )}
                                            {selectedClient.contact_email && (
                                                <p className="mt-2">Email: {selectedClient.contact_email}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice Items */}
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <div className="flex justify-between items-center">
                                    <h2 className="card-title">Invoice Items</h2>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={addItem}
                                        disabled={isPaid}
                                    >
                                        <i className="fas fa-plus mr-2"></i> Add Item
                                    </button>
                                </div>
                                <div className="divider mt-0"></div>

                                <div className="overflow-x-auto">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
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
                                                            className="input input-bordered w-full"
                                                            placeholder="Item description"
                                                            value={item.description || ""}
                                                            onChange={(e) => updateItem(index, "description", e.target.value)}
                                                            required
                                                            disabled={isPaid}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered w-24"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity || 1}
                                                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                                                            required
                                                            disabled={isPaid}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered w-32"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unit_price || 0}
                                                            onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                                                            required
                                                            disabled={isPaid}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered w-32"
                                                            value={item.amount || 0}
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-sm text-error"
                                                            onClick={() => removeItem(index)}
                                                            disabled={items.length <= 1 || isPaid}
                                                        >
                                                            <i className="fas fa-trash"></i>
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
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h2 className="card-title">Notes</h2>
                                <div className="divider mt-0"></div>

                                <div className="form-control">
                                    <textarea
                                        className="textarea textarea-bordered h-24 w-full"
                                        placeholder="Add notes to the invoice (optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={isPaid}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column - Invoice Details & Summary */}
                    <div>
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h2 className="card-title">Invoice Details</h2>
                                <div className="divider mt-0"></div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Invoice Number</span>
                                    </label>
                                    <input type="text" className="input input-bordered w-full" value={invoice.invoice_number} readOnly disabled />
                                </div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Issue Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        required
                                        disabled={isPaid}
                                    />
                                </div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Due Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        disabled={isPaid}
                                    />
                                </div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Tax Rate (%)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered w-full"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                        disabled={isPaid}
                                    />
                                </div>

                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text">Status</span>
                                    </label>
                                    {invoiceStatusOptions.select(
                                        status,
                                        (value) => setStatus(value as InvoiceStatus),
                                        "select select-bordered w-full"
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h2 className="card-title">Invoice Summary</h2>
                                <div className="divider mt-0"></div>

                                <div className="flex justify-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span>Tax ({taxRate}%):</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="divider my-2"></div>
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2">
                            <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-outline flex-1">
                                Cancel
                            </Link>
                            <button type="submit" className="btn btn-primary flex-1" disabled={isPaid}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

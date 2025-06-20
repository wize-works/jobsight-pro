"use client";

import { useState } from "react";
import { Invoice, InvoiceStatus, invoiceStatusOptions, InvoiceWithClient } from "@/types/invoices";
import { formatCurrency } from "@/utils/formatters";
import InvoiceCard from "../components/card";
import InvoiceNewModal from "../components/modal-new";
import InvoiceEditModal from "../components/modal-edit";
import Link from "next/link";

export const InvoicesList = ({ initialInvoices }: { initialInvoices: InvoiceWithClient[] }) => {
    const [invoices, setInvoices] = useState<InvoiceWithClient[]>(initialInvoices);
    const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>();
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && window.localStorage.getItem("invoiceViewType") === "list" ? "list" : "grid"
    );
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("invoiceViewType", type);
        }
    };

    const handleEditInvoice = (invoice: InvoiceWithClient) => {
        setSelectedInvoice(invoice);
        setShowEditModal(true);
    };

    const handleNewInvoice = () => {
        setShowNewModal(true);
    };

    const handleSaveNewInvoice = (newInvoice: any) => {
        // For now, we'll need to reload the page to get the client data
        // In a real app, you'd want to fetch the client data and add it to the list
        window.location.reload();
    };

    const handleSaveEditInvoice = (updatedInvoice: any) => {
        // Update the invoice in the list
        setInvoices(prev => prev.map(inv =>
            inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv
        ));
    }; return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Invoices</h1>
                    <p className="text-sm text-base-content/50">Manage your invoices efficiently</p>
                </div>
                <div className="flex items-center space-x-6">
                    <button
                        className="btn btn-primary"
                        onClick={handleNewInvoice}
                    >
                        <i className="far fa-plus mr-2"></i> New Invoice
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-title">Total Invoices</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-primary">{invoices.length}</div>
                        <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-money-bill-wave text-primary text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All invoices in the system</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-title">Total Amount</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-accent">
                            {formatCurrency(invoices.reduce((sum, invoice) => sum + (invoice?.amount || 0), 0))}
                        </div>
                        <div className="stat-icon text-accent bg-accent/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-dollar-sign text-accent text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Total amount of all invoices</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-title">Paid Invoices</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-success">
                            {invoices.filter(invoice => invoice.status === "paid").length}
                        </div>
                        <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-check-circle text-success text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Invoices marked as paid</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-title">Overdue Invoices</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-error">
                            {invoices.filter(invoice => invoice.status === "overdue").length}
                        </div>
                        <div className="stat-icon text-error bg-error/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-exclamation-triangle text-error text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Invoices that are overdue</div>
                </div>
            </div>
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="form-control w-full">
                            <input
                                type="text"
                                placeholder="Search by number or client"
                                className="input input-bordered input-secondary w-full"
                                onChange={(e) => {
                                    const query = e.target.value.toLowerCase();
                                    setInvoices(initialInvoices.filter(invoice =>
                                        invoice.invoice_number.toLowerCase().includes(query) ||
                                        invoice.client_id.toLowerCase().includes(query)
                                    ));
                                }}
                            />
                        </div>
                        {invoiceStatusOptions.select(
                            invoiceStatus,
                            (value: InvoiceStatus | "all") => {
                                setInvoiceStatus(value);
                                if (value === "all") {
                                    setInvoices(initialInvoices);
                                } else {
                                    setInvoices(initialInvoices.filter(invoice => invoice.status === value));
                                }
                            },
                            "select-secondary w-full"
                        )}
                        <div className="flex items-center gap-2">
                            <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                                <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                                <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>{viewType === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {invoices.map((invoice) => (
                        <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            onEdit={handleEditInvoice}
                        />
                    ))}
                </div>
            )}
            {viewType === "list" && (
                <div className="overflow-x-auto mb-6">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Invoice Number</th>
                                <th>Issued Date</th>
                                <th>Due Date</th>
                                <th>Paid Date</th>
                                <th>Client</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td>{invoice.invoice_number}</td>
                                    <td>{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "N/A"}</td>
                                    <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</td>
                                    <td>{invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : "N/A"}</td>
                                    <td>{invoice.client.name}</td>
                                    <td>{formatCurrency(invoice.amount ?? 0)}</td>
                                    <td>{invoiceStatusOptions.badge(invoice.status as InvoiceStatus)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => handleEditInvoice(invoice)}
                                            >
                                                <i className="far fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New Invoice Modal */}
            <InvoiceNewModal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                onSave={handleSaveNewInvoice}
            />

            {/* Edit Invoice Modal */}
            {selectedInvoice && (
                <InvoiceEditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedInvoice(null);
                    }}
                    onSave={handleSaveEditInvoice}
                    invoice={selectedInvoice}
                />
            )}
        </div>
    );
}

export default InvoicesList;
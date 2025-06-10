"use client";

import { useState } from "react";
import { Invoice, InvoiceStatus, invoiceStatusOptions, InvoiceWithClient } from "@/types/invoices";
import { formatCurrency } from "@/utils/formatters";
import InvoiceCard from "../components/card";

export const InvoicesList = ({ initialInvoices }: { initialInvoices: InvoiceWithClient[] }) => {
    const [invoices, setInvoices] = useState<InvoiceWithClient[]>(initialInvoices);
    const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>();
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && window.localStorage.getItem("invoiceViewType") === "list" ? "list" : "grid"
    );

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("invoiceViewType", type);
        }
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-title">Total Invoices</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-primary">{invoices.length}</div>
                        <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-money-bill-wave text-primary text-2xl"></i>
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
                            <i className="fas fa-dollar-sign text-accent text-2xl"></i>
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
                            <i className="fas fa-check-circle text-success text-2xl"></i>
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
                            <i className="fas fa-exclamation-triangle text-error text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Invoices that are overdue</div>
                </div>
            </div>
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="form-control w-full md:w-1/3">
                            <input
                                type="text"
                                placeholder="Search by number or client"
                                className="input input-bordered w-full"
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
                                if (value === "all") {
                                    setInvoices(initialInvoices);
                                } else {
                                    setInvoices(initialInvoices.filter(invoice => invoice.status === value));
                                }
                            }
                        )}
                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="fas fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="fas fa-table-rows"></i> </button>
                        </div>
                    </div>
                </div>
            </div>
            {viewType === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

                    {invoices.map((invoice) => (
                        <InvoiceCard key={invoice.id} invoice={invoice} />
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default InvoicesList;
"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Mock data for a single invoice (same as in the detail page)
const mockInvoice = {
    id: "INV-2025-001",
    client: "Oakridge Development",
    clientId: "client1",
    project: "Main Street Development",
    projectId: "proj1",
    amount: 12500.0,
    status: "paid",
    issueDate: "2025-04-15",
    dueDate: "2025-05-15",
    paidDate: "2025-05-10",
    paymentMethod: "Credit Card",
    notes: "Payment for Phase 1 completion of the Main Street Development project.",
    items: [
        {
            id: "item1",
            description: "Foundation Work",
            quantity: 1,
            unitPrice: 5000.0,
            amount: 5000.0,
        },
        {
            id: "item2",
            description: "Framing Labor",
            quantity: 80,
            unitPrice: 75.0,
            amount: 6000.0,
        },
        {
            id: "item3",
            description: "Materials - Lumber",
            quantity: 1,
            unitPrice: 1500.0,
            amount: 1500.0,
        },
    ],
    billingAddress: {
        name: "Oakridge Development",
        attention: "Michael Thompson",
        street: "123 Corporate Blvd",
        city: "Anytown",
        state: "CA",
        zip: "90210",
        country: "USA",
    },
    taxRate: 8, // 8%
}

// Mock data for clients
const mockClients = [
    {
        id: "client1",
        name: "Oakridge Development",
        email: "billing@oakridge.com",
        address: {
            attention: "Michael Thompson",
            street: "123 Corporate Blvd",
            city: "Anytown",
            state: "CA",
            zip: "90210",
            country: "USA",
        },
    },
    {
        id: "client2",
        name: "Riverside Properties",
        email: "accounts@riverside.com",
        address: {
            attention: "James Wilson",
            street: "456 River Rd",
            city: "Anytown",
            state: "CA",
            zip: "90210",
            country: "USA",
        },
    },
    {
        id: "client3",
        name: "Metro City Government",
        email: "finance@metrocity.gov",
        address: {
            attention: "Mayor Thomas Wilson",
            street: "789 Center Ave",
            city: "Metro City",
            state: "CA",
            zip: "90211",
            country: "USA",
        },
    },
]

// Mock data for projects
const mockProjects = [
    { id: "proj1", name: "Main Street Development", clientId: "client1" },
    { id: "proj2", name: "Riverside Apartments", clientId: "client2" },
    { id: "proj3", name: "Downtown Project", clientId: "client3" },
    { id: "proj4", name: "Johnson Residence", clientId: "client7" },
]

export default function EditInvoicePage() {
    const params = useParams()
    const router = useRouter()
    const invoiceId = params.id as string

    // State for form fields
    const [client, setClient] = useState(mockInvoice.clientId)
    const [project, setProject] = useState(mockInvoice.projectId)
    const [issueDate, setIssueDate] = useState(mockInvoice.issueDate)
    const [dueDate, setDueDate] = useState(mockInvoice.dueDate)
    const [items, setItems] = useState([...mockInvoice.items])
    const [notes, setNotes] = useState(mockInvoice.notes)
    const [taxRate, setTaxRate] = useState(mockInvoice.taxRate)

    // Get client details based on selected client
    const selectedClient = mockClients.find((c) => c.id === client)

    // Get filtered projects based on selected client
    const filteredProjects = client ? mockProjects.filter((p) => p.clientId === client) : mockProjects

    // Update item
    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Recalculate amount if quantity or unitPrice changes
        if (field === "quantity" || field === "unitPrice") {
            newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].unitPrice)
        }

        setItems(newItems)
    }

    // Add new item
    const addItem = () => {
        setItems([
            ...items,
            {
                id: `item${items.length + 1}`,
                description: "",
                quantity: 1,
                unitPrice: 0,
                amount: 0,
            },
        ])
    }

    // Remove item
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items]
            newItems.splice(index, 1)
            setItems(newItems)
        }
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0)

    // Calculate tax
    const tax = subtotal * (taxRate / 100)

    // Calculate total
    const total = subtotal + tax

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount)
    }

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, this would send the data to the server
        console.log({
            id: invoiceId,
            client,
            project,
            issueDate,
            dueDate,
            items,
            notes,
            taxRate,
            subtotal,
            tax,
            total,
        })
        // Redirect to invoice detail page
        router.push(`/dashboard/invoices/${invoiceId}`)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Invoice {invoiceId}</h1>
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
                                                setClient(e.target.value)
                                                setProject("") // Reset project when client changes
                                            }}
                                            required
                                            disabled={mockInvoice.status === "paid"}
                                        >
                                            <option value="" disabled>
                                                Select a client
                                            </option>
                                            {mockClients.map((client) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name}
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
                                            disabled={!client || mockInvoice.status === "paid"}
                                        >
                                            <option value="" disabled>
                                                {client ? "Select a project" : "Select a client first"}
                                            </option>
                                            {filteredProjects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
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
                                            <p>Attn: {selectedClient.address.attention}</p>
                                            <p>{selectedClient.address.street}</p>
                                            <p>
                                                {selectedClient.address.city}, {selectedClient.address.state} {selectedClient.address.zip}
                                            </p>
                                            <p>{selectedClient.address.country}</p>
                                            <p className="mt-2">Email: {selectedClient.email}</p>
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
                                        disabled={mockInvoice.status === "paid"}
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
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, "description", e.target.value)}
                                                            required
                                                            disabled={mockInvoice.status === "paid"}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered w-24"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                                                            required
                                                            disabled={mockInvoice.status === "paid"}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered w-32"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                                                            required
                                                            disabled={mockInvoice.status === "paid"}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="input input-bordered w-32" value={item.amount} readOnly />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-sm text-error"
                                                            onClick={() => removeItem(index)}
                                                            disabled={items.length <= 1 || mockInvoice.status === "paid"}
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
                                        className="textarea textarea-bordered h-24"
                                        placeholder="Add notes to the invoice (optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={mockInvoice.status === "paid"}
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
                                    <input type="text" className="input input-bordered" value={invoiceId} readOnly />
                                </div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Issue Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        required
                                        disabled={mockInvoice.status === "paid"}
                                    />
                                </div>

                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Due Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        disabled={mockInvoice.status === "paid"}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Tax Rate (%)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                        disabled={mockInvoice.status === "paid"}
                                    />
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
                            <button type="submit" className="btn btn-primary flex-1" disabled={mockInvoice.status === "paid"}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

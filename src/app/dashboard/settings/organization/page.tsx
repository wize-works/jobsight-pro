"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function OrganizationSettingsPage() {
    const [organization, setOrganization] = useState({
        name: "Johnson Construction",
        industry: "construction",
        size: "51-200",
        website: "https://johnsonconstruction.example.com",
        phone: "(555) 987-6543",
        email: "info@johnsonconstruction.example.com",
        address: {
            street: "123 Builder Avenue",
            city: "Construction City",
            state: "CA",
            zip: "90210",
            country: "United States",
        },
        logo: "/logo.png",
        taxId: "12-3456789",
        founded: "2005",
    })

    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({ ...organization })

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        if (name.includes(".")) {
            const [parent, child] = name.split(".")
            setFormData({
                ...formData,
                [parent]: {
                    ...((formData[parent as keyof typeof formData] as object) || {}),
                    [child]: value,
                },
            })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setOrganization({ ...formData })
        setIsEditing(false)
        // In a real app, this would save to the backend
    }

    // Industry options
    const industries = [
        { value: "construction", label: "Construction" },
        { value: "manufacturing", label: "Manufacturing" },
        { value: "engineering", label: "Engineering" },
        { value: "architecture", label: "Architecture" },
        { value: "real_estate", label: "Real Estate" },
        { value: "utilities", label: "Utilities" },
        { value: "transportation", label: "Transportation" },
        { value: "mining", label: "Mining" },
        { value: "oil_gas", label: "Oil & Gas" },
        { value: "other", label: "Other" },
    ]

    // Company size options
    const companySizes = [
        { value: "1-10", label: "1-10 employees" },
        { value: "11-50", label: "11-50 employees" },
        { value: "51-200", label: "51-200 employees" },
        { value: "201-500", label: "201-500 employees" },
        { value: "501-1000", label: "501-1000 employees" },
        { value: "1001+", label: "1001+ employees" },
    ]

    // Country options (abbreviated list)
    const countries = [
        { value: "United States", label: "United States" },
        { value: "Canada", label: "Canada" },
        { value: "Mexico", label: "Mexico" },
        { value: "United Kingdom", label: "United Kingdom" },
        { value: "Australia", label: "Australia" },
        { value: "Germany", label: "Germany" },
        { value: "France", label: "France" },
        { value: "Japan", label: "Japan" },
        { value: "China", label: "China" },
        { value: "Brazil", label: "Brazil" },
    ]

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Organization Settings</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left sidebar - Navigation */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <h2 className="card-title">Organization Settings</h2>
                            <div className="divider mt-0"></div>
                            <ul className="menu bg-base-100 w-full p-0">
                                <li>
                                    <a className="active">
                                        <i className="fas fa-building"></i> Organization Profile
                                    </a>
                                </li>
                                <li>
                                    <a>
                                        <i className="fas fa-map-marker-alt"></i> Locations
                                    </a>
                                </li>
                                <li>
                                    <a>
                                        <i className="fas fa-users"></i> Departments
                                    </a>
                                </li>
                                <li>
                                    <a>
                                        <i className="fas fa-palette"></i> Branding
                                    </a>
                                </li>
                                <li>
                                    <a>
                                        <i className="fas fa-file-invoice"></i> Billing Information
                                    </a>
                                </li>
                                <li>
                                    <a>
                                        <i className="fas fa-user-shield"></i> Roles & Permissions
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title text-error">Danger Zone</h2>
                            <div className="divider mt-0"></div>
                            <p className="text-sm text-base-content/70 mb-4">
                                These actions are irreversible. Please proceed with caution.
                            </p>
                            <button className="btn btn-outline btn-error btn-block">
                                <i className="fas fa-trash mr-2"></i> Delete Organization
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right content - Organization information */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center">
                                <h2 className="card-title">Organization Profile</h2>
                                {!isEditing && (
                                    <button className="btn btn-sm btn-outline" onClick={() => setIsEditing(true)}>
                                        <i className="fas fa-edit mr-2"></i> Edit
                                    </button>
                                )}
                            </div>
                            <div className="divider mt-0"></div>

                            {isEditing ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                                        <div className="flex flex-col items-center">
                                            <div className="avatar">
                                                <div className="w-24 rounded-full">
                                                    <Image
                                                        src={organization.logo || "/placeholder.svg"}
                                                        alt="Organization Logo"
                                                        width={96}
                                                        height={96}
                                                    />
                                                </div>
                                            </div>
                                            <button type="button" className="btn btn-sm btn-outline mt-4">
                                                <i className="fas fa-upload mr-2"></i> Change Logo
                                            </button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Organization Name</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="input input-bordered"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Industry</span>
                                                </label>
                                                <select
                                                    name="industry"
                                                    className="select select-bordered w-full"
                                                    value={formData.industry}
                                                    onChange={handleChange}
                                                >
                                                    {industries.map((industry) => (
                                                        <option key={industry.value} value={industry.value}>
                                                            {industry.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Company Size</span>
                                                </label>
                                                <select
                                                    name="size"
                                                    className="select select-bordered w-full"
                                                    value={formData.size}
                                                    onChange={handleChange}
                                                >
                                                    {companySizes.map((size) => (
                                                        <option key={size.value} value={size.value}>
                                                            {size.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Year Founded</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="founded"
                                                    className="input input-bordered"
                                                    value={formData.founded}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mt-6 mb-4">Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Website</span>
                                            </label>
                                            <input
                                                type="url"
                                                name="website"
                                                className="input input-bordered"
                                                value={formData.website}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Phone Number</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                className="input input-bordered"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Email Address</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="input input-bordered"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Tax ID / EIN</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="taxId"
                                                className="input input-bordered"
                                                value={formData.taxId}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mt-6 mb-4">Address</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Street Address</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="address.street"
                                                className="input input-bordered"
                                                value={formData.address.street}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">City</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address.city"
                                                    className="input input-bordered"
                                                    value={formData.address.city}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">State / Province</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address.state"
                                                    className="input input-bordered"
                                                    value={formData.address.state}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">ZIP / Postal Code</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address.zip"
                                                    className="input input-bordered"
                                                    value={formData.address.zip}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Country</span>
                                                </label>
                                                <select
                                                    name="address.country"
                                                    className="select select-bordered w-full"
                                                    value={formData.address.country}
                                                    onChange={handleChange}
                                                >
                                                    {countries.map((country) => (
                                                        <option key={country.value} value={country.value}>
                                                            {country.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-6">
                                        <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                                        <div className="flex flex-col items-center">
                                            <div className="avatar">
                                                <div className="w-24 rounded-full">
                                                    <Image
                                                        src={organization.logo || "/placeholder.svg"}
                                                        alt="Organization Logo"
                                                        width={96}
                                                        height={96}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                                                <div>
                                                    <div className="text-sm text-base-content/70">Organization Name</div>
                                                    <div className="font-medium">{organization.name}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-base-content/70">Industry</div>
                                                    <div className="font-medium">
                                                        {industries.find((i) => i.value === organization.industry)?.label || organization.industry}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-base-content/70">Company Size</div>
                                                    <div className="font-medium">
                                                        {companySizes.find((s) => s.value === organization.size)?.label || organization.size}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-base-content/70">Year Founded</div>
                                                    <div className="font-medium">{organization.founded}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mt-6 mb-4">Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                                        <div>
                                            <div className="text-sm text-base-content/70">Website</div>
                                            <div className="font-medium">
                                                <a href={organization.website} target="_blank" rel="noopener noreferrer" className="link">
                                                    {organization.website}
                                                </a>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-base-content/70">Phone Number</div>
                                            <div className="font-medium">{organization.phone}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-base-content/70">Email Address</div>
                                            <div className="font-medium">
                                                <a href={`mailto:${organization.email}`} className="link">
                                                    {organization.email}
                                                </a>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-base-content/70">Tax ID / EIN</div>
                                            <div className="font-medium">{organization.taxId}</div>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mt-6 mb-4">Address</h3>
                                    <div>
                                        <div className="text-sm text-base-content/70">Street Address</div>
                                        <div className="font-medium">{organization.address.street}</div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 mt-4">
                                        <div>
                                            <div className="text-sm text-base-content/70">City</div>
                                            <div className="font-medium">{organization.address.city}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-base-content/70">State / Province</div>
                                            <div className="font-medium">{organization.address.state}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-base-content/70">ZIP / Postal Code</div>
                                            <div className="font-medium">{organization.address.zip}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-base-content/70">Country</div>
                                            <div className="font-medium">{organization.address.country}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Additional Locations</h2>
                            <div className="divider mt-0"></div>
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Phone</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>North Office</td>
                                            <td>456 North Street, North City, NC 12345</td>
                                            <td>(555) 123-4567</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-xs btn-outline">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-xs btn-outline btn-error">
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>South Office</td>
                                            <td>789 South Avenue, South City, SC 67890</td>
                                            <td>(555) 987-6543</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-xs btn-outline">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-xs btn-outline btn-error">
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4">
                                <button className="btn btn-outline btn-sm">
                                    <i className="fas fa-plus mr-2"></i> Add Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

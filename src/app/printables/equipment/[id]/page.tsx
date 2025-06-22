"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getEquipmentPrintableDetail } from "@/app/actions/equipments";
import { useBusiness } from "@/lib/business-context";
import { EquipmentMaintenance } from "@/types/equipment-maintenance";
import { EquipmentUsage, EquipmentUsageWithDetails } from "@/types/equipment_usage";
import { EquipmentAssignmentWithDetails } from "@/types/equipment-assignments";
import { EquipmentSpecification } from "@/types/equipment-specifications";
import { Media } from "@/types/media";
import QRCode from "@/components/qrcode";

interface EquipmentPrintableData {
    id: string;
    name: string;
    type: string;
    model: string;
    make: string;
    year: string;
    serial_number: string;
    status: string;
    location: string;
    description: string;
    purchase_date: string;
    purchase_price: number;
    current_value: number;
    image_url: string;
    next_maintenance?: string;
    equipment_assignments?: EquipmentAssignmentWithDetails[];
    equipment_maintenance?: EquipmentMaintenance[];
    equipment_usage?: EquipmentUsageWithDetails[];
    equipment_specifications?: EquipmentSpecification[];
    documents?: Media[];
    // Aggregate data
    total_assignments?: number;
    maintenance_count?: number;
    usage_count?: number;
    specifications_count?: number;
    total_hours?: number;
    total_maintenance_cost?: number;
}

export default function EquipmentPrintPage() {
    const { id } = useParams() as { id: string };
    const { businessId } = useBusiness();
    const [data, setData] = useState<EquipmentPrintableData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!businessId || !id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await getEquipmentPrintableDetail(businessId, id);
                setData(result);
            } catch (err) {
                console.error("Failed to fetch equipment data:", err);
                setError("Failed to load equipment data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [businessId, id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    } if (error || !data) {
        return <div className="p-8 text-center">{error || "Equipment not found."}</div>;
    }

    const { equipment_assignments, equipment_maintenance, equipment_usage, equipment_specifications, documents } = data;
    const assignments = equipment_assignments;
    const maintenance = equipment_maintenance;
    const usage = equipment_usage;
    const specifications = equipment_specifications;
    // Find the most recent active assignment
    let assignedTo = "Unassigned";
    if (assignments && assignments.length > 0) {
        // Prefer assignments with no end_date or end_date in the future
        const now = new Date();
        const active = assignments.filter((a: EquipmentAssignmentWithDetails) => !a.end_date || new Date(a.end_date) >= now);
        const mostRecent = (active.length > 0 ? active : assignments)
            .sort((a: EquipmentAssignmentWithDetails, b: EquipmentAssignmentWithDetails) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
        if (mostRecent) {
            assignedTo = mostRecent.crew_name || mostRecent.crew_id || "Unassigned";
        }
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:bg-white print:shadow-none shadow rounded-lg text-base-content text-sm">
            <div className="flex flex-col items-start mb-8">
                <div className="flex flex-row justify-between mb-4 w-full">
                    <img src={data.image_url || "/default-equipment.png"} alt={data.name} className="rounded-xl w-48 h-48 object-cover mb-4" />
                    <div>
                        <QRCode text={`https://pro.jobsight.co/dashboard/equipment/${data.id}`} width={200} />
                        <div className="text-sm text-center mt-2">Scan for details</div>
                        <div className="text-sm text-center text-primary">jobsight.co</div>
                    </div>
                </div>            <h1 className="text-3xl font-bold mb-2">{data.name}</h1>
                <div className="text-base-content/70 mb-2">{data.make} {data.model} ({data.year})</div>
                <div className="mb-2">Type: <span className="font-semibold">{data.type}</span></div>
                <div className="mb-2">Status: <span className="font-semibold capitalize">{data.status?.replace(/_/g, " ")}</span></div>
                <div className="mb-2">Location: <span className="font-semibold">{data.location}</span></div>
                <div className="mb-2">Assigned To: <span className="font-semibold">{assignedTo}</span></div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p>{data.description || <span className="text-gray-400">No description provided.</span>}</p>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Specifications</h2>
                {specifications && specifications.length > 0 ? (
                    <table className="table table-zebra w-full">
                        <tbody>
                            {specifications.map((spec: EquipmentSpecification) => (
                                <tr key={spec.id}>
                                    <td className="font-medium w-1/2">{spec.name}</td>
                                    <td>{spec.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-gray-400">No specifications available.</div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Financial</h2>                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>Purchase Date: <span className="font-semibold">{data.purchase_date ? new Date(data.purchase_date).toLocaleDateString() : "Not set"}</span></div>
                    <div>Purchase Price: <span className="font-semibold">{data.purchase_price ? `$${data.purchase_price.toLocaleString()}` : "Not set"}</span></div>
                    <div>Current Value: <span className="font-semibold">{data.current_value ? `$${data.current_value.toLocaleString()}` : "Not set"}</span></div>
                    <div>Depreciation Rate: <span className="font-semibold">{data.purchase_price && data.current_value && data.purchase_date ? (() => { const ageYears = (Date.now() - new Date(data.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25); if (ageYears > 0) { const rate = ((data.purchase_price - data.current_value) / data.purchase_price / ageYears) * 100; return `${rate.toFixed(1)}%/yr`; } return "Not set"; })() : "Not set"}</span></div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Maintenance Records</h2>
                {maintenance && maintenance.length > 0 ? (
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(maintenance as EquipmentMaintenance[]).map((m) => (
                                <tr key={m.id}>
                                    <td>{m.maintenance_date ? new Date(m.maintenance_date).toLocaleDateString() : "-"}</td>
                                    <td>{m.maintenance_type}</td>
                                    <td>{m.description}</td>
                                    <td>{m.cost ? `$${m.cost.toLocaleString()}` : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-gray-400">No maintenance records available.</div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Usage Records</h2>
                {usage && usage.length > 0 ? (<table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Project</th>
                            <th>Hours Used</th>
                            <th>Fuel Consumed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(usage as EquipmentUsageWithDetails[]).map((u) => (
                            <tr key={u.id}>
                                <td>{u.start_date ? new Date(u.start_date).toLocaleDateString() : "-"}</td>
                                <td>{u.end_date ? new Date(u.end_date).toLocaleDateString() : "-"}</td>
                                <td>{u.project_name}</td>
                                <td>{u.hours_used}</td>
                                <td>{u.fuel_consumed}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                ) : (
                    <div className="text-gray-400">No usage records available.</div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Assignments</h2>
                {assignments && assignments.length > 0 ? (
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Crew</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(assignments as EquipmentAssignmentWithDetails[]).map((a) => (
                                <tr key={a.id}>
                                    <td>{a.project_name || a.project_id}</td>
                                    <td>{a.crew_name || a.crew_id}</td>
                                    <td>{a.start_date ? new Date(a.start_date).toLocaleDateString() : "-"}</td>
                                    <td>{a.end_date ? new Date(a.end_date).toLocaleDateString() : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-gray-400">No assignments available.</div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Documents</h2>
                {documents && documents.length > 0 ? (
                    <ul className="list-disc pl-5">
                        {(documents as Media[]).map((doc, idx) => (
                            <li key={idx} className="mb-1">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {doc.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-400">No documents available.</div>
                )}
            </div>
        </div>
    );
}

import { getEquipmentById } from "@/app/actions/equipments";
import { getEquipmentMaintenancesByEquipmentId } from "@/app/actions/equipment-maintenance";
import { getEquipmentUsagesByEquipmentId } from "@/app/actions/equipment_usage";
import { getEquipmentAssignmentsByEquipmentId } from "@/app/actions/equipment-assignments";
import { getEquipmentSpecificationsByEquipmentId } from "@/app/actions/equipment-specifications";
import { getMediaByEquipmentId } from "@/app/actions/media";
import { EquipmentMaintenance } from "@/types/equipment-maintenance";
import { EquipmentUsage } from "@/types/equipment_usage";
import { EquipmentAssignmentWithDetails } from "@/types/equipment-assignments";
import { EquipmentSpecification } from "@/types/equipment-specifications";
import { Media } from "@/types/media";
import QRCode from "@/components/qrcode";

export default async function EquipmentPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const equipment = await getEquipmentById(id);
    if (!equipment) {
        return <div className="p-8 text-center">Equipment not found.</div>;
    }
    const [maintenances, usages, assignments, specifications, documents] = await Promise.all([
        getEquipmentMaintenancesByEquipmentId(id),
        getEquipmentUsagesByEquipmentId(id),
        getEquipmentAssignmentsByEquipmentId(id),
        getEquipmentSpecificationsByEquipmentId(id),
        getMediaByEquipmentId(id, "documents"),
    ]);

    // Find the most recent active assignment
    let assignedTo = "Unassigned";
    if (assignments && assignments.length > 0) {
        // Prefer assignments with no end_date or end_date in the future
        const now = new Date();
        const active = assignments.filter((a: any) => !a.end_date || new Date(a.end_date) >= now);
        const mostRecent = (active.length > 0 ? active : assignments)
            .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
        if (mostRecent) {
            assignedTo = mostRecent.crew_id || "Unassigned";
        }
    }

    return (
        <div className="max-w-4xl mx-auto bg-base-100 p-8 print:p-0 print:bg-white print:shadow-none shadow rounded-lg text-base-content">
            <div className="flex flex-col items-start mb-8">
                <div className="flex flex-row justify-between mb-4 w-full">
                    <img src={equipment.image_url || "/default-equipment.png"} alt={equipment.name} className="rounded-xl w-48 h-48 object-cover mb-4" />
                    <div>
                        <QRCode text={`https://pro.jobsight.co/dashboard/equipment/${equipment.id}`} width={200} />
                        <div className="text-sm text-center mt-2">Scan for details</div>
                        <div className="text-sm text-center text-primary">jobsight.co</div>
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">{equipment.name}</h1>
                <div className="text-base-content/70 mb-2">{equipment.make} {equipment.model} ({equipment.year})</div>
                <div className="mb-2">Type: <span className="font-semibold">{equipment.type}</span></div>
                <div className="mb-2">Status: <span className="font-semibold capitalize">{equipment.status?.replace(/_/g, " ")}</span></div>
                <div className="mb-2">Location: <span className="font-semibold">{equipment.location}</span></div>
                <div className="mb-2">Assigned To: <span className="font-semibold">{assignedTo}</span></div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p>{equipment.description || <span className="text-gray-400">No description provided.</span>}</p>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Specifications</h2>
                {specifications && specifications.length > 0 ? (
                    <table className="table table-zebra w-full">
                        <tbody>
                            {specifications.map((spec) => (
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
                <h2 className="text-xl font-semibold mb-2">Financial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>Purchase Date: <span className="font-semibold">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : "Not set"}</span></div>
                    <div>Purchase Price: <span className="font-semibold">{equipment.purchase_price ? `$${equipment.purchase_price.toLocaleString()}` : "Not set"}</span></div>
                    <div>Current Value: <span className="font-semibold">{equipment.current_value ? `$${equipment.current_value.toLocaleString()}` : "Not set"}</span></div>
                    <div>Depreciation Rate: <span className="font-semibold">{equipment.purchase_price && equipment.current_value && equipment.purchase_date ? (() => { const ageYears = (Date.now() - new Date(equipment.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25); if (ageYears > 0) { const rate = ((equipment.purchase_price - equipment.current_value) / equipment.purchase_price / ageYears) * 100; return `${rate.toFixed(1)}%/yr`; } return "Not set"; })() : "Not set"}</span></div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Maintenance Records</h2>
                {maintenances && maintenances.length > 0 ? (
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
                            {(maintenances as EquipmentMaintenance[]).map((m) => (
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
                {usages && usages.length > 0 ? (
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Crew</th>
                                <th>Hours Used</th>
                                <th>Fuel Consumed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(usages as EquipmentUsage[]).map((u) => (
                                <tr key={u.id}>
                                    <td>{u.project_id}</td>
                                    <td>{u.crew_id}</td>
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

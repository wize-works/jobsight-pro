import { Equipment } from "@/types/equipment";
import Link from "next/link";
import { useState } from 'react';
import { EquipmentStatus, EquipmentType, EquipmentCondition } from "@/types/equipment";
import { equipmentStatusOptions, equipmentTypeOptions, equipmentConditionOptions } from "@/types/equipment";
import LocationDisplay from "@/components/location-display";
import { useEquipmentUsage, useEquipmentMaintenance } from '@/hooks/use-equipment';

interface EquipmentCardProps {
    equipment: Equipment;
    onEdit?: (equipment: Equipment) => void;
}

// Usage History Modal Component
function UsageHistoryModal({
    equipmentId,
    equipmentName,
    isOpen,
    onClose
}: {
    equipmentId: string;
    equipmentName: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { data: usageRecords, loading } = useEquipmentUsage({ equipment_id: equipmentId });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-base-100 rounded-lg p-6 max-w-4xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Usage History - {equipmentName}</h3>
                    <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
                        <i className="fas fa-times" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {usageRecords.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No usage records found for this equipment.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Project</th>
                                            <th>Hours Used</th>
                                            <th>Operator</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usageRecords.map((usage) => (
                                            <tr key={usage.id}>
                                                <td>{usage.start_date ? new Date(usage.start_date).toLocaleDateString() : 'N/A'}</td>
                                                <td>{usage.project_id || 'N/A'}</td>
                                                <td>{usage.hours_used} hrs</td>
                                                <td>{usage.employee_id || 'N/A'}</td>
                                                <td>{usage.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Maintenance History Modal Component  
function MaintenanceHistoryModal({
    equipmentId,
    equipmentName,
    isOpen,
    onClose
}: {
    equipmentId: string;
    equipmentName: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { data: maintenanceRecords, loading } = useEquipmentMaintenance({ equipment_id: equipmentId });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-base-100 rounded-lg p-6 max-w-4xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Maintenance History - {equipmentName}</h3>
                    <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
                        <i className="fas fa-times" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {maintenanceRecords.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No maintenance records found for this equipment.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Cost</th>
                                            <th>Technician</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {maintenanceRecords.map((maintenance) => (
                                            <tr key={maintenance.id}>
                                                <td>{maintenance.maintenance_date ? new Date(maintenance.maintenance_date).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <span className="badge badge-outline">
                                                        {maintenance.maintenance_type}
                                                    </span>
                                                </td>
                                                <td>{maintenance.description}</td>
                                                <td>{maintenance.cost ? `$${maintenance.cost.toFixed(2)}` : '-'}</td>
                                                <td>{maintenance.performed_by || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge ${maintenance.status === 'completed' ? 'badge-success' :
                                                            maintenance.status === 'in_progress' ? 'badge-warning' :
                                                                'badge-error'
                                                        }`}>
                                                        {maintenance.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export const EquipmentCard = ({ equipment, onEdit }: EquipmentCardProps) => {
    const [showUsageHistory, setShowUsageHistory] = useState(false);
    const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);

    const formatCurrency = (amount: number | undefined | null) => {
        if (!amount) return "$0";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString();
    };

    const getEquipmentInitials = () => {
        return equipment.name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTypeIcon = (type: string | null) => {
        switch (type) {
            case 'heavy': return 'fas fa-truck';
            case 'medium': return 'fas fa-tractor';
            case 'small': return 'fas fa-toolbox';
            case 'tool': return 'fas fa-hammer';
            case 'electronic': return 'fas fa-laptop';
            default: return 'fas fa-cog';
        }
    };

    const getEquipmentAge = () => {
        if (!equipment.year) return null;
        const currentYear = new Date().getFullYear();
        return currentYear - equipment.year;
    };

    const getMaintenanceStatus = () => {
        if (!equipment.next_maintenance) return null;
        const nextMaintenance = new Date(equipment.next_maintenance);
        const today = new Date();
        const daysUntil = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return { status: 'overdue', days: Math.abs(daysUntil) };
        if (daysUntil <= 7) return { status: 'due_soon', days: daysUntil };
        return { status: 'scheduled', days: daysUntil };
    };

    const maintenanceStatus = getMaintenanceStatus();

    return (
        <>
            <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow duration-200">
                <div className="card-body p-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {equipment.image_url ? (
                                <div className="avatar">
                                    <div className="w-14 h-14 rounded-lg bg-base-200">
                                        <img
                                            src={equipment.image_url}
                                            alt={`${equipment.name}`}
                                            className="w-full h-full rounded-lg object-cover"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="avatar avatar-placeholder">
                                    <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <i className={`${getTypeIcon(equipment.type)} text-xl text-accent`} />
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="card-title text-lg font-semibold truncate">{equipment.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    {equipment.type && equipmentTypeOptions.badge(equipment.type as EquipmentType)}
                                    {equipment.year && (
                                        <span className="badge badge-outline badge-sm">{equipment.year}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {equipmentStatusOptions.badge(equipment.status as EquipmentStatus)}
                            {maintenanceStatus && (
                                <div className={`text-xs px-2 py-1 rounded ${maintenanceStatus.status === 'overdue' ? 'bg-error/20 text-error' :
                                    maintenanceStatus.status === 'due_soon' ? 'bg-warning/20 text-warning' :
                                        'bg-info/20 text-info'
                                    }`}>
                                    {maintenanceStatus.status === 'overdue' ? 'Overdue' :
                                        maintenanceStatus.status === 'due_soon' ? 'Due Soon' :
                                            'Scheduled'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Equipment Information */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-industry w-4 text-base-content/60" />
                            {equipment.make ? (
                                <span className="font-medium">{equipment.make}</span>
                            ) : (
                                <span className="text-base-content/50 italic">Make not provided</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-tag w-4 text-base-content/60" />
                            {equipment.model ? (
                                <span className="text-base-content/80">{equipment.model}</span>
                            ) : (
                                <span className="text-base-content/50 italic">Model not provided</span>
                            )}
                        </div>                    <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-barcode w-4 text-base-content/60" />
                            {equipment.serial_number ? (
                                <span className="text-base-content/80 font-mono text-xs">{equipment.serial_number}</span>
                            ) : (
                                <span className="text-base-content/50 italic">Serial number not provided</span>
                            )}
                        </div>

                        {equipment.location && (
                            <LocationDisplay
                                location={equipment.location}
                                compact={true}
                            />
                        )}

                        {equipment.description && (
                            <div className="flex items-start gap-2 text-sm">
                                <i className="fas fa-info-circle w-4 text-base-content/60 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-base-content/60">Description:</span>
                                    <p className="text-base-content/80 text-xs mt-1 line-clamp-2">
                                        {equipment.description}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics Section */}
                    <div className="divider my-3"></div>

                    <div className="stats stats-horizontal w-full mb-4">
                        <div className="stat px-2 py-3">
                            <div className="stat-value text-lg text-primary">{getEquipmentAge() || 'N/A'}</div>
                            <div className="stat-title text-xs">Age (Years)</div>
                        </div>
                        <div className="stat px-2 py-3">
                            <div className="stat-value text-lg text-success">{formatCurrency(equipment.purchase_price)}</div>
                            <div className="stat-title text-xs">Purchase Price</div>
                        </div>
                        <div className="stat px-2 py-3">
                            <div className="stat-value text-lg text-warning">{formatCurrency(equipment.current_value)}</div>
                            <div className="stat-title text-xs">Current Value</div>
                        </div>
                    </div>

                    {/* Maintenance Information */}
                    {equipment.next_maintenance && (
                        <div className={`alert py-2 mb-4 ${maintenanceStatus?.status === 'overdue' ? 'alert-error' :
                            maintenanceStatus?.status === 'due_soon' ? 'alert-warning' :
                                'alert-info'
                            }`}>
                            <i className="fas fa-calendar-alt text-sm" />
                            <div className="text-sm">
                                <div className="font-medium">
                                    Next Maintenance: {formatDate(equipment.next_maintenance)}
                                </div>
                                <div className="text-xs">
                                    {maintenanceStatus?.status === 'overdue'
                                        ? `${maintenanceStatus.days} days overdue`
                                        : maintenanceStatus?.status === 'due_soon'
                                            ? `Due in ${maintenanceStatus.days} days`
                                            : `Scheduled in ${maintenanceStatus?.days} days`
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="card-actions justify-between items-center pt-2">
                        <div className="flex gap-1">
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="View usage history"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUsageHistory(true);
                                }}
                            >
                                <i className="fas fa-chart-line text-sm" />
                            </button>
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="View maintenance history"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMaintenanceHistory(true);
                                }}
                            >
                                <i className="fas fa-wrench text-sm" />
                            </button>
                            {onEdit && (
                                <button
                                    className="btn btn-ghost btn-sm btn-circle"
                                    title="Edit equipment"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(equipment);
                                    }}
                                >
                                    <i className="fas fa-edit text-sm" />
                                </button>
                            )}
                        </div>
                        <Link
                            href={`/dashboard/equipment/${equipment.id}`}
                            className="btn btn-primary btn-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="fas fa-eye mr-1" />
                            View Details
                        </Link>
                    </div>
                </div>
            </div>

            {/* Usage History Modal */}
            <UsageHistoryModal
                equipmentId={equipment.id}
                equipmentName={equipment.name}
                isOpen={showUsageHistory}
                onClose={() => setShowUsageHistory(false)}
            />

            {/* Maintenance History Modal */}
            <MaintenanceHistoryModal
                equipmentId={equipment.id}
                equipmentName={equipment.name}
                isOpen={showMaintenanceHistory}
                onClose={() => setShowMaintenanceHistory(false)}
            />
        </>
    );
}
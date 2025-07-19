/**
 * Rate Management Component
 * Allows setting and managing billing rates for crew members and equipment
 */

'use client';

import { useState, useEffect } from 'react';
import { CrewMember } from '@/types/crew-members';
import { Equipment } from '@/types/equipment';
import { BillingRate, RateValidationResult } from '@/types/invoice-automation';
import { useRateManagement } from '@/hooks/useRateManagement';
import { useBusinessData } from '@/hooks/use-business-data';
import { toast } from '@/hooks/use-toast';

interface RateManagementProps {
    businessId: string;
}

interface CrewMemberWithRate extends CrewMember {
    currentRate?: BillingRate;
}

interface EquipmentWithRate extends Equipment {
    currentRate?: BillingRate;
}

export default function RateManagement({ businessId }: RateManagementProps) {
    const [crewMembers, setCrewMembers] = useState<CrewMemberWithRate[]>([]);
    const [equipment, setEquipment] = useState<EquipmentWithRate[]>([]);
    const [validation, setValidation] = useState<RateValidationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'crew' | 'equipment'>('crew');

    // Use the new rate management hook
    const {
        updateCrewMemberRate,
        getCrewMemberRate,
        updateEquipmentRate,
        getEquipmentRate,
        isLoading: rateLoading,
        error: rateError
    } = useRateManagement();

    // Use the new business data hook
    const {
        getCrewMembers,
        getEquipment,
        isLoading: businessDataLoading,
        error: businessDataError
    } = useBusinessData();

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [businessId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load crew members and equipment using new API endpoints
            const [crewData, equipmentData] = await Promise.all([
                getCrewMembers(businessId),
                getEquipment(businessId)
            ]);

            // Get current rates for each crew member and equipment
            const crewWithRates: CrewMemberWithRate[] = await Promise.all(
                crewData.map(async (cm: CrewMember) => {
                    try {
                        const rate = await getCrewMemberRate(cm.id, businessId);
                        return { ...cm, currentRate: rate };
                    } catch (error) {
                        console.error(`Error getting rate for crew member ${cm.id}:`, error);
                        return { ...cm, currentRate: undefined };
                    }
                })
            );

            const equipmentWithRates: EquipmentWithRate[] = await Promise.all(
                equipmentData.map(async (eq: Equipment) => {
                    try {
                        const rate = await getEquipmentRate(eq.id, businessId);
                        return { ...eq, currentRate: rate };
                    } catch (error) {
                        console.error(`Error getting rate for equipment ${eq.id}:`, error);
                        return { ...eq, currentRate: undefined };
                    }
                })
            );

            setCrewMembers(crewWithRates);
            setEquipment(equipmentWithRates);

            // Calculate validation based on loaded data
            const missingCrewRates = crewWithRates.filter(cm => !cm.currentRate);
            const missingEquipmentRates = equipmentWithRates.filter(eq => !eq.currentRate);

            setValidation({
                isValid: missingCrewRates.length === 0 && missingEquipmentRates.length === 0,
                missingRates: {
                    crewMembers: missingCrewRates.map(cm => cm.id),
                    equipment: missingEquipmentRates.map(eq => eq.id)
                },
                warnings: []
            });

        } catch (error) {
            console.error('Error loading rate data:', error);
            toast.error('Failed to load rate data');
        } finally {
            setLoading(false);
        }
    };

    const handleCrewMemberRateChange = async (crewMemberId: string, rate: BillingRate) => {
        setSaving(true);
        try {
            const result = await updateCrewMemberRate({
                crewMemberId,
                businessId,
                hourlyRate: rate.hourlyRate,
                overtimeRate: rate.overtimeRate
            });

            // Update local state
            setCrewMembers(prev => prev.map(cm =>
                cm.id === crewMemberId ? { ...cm, currentRate: result } : cm
            ));

            // Refresh validation
            const missingCrewRates = crewMembers.filter(cm =>
                cm.id === crewMemberId ? !result : !cm.currentRate
            );
            const missingEquipmentRates = equipment.filter(eq => !eq.currentRate);

            setValidation({
                isValid: missingCrewRates.length === 0 && missingEquipmentRates.length === 0,
                missingRates: {
                    crewMembers: missingCrewRates.map(cm => cm.id),
                    equipment: missingEquipmentRates.map(eq => eq.id)
                },
                warnings: []
            });

            toast.success('Crew member rate updated successfully');
        } catch (error) {
            console.error('Error updating crew member rate:', error);
            toast.error('Failed to update crew member rate');
        } finally {
            setSaving(false);
        }
    };

    const handleEquipmentRateChange = async (equipmentId: string, rate: BillingRate) => {
        setSaving(true);
        try {
            const result = await updateEquipmentRate({
                equipmentId,
                businessId,
                hourlyRate: rate.hourlyRate,
                overtimeRate: rate.overtimeRate
            });

            // Update local state
            setEquipment(prev => prev.map(eq =>
                eq.id === equipmentId ? { ...eq, currentRate: result } : eq
            ));

            // Refresh validation
            const missingCrewRates = crewMembers.filter(cm => !cm.currentRate);
            const missingEquipmentRates = equipment.filter(eq =>
                eq.id === equipmentId ? !result : !eq.currentRate
            );

            setValidation({
                isValid: missingCrewRates.length === 0 && missingEquipmentRates.length === 0,
                missingRates: {
                    crewMembers: missingCrewRates.map(cm => cm.id),
                    equipment: missingEquipmentRates.map(eq => eq.id)
                },
                warnings: []
            });

            toast.success('Equipment rate updated successfully');
        } catch (error) {
            console.error('Error updating equipment rate:', error);
            toast.error('Failed to update equipment rate');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkUpdate = async () => {
        setSaving(true);
        try {
            const crewUpdates = crewMembers
                .filter(cm => cm.currentRate)
                .map(cm => ({
                    crewMemberId: cm.id,
                    businessId,
                    hourlyRate: cm.currentRate!.hourlyRate,
                    overtimeRate: cm.currentRate!.overtimeRate
                }));

            const equipmentUpdates = equipment
                .filter(eq => eq.currentRate)
                .map(eq => ({
                    equipmentId: eq.id,
                    businessId,
                    hourlyRate: eq.currentRate!.hourlyRate,
                    overtimeRate: eq.currentRate!.overtimeRate
                }));

            // Execute all updates
            const updatePromises = [
                ...crewUpdates.map(update => updateCrewMemberRate(update)),
                ...equipmentUpdates.map(update => updateEquipmentRate(update))
            ];

            await Promise.all(updatePromises);

            toast.success('All rates updated successfully!');

            // Refresh validation
            setValidation({
                isValid: true,
                missingRates: { crewMembers: [], equipment: [] },
                warnings: []
            });

        } catch (error) {
            console.error('Error bulk updating rates:', error);
            toast.error('Failed to bulk update rates');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Rate Management</h1>
                    <p className="text-base-content/70 mt-2">
                        Set billing rates for crew members and equipment to enable automated invoicing
                    </p>
                </div>
                <button
                    className="btn btn-primary gap-2"
                    onClick={handleBulkUpdate}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="far fa-save"></i>
                            Save All Changes
                        </>
                    )}
                </button>
            </div>

            {/* Validation Summary */}
            {validation && !validation.isValid && (
                <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-semibold">Missing rates detected</h3>
                        <div className="mt-2 text-sm">
                            {validation.missingRates.crewMembers.length > 0 && (
                                <p><strong>Missing crew member rates:</strong> {validation.missingRates.crewMembers.join(', ')}</p>
                            )}
                            {validation.missingRates.equipment.length > 0 && (
                                <p><strong>Missing equipment rates:</strong> {validation.missingRates.equipment.join(', ')}</p>
                            )}
                        </div>
                        {validation.warnings.length > 0 && (
                            <div className="mt-2 text-sm">
                                {validation.warnings.map((warning, idx) => (
                                    <p key={idx} className="text-warning">⚠️ {warning}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success message when all rates are configured */}
            {validation && validation.isValid && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i>
                    <div>
                        <h3 className="font-semibold">All rates configured</h3>
                        <p className="text-sm mt-1">All crew members and equipment have billing rates set up.</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs tabs-bordered">
                <a
                    className={`tab tab-bordered ${activeTab === 'crew' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('crew')}
                >
                    <i className="far fa-users mr-2"></i>
                    Crew Members ({crewMembers.length})
                </a>
                <a
                    className={`tab tab-bordered ${activeTab === 'equipment' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('equipment')}
                >
                    <i className="far fa-tools mr-2"></i>
                    Equipment ({equipment.length})
                </a>
            </div>

            {/* Tab Content */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-0">
                    {activeTab === 'crew' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <i className="far fa-users text-primary"></i>
                                    Crew Member Rates
                                </h2>
                                <div className="text-sm text-base-content/70">
                                    {crewMembers.filter(cm => cm.is_billable).length} of {crewMembers.length} crew members are billable
                                </div>
                            </div>

                            {crewMembers.length === 0 ? (
                                <div className="text-center py-12">
                                    <i className="far fa-users text-4xl text-base-content/20 mb-4"></i>
                                    <p className="text-base-content/70">No crew members found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Role</th>
                                                <th>Hourly Rate</th>
                                                <th>Overtime Rate</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {crewMembers.map(crewMember => (
                                                <CrewMemberRateRow
                                                    key={crewMember.id}
                                                    crewMember={crewMember}
                                                    onRateChange={handleCrewMemberRateChange}
                                                    saving={saving}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <i className="far fa-tools text-primary"></i>
                                    Equipment Rates
                                </h2>
                                <div className="text-sm text-base-content/70">
                                    {equipment.filter(eq => eq.is_billable).length} of {equipment.length} equipment items are billable
                                </div>
                            </div>

                            {equipment.length === 0 ? (
                                <div className="text-center py-12">
                                    <i className="far fa-tools text-4xl text-base-content/20 mb-4"></i>
                                    <p className="text-base-content/70">No equipment found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Hourly Rate</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {equipment.map(eq => (
                                                <EquipmentRateRow
                                                    key={eq.id}
                                                    equipment={eq}
                                                    onRateChange={handleEquipmentRateChange}
                                                    saving={saving}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface CrewMemberRateRowProps {
    crewMember: CrewMemberWithRate;
    onRateChange: (crewMemberId: string, rate: BillingRate) => void;
    saving: boolean;
}

function CrewMemberRateRow({ crewMember, onRateChange, saving }: CrewMemberRateRowProps) {
    const [hourlyRate, setHourlyRate] = useState(crewMember.currentRate?.hourlyRate || crewMember.hourly_rate || 0);
    const [overtimeRate, setOvertimeRate] = useState(crewMember.currentRate?.overtimeRate || crewMember.overtime_rate || 0);
    const [hasChanges, setHasChanges] = useState(false);

    const handleHourlyRateChange = (value: number) => {
        setHourlyRate(value);
        setHasChanges(true);
    };

    const handleOvertimeRateChange = (value: number) => {
        setOvertimeRate(value);
        setHasChanges(true);
    };

    const handleSave = () => {
        onRateChange(crewMember.id, {
            hourlyRate: hourlyRate,
            overtimeRate: overtimeRate || undefined
        });
        setHasChanges(false);
    };

    return (
        <tr className={crewMember.is_billable ? '' : 'opacity-50'}>
            <td>
                <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                            <span className="text-xs">{crewMember.name.charAt(0)}</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-medium">{crewMember.name}</div>
                        {!crewMember.is_billable && (
                            <div className="text-xs text-base-content/70">Non-billable</div>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <span className="badge badge-ghost badge-sm">{crewMember.role || 'N/A'}</span>
            </td>
            <td>
                <div className="flex items-center gap-1">
                    <span className="text-sm">$</span>
                    <input
                        type="number"
                        className="input input-sm input-bordered w-20"
                        value={hourlyRate}
                        onChange={(e) => handleHourlyRateChange(parseFloat(e.target.value) || 0)}
                        disabled={!crewMember.is_billable}
                        min="0"
                        step="0.01"
                    />
                </div>
            </td>
            <td>
                <div className="flex items-center gap-1">
                    <span className="text-sm">$</span>
                    <input
                        type="number"
                        className="input input-sm input-bordered w-20"
                        value={overtimeRate}
                        onChange={(e) => handleOvertimeRateChange(parseFloat(e.target.value) || 0)}
                        disabled={!crewMember.is_billable}
                        min="0"
                        step="0.01"
                    />
                </div>
            </td>
            <td>
                <span className={`badge ${crewMember.is_billable ? 'badge-success' : 'badge-neutral'}`}>
                    {crewMember.is_billable ? 'Billable' : 'Non-billable'}
                </span>
            </td>
            <td>
                <button
                    className={`btn btn-sm ${hasChanges ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={handleSave}
                    disabled={saving || !crewMember.is_billable || !hasChanges}
                >
                    {saving ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <i className="far fa-save"></i>
                    )}
                </button>
            </td>
        </tr>
    );
}

interface EquipmentRateRowProps {
    equipment: EquipmentWithRate;
    onRateChange: (equipmentId: string, rate: BillingRate) => void;
    saving: boolean;
}

function EquipmentRateRow({ equipment, onRateChange, saving }: EquipmentRateRowProps) {
    const [hourlyRate, setHourlyRate] = useState(equipment.currentRate?.hourlyRate || equipment.hourly_rate || 0);
    const [hasChanges, setHasChanges] = useState(false);

    const handleHourlyRateChange = (value: number) => {
        setHourlyRate(value);
        setHasChanges(true);
    };

    const handleSave = () => {
        onRateChange(equipment.id, {
            hourlyRate: hourlyRate
        });
        setHasChanges(false);
    };

    return (
        <tr className={equipment.is_billable ? '' : 'opacity-50'}>
            <td>
                <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-8 h-8">
                            <span className="text-xs">
                                <i className="far fa-tools"></i>
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="font-medium">{equipment.name}</div>
                        {!equipment.is_billable && (
                            <div className="text-xs text-base-content/70">Non-billable</div>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <span className="badge badge-ghost badge-sm">{equipment.type || 'N/A'}</span>
            </td>
            <td>
                <div className="flex items-center gap-1">
                    <span className="text-sm">$</span>
                    <input
                        type="number"
                        className="input input-sm input-bordered w-20"
                        value={hourlyRate}
                        onChange={(e) => handleHourlyRateChange(parseFloat(e.target.value) || 0)}
                        disabled={!equipment.is_billable}
                        min="0"
                        step="0.01"
                    />
                </div>
            </td>
            <td>
                <span className={`badge ${equipment.is_billable ? 'badge-success' : 'badge-neutral'}`}>
                    {equipment.is_billable ? 'Billable' : 'Non-billable'}
                </span>
            </td>
            <td>
                <button
                    className={`btn btn-sm ${hasChanges ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={handleSave}
                    disabled={saving || !equipment.is_billable || !hasChanges}
                >
                    {saving ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <i className="far fa-save"></i>
                    )}
                </button>
            </td>
        </tr>
    );
}

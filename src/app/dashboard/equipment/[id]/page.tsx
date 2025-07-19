"use client";

import type { Equipment, EquipmentStatus, EquipmentUpdate, EquipmentWithDetails } from "@/types/equipment";
import { equipmentStatusOptions } from "@/types/equipment";
import { maintenanceTypeOptions, type EquipmentMaintenance, type EquipmentMaintenanceType } from "@/types/equipment-maintenance";
import type { EquipmentUsage, EquipmentUsageWithDetails } from "@/types/equipment_usage";
import type { EquipmentAssignment, EquipmentAssignmentWithDetails } from "@/types/equipment-assignments";
import type { EquipmentSpecification } from "@/types/equipment-specifications";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Media, MediaType } from "@/types/media";
import QRCode from "@/components/qrcode";
import { Suspense } from "react";
import UniversalMediaManager from "@/components/universal-media-manager";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import Loading from "@/app/loading";
import { useCurrentPosition } from "@/hooks/use-geolocation";
import ModalLoading from "@/components/modal-loading";
import EquipmentDetailLoading from "./loading";
import LocationDisplay from "@/components/location-display";

// Dynamic imports for modal components
const MaintenanceModal = dynamic(() => import("../components/modal-maintenance").then(mod => ({ default: mod.MaintenanceModal })), {
    loading: () => <ModalLoading message="Loading maintenance form..." />,
});

const AssignmentModal = dynamic(() => import("../components/modal-assignment").then(mod => ({ default: mod.AssignmentModal })), {
    loading: () => <ModalLoading message="Loading assignment form..." />,
});

const UsageModal = dynamic(() => import("../components/modal-usage").then(mod => ({ default: mod.UsageModal })), {
    loading: () => <ModalLoading message="Loading usage form..." />,
});

const EquipmentEditModal = dynamic(() => import("../components/modal-edit"), {
    loading: () => <ModalLoading message="Loading edit form..." />,
});

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId } = useBusiness();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [equipmentData, setEquipmentData] = useState<any>(null);

    // Use the safe geolocation hook
    const {
        position,
        error: geoError,
        refetch: requestLocation
    } = useCurrentPosition();

    const updateLocationFromGPS = async () => {
        requestLocation();

        // Watch for position updates
        if (position) {
            const { latitude, longitude } = position.coords;
            const newLocation = `Lat: ${latitude}, Lon: ${longitude}`;
            setLocation(newLocation);

            try {
                const response = await fetch(`/api/equipment/${equipment?.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        business_id: businessId,
                        location: newLocation
                    })
                });

                const result = await response.json();

                if (result.success) {
                    toast.success("Equipment location has been updated");
                } else {
                    throw new Error(result.error || "Failed to update location");
                }
            } catch (error) {
                console.error("Error updating equipment location:", error);
                toast.error("Failed to update equipment location");
            }
        } else if (geoError) {
            toast.error("Unable to get current location");
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const [activeTab, setActiveTab] = useState("details");
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [showSpecificationModal, setShowSpecificationModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [maintenanceList, setMaintenanceList] = useState<EquipmentMaintenance[]>([]);
    const [usageList, setUsageList] = useState<EquipmentUsageWithDetails[]>([]);
    const [assignmentList, setAssignmentList] = useState<EquipmentAssignmentWithDetails[]>([]);
    const [selectedMaintenance, setSelectedMaintenance] = useState<EquipmentMaintenance | undefined>();
    const [selectedUsage, setSelectedUsage] = useState<EquipmentUsage | undefined>();
    const [selectedAssignment, setSelectedAssignment] = useState<EquipmentAssignment | undefined>();
    const [location, setLocation] = useState<string>("");
    const [equipmentMedia, setEquipmentMedia] = useState<Media[]>([]);
    const [availableMedia, setAvailableMedia] = useState<Media[]>([]);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [equipmentSpecifications, setEquipmentSpecifications] = useState<EquipmentSpecification[]>([]);

    useEffect(() => {
        if (!businessId) {
            return;
        }
        const fetchData = async () => {
            try {
                setLoading(true);
                const { id } = await params;

                // Use API routes to fetch all equipment data
                const [
                    equipmentRes,
                    maintenanceRes,
                    usageRes,
                    assignmentRes,
                    specificationsRes,
                    mediaRes,
                    availableMediaRes
                ] = await Promise.all([
                    fetch(`/api/equipment/${id}?business_id=${businessId}`).then(r => r.json()),
                    fetch(`/api/equipment-maintenance?business_id=${businessId}&equipment_id=${id}`).then(r => r.json()),
                    fetch(`/api/equipment-usage?business_id=${businessId}&equipment_id=${id}`).then(r => r.json()),
                    fetch(`/api/equipment-assignments?business_id=${businessId}&equipment_id=${id}`).then(r => r.json()),
                    fetch(`/api/equipment-specifications?business_id=${businessId}&equipment_id=${id}`).then(r => r.json()),
                    fetch(`/api/media?business_id=${businessId}&equipment_id=${id}`).then(r => r.json()),
                    fetch(`/api/media?business_id=${businessId}&type=available&equipment_id=${id}`).then(r => r.json())
                ]);

                if (equipmentRes.data) {
                    const data = equipmentRes.data;
                    setEquipmentData(data);
                    setEquipment(data);
                    setLocation(data.location || "");

                    // Set related data from API responses
                    setMaintenanceList(maintenanceRes.data || []);
                    setUsageList(usageRes.data || []);
                    setAssignmentList(assignmentRes.data || []);
                    setEquipmentSpecifications(specificationsRes.data || []);
                    setEquipmentMedia(mediaRes.data || []);
                    setAvailableMedia(availableMediaRes.data || []);
                } else {
                    setEquipment(null);
                }
            } catch (error) {
                console.error("Error fetching equipment details:", error);
                setEquipment(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [businessId, params]);

    // Load media data when equipment is available
    useEffect(() => {
        if (equipment?.id && businessId) {
            console.log('Loading media data for equipment:', equipment.id);
            loadMediaData();
        }
    }, [equipment?.id, businessId]);

    // Load media data for UniversalMediaManager
    const loadMediaData = async () => {
        try {
            console.log('loadMediaData called for equipment:', equipment?.id);
            setIsLoadingMedia(true);
            const [linkedRes, availableRes] = await Promise.all([
                fetch(`/api/media?business_id=${businessId}&equipment_id=${equipment?.id || ""}`).then(r => r.json()),
                fetch(`/api/media?business_id=${businessId}&type=available&equipment_id=${equipment?.id || ""}`).then(r => r.json())
            ]);
            console.log('Media data loaded - linked:', linkedRes.data?.length || 0, 'available:', availableRes.data?.length || 0);
            setEquipmentMedia(linkedRes.data || []);
            setAvailableMedia(availableRes.data || []);
        } catch (error) {
            console.error("Error loading equipment media:", error);
            toast.error("Failed to load media data");
        } finally {
            setIsLoadingMedia(false);
        }
    };

    // Universal Media Manager handlers
    const handleMediaUpload = async (
        file: File,
        metadata: { name: string; description: string; type: MediaType }
    ): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('equipment_id', equipment?.id || "");
            formData.append('business_id', businessId);
            formData.append('name', metadata.name);
            formData.append('description', metadata.description);
            formData.append('type', metadata.type);

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                await loadMediaData(); // Refresh data
                toast.success("Media uploaded successfully");
                return true;
            } else {
                throw new Error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Error uploading media:", error);
            toast.error("Failed to upload media");
            return false;
        }
    };

    const handleMediaLink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch('/api/media-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: businessId,
                    media_ids: mediaIds,
                    linked_id: equipment?.id || "",
                    linked_type: "equipment"
                })
            });

            const result = await response.json();

            if (result.success) {
                await loadMediaData(); // Refresh data
                toast.success(`Linked ${mediaIds.length} media item(s)`);
                return { success: true };
            } else {
                throw new Error(result.error || "Link failed");
            }
        } catch (error) {
            console.error("Error linking media:", error);
            const errorMessage = "Failed to link media";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const handleMediaUnlink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            let success = true;
            for (const mediaId of mediaIds) {
                const response = await fetch('/api/media-links', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        business_id: businessId,
                        media_id: mediaId,
                        linked_id: equipment?.id || "",
                        linked_type: "equipment"
                    })
                });

                const result = await response.json();
                if (!result.success) {
                    success = false;
                    break;
                }
            }

            if (success) {
                await loadMediaData(); // Refresh data
                toast.success(`Unlinked ${mediaIds.length} media item(s)`);
                return { success: true };
            } else {
                throw new Error("Unlink failed");
            }
        } catch (error) {
            console.error("Error unlinking media:", error);
            const errorMessage = "Failed to unlink media";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Handle setting primary image
    const handleSetPrimaryImage = async (mediaId: string) => {
        setIsLoadingMedia(true);
        try {
            const response = await fetch('/api/equipment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: businessId,
                    equipment_id: equipment?.id || "",
                    primary_image_id: mediaId
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Primary image updated");
                // Refresh the page to show updated image
                window.location.reload();
            } else {
                throw new Error(result.error || "Failed to set primary image");
            }
        } catch (error) {
            console.error("Error setting primary image:", error);
            toast.error("Failed to set primary image");
        } finally {
            setIsLoadingMedia(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('equipment_id', equipment?.id || "");
            formData.append('business_id', businessId);
            formData.append('type', 'image');

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Equipment image uploaded successfully");

                // Refresh media list and page
                const mediaResponse = await fetch(`/api/media?business_id=${businessId}&equipment_id=${equipment?.id || ""}`);
                const mediaResult = await mediaResponse.json();
                setEquipmentMedia(mediaResult.data || []);
                window.location.reload();
            } else {
                throw new Error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploadingImage(false);
            setShowImageUpload(false);
        }
    };

    const handleAddMaintenance = async (maintenance: EquipmentMaintenance) => {
        // If we're editing, update the existing record
        if (selectedMaintenance) {
            setMaintenanceList(maintenanceList.map((m) =>
                m.id === selectedMaintenance.id ? maintenance : m
            ));
        } else {
            // For new records
            setMaintenanceList([maintenance, ...maintenanceList]);
        }
    };

    const handleAddUsage = async (usage: EquipmentUsage) => {
        // If we're editing, update the existing record
        if (selectedUsage) {
            setUsageList(usageList.map((u) =>
                u.id === selectedUsage.id ? usage : u
            ));
        } else {
            // For new records
            setUsageList([usage, ...usageList]);
        }
    };

    const handleAddAssignment = async (assignment: EquipmentAssignment) => {
        // If we're editing, update the existing record
        if (selectedAssignment) {
            setAssignmentList(assignmentList.map((a) =>
                a.id === selectedAssignment.id ? assignment : a
            ));
        } else {
            // For new records
            setAssignmentList([assignment, ...assignmentList]);
        }
    };

    const handleDeleteAssignment = (id: string) => {
        setAssignmentList(assignmentList.filter((a) => a.id !== id));
    };

    const closeMaintenanceModal = () => {
        setShowMaintenanceModal(false);
        setSelectedMaintenance(undefined);
    };

    const closeUsageModal = () => {
        setShowUsageModal(false);
        setSelectedUsage(undefined);
    };

    const closeAssignmentModal = () => {
        setShowAssignmentModal(false);
        setSelectedAssignment(undefined);
    };

    const handleEditMaintenance = (maintenance: EquipmentMaintenance) => {
        setSelectedMaintenance(maintenance);
        setShowMaintenanceModal(true);
    };

    const handleEditUsage = (usage: EquipmentUsage) => {
        setSelectedUsage(usage);
        setShowUsageModal(true);
    };

    const handleEditAssignment = (assignment: EquipmentAssignment) => {
        setSelectedAssignment(assignment);
        setShowAssignmentModal(true);
    };

    if (!mounted) {
        return <Loading />;
    }

    if (loading) {
        return <EquipmentDetailLoading />;
    }

    if (!equipment) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-4">Equipment Not Found</h2>
                <p className="text-gray-600">The requested equipment could not be found.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/equipment" className="btn btn-outline">
                            <i className="far fa-arrow-left"></i>Back to Equipment
                        </Link>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="btn btn-primary"
                    >
                        <i className="far fa-edit"></i> Edit
                    </button>
                    <Link href={`/printables/equipment/${equipment.id}`} target="_blank" className="btn btn-outline btn-secondary">
                        <i className="far fa-print"></i> Print Details
                    </Link>
                    <button className="btn btn-error hidden" onClick={() => {
                        // Handle delete action here
                        if (confirm("Are you sure you want to delete this equipment?")) {
                            // Call delete function
                        }
                    }}>
                        <i className="far fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-6">
                <div className="flex flex-col gap-6 col-span-1">
                    <div className="card bg-base-100 shadow-lg">
                        <figure className="px-4 pt-4 relative">
                            {equipment.image_url ? (
                                <img src={equipment.image_url || "/default-equipment.png"} alt={equipment.name} className="rounded-xl w-full h-48 object-cover" />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-xl">
                                    <i className="far fa-camera fa-3x text-gray-400"></i>
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-circle btn-sm btn-ghost bg-black/20 hover:bg-black/40 text-white">
                                        <i className="far fa-camera"></i>
                                    </div>
                                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                        <li>
                                            <button
                                                onClick={() => setShowImageUpload(true)}
                                                disabled={isUploadingImage}
                                            >
                                                <i className="far fa-upload mr-2"></i> Upload New Image
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </figure>
                        <div className="card-body">
                            <h1 className="text-2xl font-bold">{equipment.name}</h1>
                            <h2 className="card-title">Current Status</h2>
                            <div className="mb-1 flex justify-between">
                                <span>Status:</span>
                                {equipmentStatusOptions.badge(equipment.status as EquipmentStatus)}
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Type:</span>
                                <span>{equipment.type}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Assigned To:</span>
                                <span>Unassigned</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Next Maintenance:</span>
                                <span>{equipment.next_maintenance || "Not set"}</span>
                            </div>                            {/* Location Section */}
                            <div className="mb-6">
                                <LocationDisplay
                                    location={location}
                                    showUpdateButton={true}
                                    onUpdateLocation={updateLocationFromGPS}
                                />
                            </div>

                            <div className="divider"></div>

                            <h2 className="card-title">Financial</h2>
                            <div className="mb-1 flex justify-between">
                                <span>Purchase Date:</span>
                                <span>{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : "Not set"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Purchase Price:</span>
                                <span>{equipment.purchase_price ? `$${equipment.purchase_price.toLocaleString()}` : "Not set"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Current Value:</span>
                                <span>{equipment.current_value ? `$${equipment.current_value.toLocaleString()}` : "Not set"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Depreciation Rate:</span>
                                <span>{equipment.purchase_price && equipment.current_value && equipment.purchase_date
                                    ? (() => {
                                        const ageYears = (new Date().getTime() - new Date(equipment.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                                        if (ageYears > 0) {
                                            const rate = ((equipment.purchase_price - equipment.current_value) / equipment.purchase_price / ageYears) * 100;
                                            const rateString = rate || rate === null ? `${rate.toFixed(1)}%/yr` : "Not set";
                                            return rateString;
                                        }
                                        return "Not set";
                                    })()
                                    : "Not set"}</span>
                            </div>

                            <div className="divider"></div>

                            <h2 className="card-title">Documents</h2>
                            {equipmentMedia && equipmentMedia.filter((doc) => doc.type === "document").length > 0 ? (
                                <ul className="list-disc pl-5">
                                    {equipmentMedia.filter((doc) => doc.type === "document").map((doc, index) => (
                                        <li key={index} className="mb-1">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {doc.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-gray-500">No documents available.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 col-span-2">
                    {/* Tabs UI */}
                    <div role="tablist" className="tabs tabs-box">
                        <button className={`tab ${activeTab === "details" ? "tab-active" : ""}`} onClick={() => setActiveTab("details")}>Details</button>
                        <button className={`tab ${activeTab === "maintenance" ? "tab-active" : ""}`} onClick={() => setActiveTab("maintenance")}>Maintenance History</button>
                        <button className={`tab ${activeTab === "usage" ? "tab-active" : ""}`} onClick={() => setActiveTab("usage")}>Usage History</button>
                        <button className={`tab ${activeTab === "assignments" ? "tab-active" : ""}`} onClick={() => setActiveTab("assignments")}>Assignments</button>
                        <button className={`tab ${activeTab === "cost" ? "tab-active" : ""}`} onClick={() => setActiveTab("cost")}>Cost Analysis</button>
                        <button className={`tab ${activeTab === "media" ? "tab-active" : ""}`} onClick={() => setActiveTab("media")}>Media</button>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        {/* Tab content */}
                        {activeTab === "details" && (
                            <div className="card-body">
                                <h2 className="font-bold mb-2">Details</h2>
                                <div className="mb-6">Description: {equipment.description}</div>
                                <div className="overflow-x-auto">
                                    <h3 className="font-bold mb-2">Specifications</h3>
                                    <table className="table table-zebra w-full">
                                        <tbody>
                                            {equipmentSpecifications.length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="text-center bg-warning/20">No specification details have been added.</td>
                                                </tr>
                                            )}
                                            {equipmentSpecifications.map((spec) => (
                                                <tr key={spec.id}>
                                                    <td>{spec.name}</td>
                                                    <td>{spec.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-start items-center mt-6">
                                    <div className="bg-base-200 p-4 rounded-lg mt-4 mr-4">
                                        <Suspense fallback={<div>Loading QR Code...</div>}>
                                            <QRCode width={150}
                                                text={`https://pro.jobsight.co/dashboard/equipment/${equipment.id}`}
                                            />
                                        </Suspense>
                                    </div>
                                    <div className="flex flex-col justify-center items-start">
                                        <span>Scan the QR code to view equipment details on your mobile device.</span>
                                        <span className="text-sm text-gray-500 mt-1">You can print the equipment details for your records.</span>
                                        <Link href={`/printables/equipment/${equipment.id}`} target="_blank" className="btn btn-outline btn-primary mt-2">
                                            <i className="far fa-print"></i> Print Details
                                        </Link>
                                        <span className="divider my-2">Or</span>
                                        <span className="text-sm text-gray-500 mt-1">You can also print the QR code to attach to the equipment.</span>
                                        <Link href={`/printables/equipment/${equipment.id}/qr`} className="btn btn-outline btn-sm btn-primary mt-2">
                                            <i className="far fa-qrcode"></i> Print QR Code
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === "maintenance" && (
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold mb-2">Maintenance Records</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowMaintenanceModal(true)}
                                    >
                                        <i className="far fa-plus"></i> Add Maintenance
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra table-sm w-full">
                                        <thead>
                                            <tr className="font-bold">
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Description</th>
                                                <th>Cost</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {maintenanceList.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center bg-warning/20">No maintenance records available.</td>
                                                </tr>
                                            )}
                                            {maintenanceList.map((m) => (
                                                <tr key={m.id}>
                                                    <td>{new Date(m.maintenance_date!).toLocaleDateString()}</td>
                                                    <td>
                                                        {maintenanceTypeOptions.badge(m.maintenance_type as EquipmentMaintenanceType)}
                                                    </td>
                                                    <td>{m.description || "No description"}</td>
                                                    <td>{m.cost ? `$${m.cost.toLocaleString()}` : "Not set"}</td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() => handleEditMaintenance(m)}
                                                            >
                                                                <i className="far fa-edit fa-lg text-secondary"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this maintenance record?")) {
                                                                        setMaintenanceList(maintenanceList.filter((item) => item.id !== m.id));
                                                                    }
                                                                }}
                                                            >
                                                                <i className="far fa-trash fa-lg text-error"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showMaintenanceModal && (
                                    <MaintenanceModal
                                        onClose={closeMaintenanceModal}
                                        onSave={handleAddMaintenance}
                                        maintenance={selectedMaintenance}
                                        isOpen={showMaintenanceModal}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === "usage" && (
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold">Usage Records</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowUsageModal(true)}
                                    >
                                        <i className="far fa-plus"></i> Add Usage
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra table-sm w-full">
                                        <thead>
                                            <tr className="font-bold">
                                                <th>Project</th>
                                                <th>Crew</th>
                                                <th>Start Time</th>
                                                <th>End Time</th>
                                                <th>Hours</th>
                                                <th>Fuel</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usageList.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center bg-warning/20">No usage records available.</td>
                                                </tr>
                                            )}
                                            {usageList.map((u) => (
                                                <tr key={u.id}>
                                                    <td>{u.project_name}</td>
                                                    <td>{u.crew_name}</td>
                                                    <td>{u.start_date ? new Date(u.start_date).toLocaleDateString() : "Not set"}</td>
                                                    <td>{u.end_date ? new Date(u.end_date).toLocaleDateString() : "In progress"}</td>
                                                    <td>{u.hours_used || "Not set"}</td>
                                                    <td>{u.fuel_consumed || "Not set"}</td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() => handleEditUsage(u)}
                                                            >
                                                                <i className="far fa-edit fa-lg text-secondary"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this usage record?")) {
                                                                        setUsageList(usageList.filter((item) => item.id !== u.id));
                                                                    }
                                                                }}
                                                            >
                                                                <i className="far fa-trash fa-lg text-error"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showUsageModal && (
                                    <UsageModal
                                        isOpen={showUsageModal}
                                        onClose={closeUsageModal}
                                        onSave={handleAddUsage}
                                        usage={selectedUsage}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === "assignments" && (
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold">Assignments</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowAssignmentModal(true)}
                                    >
                                        <i className="far fa-plus"></i> Add Assignment
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra table-sm w-full">
                                        <thead>
                                            <tr>
                                                <th>Project</th>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>Crew</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignmentList.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center bg-warning/20">No assignment records available.</td>
                                                </tr>
                                            )}
                                            {assignmentList.map((a) => (
                                                <tr key={a.id}>
                                                    <td>{a.project_name}</td>
                                                    <td>{a.start_date}</td>
                                                    <td>{a.end_date}</td>
                                                    <td>{a.crew_name}</td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => handleEditAssignment(a)}
                                                            >
                                                                <i className="far fa-edit fa-lg text-secondary"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this assignment record?")) {
                                                                        setAssignmentList(assignmentList.filter((item) => item.id !== a.id));
                                                                    }
                                                                }}
                                                            >
                                                                <i className="far fa-trash fa-lg text-error"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showAssignmentModal && (
                                    <AssignmentModal
                                        assignment={selectedAssignment}
                                        onClose={closeAssignmentModal}
                                        onSave={handleAddAssignment}
                                        onDelete={handleDeleteAssignment}
                                        isOpen={showAssignmentModal}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === "cost" && (
                            <div className="card-body">
                                <h2 className="font-bold mb-2">Cost Analysis</h2>
                                <div className="mb-2">
                                    <p>Purchase Price: {equipment.purchase_price ? `$${equipment.purchase_price.toLocaleString()}` : "Not set"}</p>
                                    <p>Current Value: {equipment.current_value ? `$${equipment.current_value.toLocaleString()}` : "Not set"}</p>
                                    <p>Depreciation Rate: {equipment.purchase_price && equipment.current_value && equipment.purchase_date
                                        ? (() => {
                                            const ageYears = (new Date().getTime() - new Date(equipment.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                                            if (ageYears > 0) {
                                                const rate = ((equipment.purchase_price - equipment.current_value) / equipment.purchase_price / ageYears) * 100;
                                                const rateString = rate || rate === null ? `${rate.toFixed(1)}%/yr` : "Not set";
                                                return rateString;
                                            }
                                            return "Not set";
                                        })()
                                        : "Not set"}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">Cost Breakdown</h3>
                                    <ul className="space-y-2">
                                        <li className="flex justify-between">
                                            <span>Maintenance Costs:</span>
                                            <span className="font-semibold">
                                                {maintenanceList.reduce((acc: number, m: any) => acc + (m.cost || 0), 0) > 0
                                                    ? `$${maintenanceList.reduce((acc: number, m: any) => acc + (m.cost || 0), 0).toLocaleString()}`
                                                    : "Not set"}
                                            </span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Usage Costs:</span>
                                            <span className="font-semibold">
                                                {usageList.reduce((acc: number, u: any) => acc + (u.cost || 0), 0) > 0
                                                    ? `$${usageList.reduce((acc: number, u: any) => acc + (u.cost || 0), 0).toLocaleString()}`
                                                    : "Not set"}
                                            </span>
                                        </li>
                                        <li className="flex justify-between border-t pt-2">
                                            <span className="font-semibold">Total Operating Cost:</span>
                                            <span className="font-bold">
                                                {equipment.purchase_price || maintenanceList.length > 0 || usageList.length > 0
                                                    ? `$${((equipment.purchase_price || 0) +
                                                        maintenanceList.reduce((acc: number, m: any) => acc + (m.cost || 0), 0) +
                                                        usageList.reduce((acc: number, u: any) => acc + (u.cost || 0), 0)).toLocaleString()}`
                                                    : "Not set"}
                                            </span>
                                        </li>
                                        {equipment.current_value && (
                                            <li className="flex justify-between">
                                                <span>Current Depreciation:</span>
                                                <span className="font-semibold text-error">
                                                    {equipment.purchase_price
                                                        ? `-$${(equipment.purchase_price - equipment.current_value).toLocaleString()}`
                                                        : "Not set"}
                                                </span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Media Tab */}
                        {activeTab === "media" && (
                            <div className="card-body">
                                <UniversalMediaManager
                                    mode="both"
                                    entityType="equipment"
                                    onUpload={handleMediaUpload}
                                    availableMedia={availableMedia}
                                    linkedMedia={equipmentMedia}
                                    onLink={handleMediaLink}
                                    onUnlink={handleMediaUnlink}
                                    title="Equipment Media"
                                    description="Upload images, videos, documents, and other files related to this equipment."
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Usage Modal */}
            {showUsageModal && (
                <UsageModal
                    isOpen={showUsageModal}
                    usage={selectedUsage}
                    onClose={() => {
                        setShowUsageModal(false);
                        setSelectedUsage(undefined);
                    }}
                    onSave={(usage) => {
                        if (selectedUsage) {
                            setUsageList(usageList.map(m => m.id === usage.id ? usage : m));
                        } else {
                            setUsageList([...usageList, usage]);
                        }
                        setShowUsageModal(false);
                        setSelectedUsage(undefined);
                    }}
                />
            )}

            {/* Image Upload Modal */}
            {showImageUpload && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Upload Equipment Image</h3>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Select an image file</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="file-input file-input-bordered w-full"
                                disabled={isUploadingImage}
                            />
                        </div>
                        {isUploadingImage && (
                            <div className="flex justify-center py-4">
                                <div className="loading loading-spinner loading-md"></div>
                                <span className="ml-2">Uploading...</span>
                            </div>
                        )}
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowImageUpload(false)}
                                disabled={isUploadingImage}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <EquipmentEditModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updatedEquipment) => {
                        // The equipment will be refreshed by the page
                        setShowEditModal(false);
                        window.location.reload(); // Simple refresh for now
                    }}
                    equipment={equipment}
                    specifications={equipmentSpecifications}
                />
            )}
        </div>
    );
}
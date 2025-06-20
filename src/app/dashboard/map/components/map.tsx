"use client";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DivIcon, Icon } from "leaflet";
import { Equipment } from "@/types/equipment";
import type { Project } from "@/types/projects";
import React, { useEffect, useState } from "react";
import { getProjects, setProjectLocation } from "@/app/actions/projects";
import { toast } from "@/hooks/use-toast";
import { set } from "zod";
import { getEquipments, setEquipmentLocation } from "@/app/actions/equipments";
import { useBusiness } from "@/lib/business-context";

const defaultIcon = new DivIcon({
    className: "far fa-map-marker-alt fa-xl",
    html: '<i class="fas fa-map-marker-alt fa-xl"></i>',
    iconSize: [20, 30],
    iconAnchor: [10, 30],
});

const equipmentIcon = new DivIcon({
    className: "text-neutral",
    html: '<i class="fas fa-location-dot fa-3x text-secondary"></i>',
    iconSize: [20, 30],
    iconAnchor: [10, 30],
});

const projectIcon = new DivIcon({
    className: "text-neutral",
    html: '<i class="fas fa-location-dot fa-3x text-accent"></i>',
    iconSize: [20, 30],
    iconAnchor: [10, 30],
});

interface MapComponentProps {
    location: { latitude: number; longitude: number };
}

export default function MapComponent({ location }: MapComponentProps) {
    const { businessId } = useBusiness();
    const [projects, setProjects] = useState<Project[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [markers, setMarkers] = useState<L.LatLng[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null,
    );
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<
        string | null
    >(null);

    useEffect(() => {
        const fetchEquipment = async () => {
            const fetchedEquipment = await getEquipments(businessId);
            setEquipments(fetchedEquipment);
        };
        const fetchProjects = async () => {
            const fetchedProjects = await getProjects(businessId);
            setProjects(fetchedProjects);
        };
        fetchEquipment();
        fetchProjects();
    }, [businessId]);

    function ClickHandler({
        onMapClick,
    }: {
        onMapClick: (latlng: L.LatLng) => void;
    }) {
        useMapEvents({
            click(e) {
                onMapClick(e.latlng);
            },
        });
        return null;
    }

    const handleMapClick = (latlng: L.LatLng) => {
        setMarkers((prev) => [...prev, latlng]);
    };

    return (
        <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            className="z-10"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onMapClick={handleMapClick} />
            <Marker
                position={[location.latitude, location.longitude]}
                icon={defaultIcon}
            />
            {markers.map((marker, index) => (
                <Marker key={index} position={marker} icon={defaultIcon}>
                    <Popup>
                        <div>
                            <h3 className="font-bold">New Marker</h3>
                            <p>
                                Lat: {marker.lat.toFixed(4)}, Lon:{" "}
                                {marker.lng.toFixed(4)}
                            </p>
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="dropdown dropdown-right w-full">
                                    <label
                                        tabIndex={0}
                                        className="btn btn-sm btn-outline w-full"
                                    >
                                        Assign Project{" "}
                                        <i className="far fa-chevron-right"></i>
                                    </label>
                                    <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                if (selectedProjectId) {
                                                    // Corrected setProjectLocation call
                                                    const project =
                                                        await setProjectLocation(
                                                            {
                                                                id: selectedProjectId,
                                                                business_id:
                                                                    businessId,
                                                                location: `Lat: ${marker.lat}, Lon: ${marker.lng}`,
                                                            } as Project,
                                                        );
                                                    if (!project) {
                                                        toast.error(
                                                            "Failed to update project location.",
                                                        );
                                                        return;
                                                    }

                                                    setProjects((prev) =>
                                                        prev.map((p) =>
                                                            p.id === project.id
                                                                ? project
                                                                : p,
                                                        ),
                                                    );
                                                    setMarkers((prev) =>
                                                        prev.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    );
                                                    setSelectedProjectId(null);
                                                    toast.success(
                                                        "Project location updated successfully!",
                                                    );
                                                }
                                            }}
                                        >
                                            <select
                                                className="select select-bordered w-full select-sm "
                                                defaultValue={"select"}
                                                onChange={(e) =>
                                                    setSelectedProjectId(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option
                                                    disabled
                                                    value={"select"}
                                                >
                                                    Select Project
                                                </option>
                                                {(
                                                    projects as unknown as Project[]
                                                ).map((project) => (
                                                    <option
                                                        key={project.id}
                                                        value={project.id}
                                                    >
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-sm w-full mt-2"
                                                disabled={
                                                    !selectedProjectId ||
                                                    selectedProjectId ===
                                                        "select"
                                                }
                                            >
                                                <i className="far fa-check"></i>
                                                Assign Project
                                            </button>
                                        </form>
                                    </div>
                                </div>
                                <div className="dropdown dropdown-right w-full">
                                    <label
                                        tabIndex={0}
                                        className="btn btn-sm btn-outline w-full"
                                    >
                                        Assign Equipment{" "}
                                        <i className="far fa-chevron-right"></i>
                                    </label>
                                    <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                if (selectedEquipmentId) {
                                                    const equipment =
                                                        await setEquipmentLocation(
                                                            businessId,
                                                            {
                                                                id: selectedEquipmentId,
                                                                location: `Lat: ${marker.lat}, Lon: ${marker.lng}`,
                                                            } as Equipment,
                                                        );
                                                    if (!equipment) {
                                                        toast.error(
                                                            "Failed to update equipment location.",
                                                        );
                                                        return;
                                                    }

                                                    setEquipments((prev) =>
                                                        prev.map((p) =>
                                                            p.id ===
                                                            equipment.id
                                                                ? equipment
                                                                : p,
                                                        ),
                                                    );
                                                    setMarkers((prev) =>
                                                        prev.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    );
                                                    setSelectedEquipmentId(
                                                        null,
                                                    );
                                                    toast.success(
                                                        "Equipment location updated successfully!",
                                                    );
                                                }
                                            }}
                                        >
                                            <select
                                                className="select select-bordered w-full select-sm "
                                                defaultValue={"select"}
                                                onChange={(e) =>
                                                    setSelectedEquipmentId(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option
                                                    disabled
                                                    value={"select"}
                                                >
                                                    Select Equipment
                                                </option>
                                                {(
                                                    equipments as unknown as Equipment[]
                                                ).map((equipment) => (
                                                    <option
                                                        key={equipment.id}
                                                        value={equipment.id}
                                                    >
                                                        {equipment.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-sm w-full mt-2"
                                                disabled={
                                                    !selectedEquipmentId ||
                                                    selectedEquipmentId ===
                                                        "select"
                                                }
                                            >
                                                <i className="far fa-check"></i>
                                                Assign Equipment
                                            </button>
                                        </form>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-ghost w-full"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedEquipmentId(null);
                                        setMarkers((prev) =>
                                            prev.filter((_, i) => i !== index),
                                        );
                                    }}
                                >
                                    <i className="far fa-trash"></i> Remove
                                    Marker
                                </button>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {projects.map((project) => {
                const match = project.location?.match(
                    /Lat: ([-\d.]+), Lon: ([-\d.]+)/,
                );
                if (!match) return null;

                const [_, lat, lon] = match;
                return (
                    <Marker
                        key={project.id}
                        position={[parseFloat(lat), parseFloat(lon)]}
                        icon={projectIcon}
                    >
                        <Popup className="custom-popup" maxWidth={280}>
                            <div className="p-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-accent rounded-full"></div>
                                    <h3 className="font-semibold text-base-content truncate">
                                        {project.name}
                                    </h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <i className="far fa-map-marker-alt text-accent w-4"></i>
                                        <span className="text-base-content/70 font-mono text-xs">
                                            {match[1]}, {match[2]}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="far fa-user text-accent w-4"></i>
                                        <span className="text-base-content/70">
                                            Client: {project.client_id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <button className="btn btn-accent btn-xs flex-1">
                                            <i className="far fa-eye"></i>
                                            View Details
                                        </button>
                                        <button className="btn btn-outline btn-xs">
                                            <i className="far fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
            {equipments.map((item) => {
                const match = item.location?.match(
                    /Lat: ([-\d.]+), Lon: ([-\d.]+)/,
                );
                if (!match) return null;

                const [_, lat, lon] = match;
                return (
                    <Marker
                        key={item.id}
                        position={[parseFloat(lat), parseFloat(lon)]}
                        icon={equipmentIcon}
                    >
                        <Popup className="custom-popup" maxWidth={280}>
                            <div className="p-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                                    <h3 className="font-semibold text-base-content truncate">
                                        {item.name}
                                    </h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <i className="far fa-map-marker-alt text-secondary w-4"></i>
                                        <span className="text-base-content/70 font-mono text-xs">
                                            {match[1]}, {match[2]}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="far fa-circle text-secondary w-4"></i>
                                        <span
                                            className={`badge badge-sm ${
                                                item.status === "available"
                                                    ? "badge-success"
                                                    : item.status === "in_use"
                                                      ? "badge-warning"
                                                      : "badge-error"
                                            }`}
                                        >
                                            {item.status?.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="far fa-tools text-secondary w-4"></i>
                                        <span className="text-base-content/70">
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <button className="btn btn-secondary btn-xs flex-1">
                                            <i className="far fa-eye"></i>
                                            View Details
                                        </button>
                                        <button className="btn btn-outline btn-xs">
                                            <i className="far fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

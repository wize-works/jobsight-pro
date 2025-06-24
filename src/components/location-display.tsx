"use client";

import React from "react";
import Link from "next/link";

interface LocationDisplayProps {
    location?: string | null;
    showUpdateButton?: boolean;
    onUpdateLocation?: () => void;
    className?: string;
    compact?: boolean;
}

export default function LocationDisplay({
    location,
    showUpdateButton = false,
    onUpdateLocation,
    className = "",
    compact = false
}: LocationDisplayProps) {
    const hasLocation = location && location !== "No location assigned" && location !== "";

    if (compact && !hasLocation) {
        return null;
    }

    const renderLocationContent = () => {
        if (!hasLocation) {
            return (
                <div className="flex items-center gap-2">
                    <i className="far fa-map-marker-alt text-base-content/40"></i>
                    <span className="text-base-content/50 text-sm">No location assigned</span>
                </div>
            );
        }

        // Check if location is in coordinates format
        const coordinateMatch = location.match(/Lat: ([-\d.]+), Lon: ([-\d.]+)/);

        return (
            <div className="space-y-2">
                {/* Location Info */}
                <div className="flex items-center gap-2">
                    <i className="far fa-map-marker-alt text-primary"></i>
                    <span className="text-sm font-medium">Location</span>
                </div>

                {/* Location Value */}
                <div className="bg-base-200/50 rounded-lg p-2">
                    <div className="text-sm text-base-content/70">
                        {coordinateMatch ? (
                            <div>
                                <div className="font-mono text-xs">
                                    {coordinateMatch[1]}, {coordinateMatch[2]}
                                </div>
                                <div className="text-xs text-base-content/50 mt-0.5">
                                    GPS Coordinates
                                </div>
                            </div>
                        ) : (
                            <div className="break-words">{location}</div>
                        )}
                    </div>
                </div>

                {/* Map Links */}
                {hasLocation && (
                    <div className="flex flex-wrap gap-1">
                        <Link
                            href={`https://maps.apple.com/?q=${location}`}
                            className="btn btn-xs btn-outline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fab fa-apple text-xs"></i>
                            <span className="hidden sm:inline ml-1">Apple Maps</span>
                        </Link>
                        <Link
                            href={`https://google.com/maps/place/${location}`}
                            className="btn btn-xs btn-outline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fab fa-google text-xs"></i>
                            <span className="hidden sm:inline ml-1">Google Maps</span>
                        </Link>
                        {coordinateMatch && (
                            <Link
                                href={(() => {
                                    const [_, lat, lon] = coordinateMatch;
                                    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15&layers=M&marker=color:red|${lat},${lon}`;
                                })()}
                                className="btn btn-xs btn-outline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="far fa-map text-xs"></i>
                                <span className="hidden sm:inline ml-1">OSM</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderCompactContent = () => {
        if (!hasLocation) return null;

        const coordinateMatch = location.match(/Lat: ([-\d.]+), Lon: ([-\d.]+)/);

        return (
            <div className="flex items-center gap-2 text-sm">
                <i className="far fa-map-pin text-primary"></i>
                <span className="text-base-content/70 truncate">
                    {coordinateMatch ?
                        `${coordinateMatch[1]}, ${coordinateMatch[2]}` :
                        location
                    }
                </span>
                {showUpdateButton && onUpdateLocation && (
                    <button className="btn btn-xs btn-secondary ml-2" onClick={onUpdateLocation}>
                        <i className="far fa-location-arrow"></i>
                        <span className="hidden sm:inline ml-1">Update</span>
                    </button>
                )}
            </div>
        );
    };

    if (compact) {
        return (
            <div className={className}>
                {renderCompactContent()}
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            {renderLocationContent()}

            {/* Update Button */}
            {showUpdateButton && onUpdateLocation && (
                <div className="mt-3">
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={onUpdateLocation}
                        type="button"
                    >
                        <i className="far fa-location-arrow mr-1"></i>
                        Update Location
                    </button>
                </div>
            )}
        </div>
    );
}

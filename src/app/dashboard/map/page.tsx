"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCurrentPosition } from "@/hooks/use-geolocation";

// Dynamically import the map component with no SSR
const MapComponent = dynamic(
    () => import("./components/map").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div>Loading map...</div>,
    },
);

export default function MapPage() {
    const [location, setLocation] = useState({ latitude: 0.0, longitude: 0.0 });
    const [isLoaded, setIsLoaded] = useState(false);

    // Use the safe geolocation hook
    const {
        position,
        error: geoError,
        loading: geoLoading
    } = useCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
    });

    useEffect(() => {
        // Only update location when geolocation is complete
        if (!geoLoading) {
            if (position) {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            } else {
                console.error("Error loading map data:", geoError);
                // Set default location if geolocation fails
                setLocation({ latitude: 51.505, longitude: -0.09 }); // London coordinates as fallback
            }
            setIsLoaded(true);
        }
    }, [position, geoError, geoLoading]);

    if (!isLoaded) {
        return (
            <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-base-200">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-base-content/70">
                        Loading map and getting your location...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] w-full relative">
            {/* Map Header */}
            <div className="absolute top-4 left-20 z-50 max-w-50">
                <div className="card bg-base-100/90 backdrop-blur shadow-lg">
                    <div className="card-body p-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <i className="far fa-map text-primary"></i>
                            Site Map
                        </h2>
                        <p className="text-sm text-base-content/70">
                            Click anywhere to add equipment or project locations
                        </p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 z-50">
                <div className="card bg-base-100/90 backdrop-blur shadow-lg">
                    <div className="card-body p-3">
                        <h3 className="text-sm font-semibold mb-2">Legend</h3>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                                <span>Your Location</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-accent rounded-full"></div>
                                <span>Projects</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                                <span>Equipment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                                <span>New Marker</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MapComponent location={location} />
        </div>
    );
}

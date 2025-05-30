'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the map component with no SSR
const MapComponent = dynamic(
    () => import('./components/map').then(mod => mod.default),
    {
        ssr: false,
        loading: () => <div>Loading map...</div>
    }
);


export default function MapPage() {
    const [location, setLocation] = useState({ latitude: 0.00, longitude: 0.00 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get position first
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });

                // Only set loaded when both are done
                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading map data:', error);
                // Set default location if geolocation fails
                setLocation({ latitude: 51.505, longitude: -0.09 }); // London coordinates as fallback
                setIsLoaded(true);
            }
        };

        loadData();
    }, []);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className="h-[calc(100vh-4rem)] w-full">
            <MapComponent location={location} />
        </div>
    );
}
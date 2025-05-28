'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DivIcon, Icon } from 'leaflet';
import { Equipment } from '@/types/equipment';

const defaultIcon = new DivIcon({
    className: 'fas fa -map-marker-alt fa-xl',
    html: '<i class="fas fa-map-marker-alt fa-xl"></i>',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const equipmentIcon = new DivIcon({
    className: 'text-neutral',
    html: '<i class="fas fa-location-dot fa-3x text-secondary"></i>',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface MapComponentProps {
    equipment: Equipment[];
    location: { latitude: number; longitude: number };
}

export default function MapComponent({ equipment, location }: MapComponentProps) {
    return (
        <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {equipment.map((item) => {
                const match = item.location?.match(/Lat: ([-\d.]+), Lon: ([-\d.]+)/);
                if (!match) return null;

                const [_, lat, lon] = match;
                return (
                    <Marker
                        key={item.id}
                        position={[parseFloat(lat), parseFloat(lon)]}
                        icon={equipmentIcon}
                    >
                        <Popup>
                            <div>
                                <h3 className="font-bold">{item.name}</h3>
                                <p>Status: {item.status}</p>
                                <p>Type: {item.type}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
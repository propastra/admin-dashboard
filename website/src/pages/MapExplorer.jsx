import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Maximize, MapPin, Navigation } from 'lucide-react';
import { BiBed } from 'react-icons/bi';
import { getProperties, API_BASE, BACKEND_URL } from '../services/api';
import './MapExplorer.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Premium Marker
const customIcon = new L.Icon({
    iconUrl: '/custom-marker.png',
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60],
    className: 'custom-leaflet-marker'
});

const LocationMarker = ({ properties }) => {
    const map = useMap();
    const navigate = useNavigate();

    useEffect(() => {
        if (properties.length > 0) {
            const bounds = L.latLngBounds(properties.filter(p => p.latitude && p.longitude).map(p => {
                const lat = parseFloat(p.latitude);
                const lon = parseFloat(p.longitude);
                if(isNaN(lat) || isNaN(lon)) return null;
                return [lat, lon];
            }).filter(Boolean));
            
            if (bounds.isValid()) {
                setTimeout(() => {
                    map.invalidateSize();
                    map.fitBounds(bounds, { padding: [50, 50] });
                }, 400); // Give CSS time to settle
            }
        }
    }, [properties, map]);

    return (
        <>
            {properties.map(prop => {
                const lat = parseFloat(prop.latitude);
                const lon = parseFloat(prop.longitude);
                if(isNaN(lat) || isNaN(lon)) return null;
                
                return (
                    <Marker
                        key={prop.id}
                        position={[lat, lon]}
                        icon={customIcon}
                        eventHandlers={{
                            mouseover: (e) => e.target.openPopup(),
                        }}
                    >
                        <Popup className="property-popup">
                            <div className="popup-content" onClick={() => navigate(`/property/${prop.id}`)}>
                                <div className="popup-image">
                                    <img
                                        src={prop.coverPhoto ? (prop.coverPhoto.startsWith('http') ? prop.coverPhoto : `${BACKEND_URL}${prop.coverPhoto.startsWith('/') ? '' : '/'}${prop.coverPhoto}`) : (prop.photos?.[0] ? (prop.photos[0].startsWith('http') ? prop.photos[0] : `${BACKEND_URL}${prop.photos[0].startsWith('/') ? '' : '/'}${prop.photos[0]}`) : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300')}
                                        alt={prop.propertyName}
                                    />
                                    <span className="popup-badge">{prop.category}</span>
                                </div>
                                <div className="popup-details">
                                    <h4>{prop.propertyName}</h4>
                                    <p className="popup-price">
                                        ₹{prop.price} {prop.priceUnit}
                                    </p>
                                    <div className="popup-location">
                                        <MapPin size={10} />
                                        <span>{prop.location}</span>
                                    </div>
                                    <div className="popup-meta">
                                        {prop.configuration && <span><BiBed size={12} /> {prop.configuration}</span>}
                                        <span><Maximize size={12} /> {prop.dimensions}</span>
                                    </div>
                                    <button className="popup-btn">View Details</button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

const MapExplorer = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            const res = await getProperties({ limit: 1000 });
            const allProps = res.data.properties || [];

            // Separate properties with and without coordinates
            let currentProps = allProps.filter(p => p.latitude && p.longitude);
            setProperties(currentProps);
            setLoading(false); // Hide loading spinner so user isn't blocked

            const missing = allProps.filter(p => !p.latitude || !p.longitude);
            if (missing.length > 0) {
                const uniqueLocs = [...new Set(missing.map(p => p.location).filter(Boolean))];

                // Helper: validate the result is actually within India's geographic bounding box
                const isWithinIndia = (lat, lon) =>
                    lat >= 6.0 && lat <= 37.5 && lon >= 68.0 && lon <= 98.0;

                // Geocode a location string using Nominatim with fallback queries
                const geocode = async (loc) => {
                    // Try more specific query first (Karnataka), then broader India
                    const queries = [
                        `${loc}, Karnataka, India`,
                        `${loc}, India`,
                    ];
                    for (const query of queries) {
                        try {
                            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
                            const response = await fetch(geoUrl, {
                                headers: { 'Accept-Language': 'en' }
                            });
                            const data = await response.json();

                            if (data && data.length > 0) {
                                for (const result of data) {
                                    const lat = parseFloat(result.lat);
                                    const lon = parseFloat(result.lon);
                                    // Only accept results that fall within India's bounding box
                                    if (isWithinIndia(lat, lon)) {
                                        return { lat, lon };
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Geocoding query failed:', query, e);
                        }
                        // Respect Nominatim rate limit between queries
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    return null;
                };

                // Fetch coordinates sequentially with delay to respect rate limits
                for (const loc of uniqueLocs) {
                    try {
                        const coords = await geocode(loc);

                        if (coords) {
                            // Apply a tiny jitter so overlapping properties don't stack on same pixel
                            const newlyResolved = missing.filter(p => p.location === loc).map(p => ({
                                ...p,
                                latitude: coords.lat + (Math.random() - 0.5) * 0.005,
                                longitude: coords.lon + (Math.random() - 0.5) * 0.005
                            }));

                            currentProps = [...currentProps, ...newlyResolved];
                            setProperties([...currentProps]);
                        } else {
                            console.warn(`Could not resolve location within India: "${loc}"`);
                        }

                        // Extra delay between each unique location
                        await new Promise(r => setTimeout(r, 1200));
                    } catch (e) {
                        console.error('Geocoding failed for', loc, e);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load map properties:', err);
            setLoading(false);
        }
    };

    return (
        <div className="map-explorer">
            <div className="map-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div className="map-header-title">
                    <h1>Explore Properties</h1>
                    <p>{properties.length} locations found</p>
                </div>
            </div>

            <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                touchZoom={true}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                dragging={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ZoomControl position="bottomright" />
                {!loading && <LocationMarker properties={properties} />}
            </MapContainer>

            {loading && (
                <div className="map-loading">
                    <div className="spinner"></div>
                    <span>Loading Map...</span>
                </div>
            )}

            <div className="map-controls">
                <button className="control-btn" onClick={() => window.location.reload()}>
                    <Navigation size={20} />
                </button>
            </div>
        </div>
    );
};

export default MapExplorer;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

// Custom Cluster Icon Function
const createClusterCustomIcon = (cluster) => {
    return new L.DivIcon({
        html: `
            <div class="custom-cluster-marker">
                <img src="/custom-marker.png" alt="logo" />
                <div class="cluster-count">${cluster.getChildCount()}</div>
            </div>
        `,
        className: 'custom-cluster-base',
        iconSize: L.point(50, 50, true),
    });
};

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
        <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={40}
            spiderfyOnMaxZoom={true}
            iconCreateFunction={createClusterCustomIcon}
        >
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
        </MarkerClusterGroup>
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

            const isWithinIndia = (lat, lon) =>
                lat >= 6.0 && lat <= 37.5 && lon >= 68.0 && lon <= 98.0;
                
            // Heuristic to detect properties that are accidentally placed in the Arabian Sea / Bay of Bengal
            const isInOcean = (lat, lon) => {
                // West Coast (Arabian Sea)
                if (lat < 16.0 && lon < 73.5) return true;
                if (lat < 14.5 && lon < 74.5) return true; // Fix for offshore Mangaluru
                if (lat < 12.5 && lon < 74.8) return true; // Kerala Coast
                if (lat < 10.0 && lon < 76.0) return true;
                // East Coast (Bay of Bengal)
                if (lat < 16.0 && lon > 81.5) return true;
                if (lat < 13.0 && lon > 80.5) return true; // Chennai offshore
                return false;
            };

            let validProps = [];
            let needsGeocoding = [];

            // Pass 1: Categorize properties
            allProps.forEach(p => {
                const lat = parseFloat(p.latitude);
                const lon = parseFloat(p.longitude);
                // IF it's valid, inside India, AND NOT in the ocean, accept it. Otherwise geocode it.
                if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0 && isWithinIndia(lat, lon) && !isInOcean(lat, lon)) {
                    validProps.push({ ...p, latitude: lat, longitude: lon });
                } else {
                    needsGeocoding.push(p);
                }
            });

            // If we have some valid ones, show them immediately
            setProperties([...validProps]);
            setLoading(false);

            if (needsGeocoding.length > 0) {
                const uniqueLocs = [...new Set(needsGeocoding.map(p => p.location).filter(Boolean))];

                const geocode = async (loc) => {
                    const queries = [`${loc}, Karnataka, India`, `${loc}, India`];
                    for (const query of queries) {
                        try {
                            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
                            const response = await fetch(geoUrl, { headers: { 'Accept-Language': 'en' } });
                            const data = await response.json();
                            if (data && data.length > 0) {
                                for (const result of data) {
                                    const rLat = parseFloat(result.lat);
                                    const rLon = parseFloat(result.lon);
                                    if (isWithinIndia(rLat, rLon)) return { lat: rLat, lon: rLon };
                                }
                            }
                        } catch (e) {
                            // ignore errors and try next
                        }
                        await new Promise(r => setTimeout(r, 800)); // Respect limits
                    }
                    return null;
                };

                // Default Bangalore fallback
                const DEFAULT_LAT = 12.9716;
                const DEFAULT_LON = 77.5946;

                for (const loc of uniqueLocs) {
                    let coords = await geocode(loc);
                    if (!coords) {
                        console.warn(`Geocoding failed for ${loc}. Falling back to default.`);
                        coords = { lat: DEFAULT_LAT, lon: DEFAULT_LON };
                    }

                    const newlyResolved = needsGeocoding.filter(p => p.location === loc).map(p => ({
                        ...p,
                        latitude: coords.lat + (Math.random() - 0.5) * 0.02, // Larger jitter for visibility
                        longitude: coords.lon + (Math.random() - 0.5) * 0.02
                    }));

                    validProps = [...validProps, ...newlyResolved];
                    setProperties([...validProps]);
                }
                
                // Final sweep for properties without ANY location string
                const homeless = needsGeocoding.filter(p => !p.location).map(p => ({
                    ...p,
                    latitude: DEFAULT_LAT + (Math.random() - 0.5) * 0.05,
                    longitude: DEFAULT_LON + (Math.random() - 0.5) * 0.05
                }));
                if(homeless.length > 0) {
                    validProps = [...validProps, ...homeless];
                    setProperties([...validProps]);
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

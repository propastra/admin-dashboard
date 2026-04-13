import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Maximize, MapPin, Navigation, Search, X } from 'lucide-react';
import { BiBed } from 'react-icons/bi';
import { getProperties, API_BASE, BACKEND_URL } from '../services/api';
import { useCity } from '../context/CityContext';
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

const MapController = ({ selectedPos }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedPos) {
            map.flyTo([selectedPos.lat, selectedPos.lng], 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [selectedPos, map]);
    return null;
};

const LocationMarker = ({ properties, selectedCity }) => {
    const map = useMap();
    const navigate = useNavigate();
    const prevCity = React.useRef();

    useEffect(() => {
        // Only fit bounds if city changed OR it's the first time
        if (properties.length > 0 && (prevCity.current !== selectedCity)) {
            const validPoints = properties.filter(p => p.lat != null && p.lng != null).map(p => [p.lat, p.lng]);

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints);
                if (bounds.isValid()) {
                    setTimeout(() => {
                        map.invalidateSize();
                        // For a specific city, we zoom in closer. For "All Cities", we fit all.
                        const padding = selectedCity ? [100, 100] : [50, 50];
                        map.fitBounds(bounds, { padding, maxZoom: selectedCity ? 14 : 12 });
                    }, 400);
                }
            }
            prevCity.current = selectedCity;
        }
    }, [properties, map, selectedCity]);

    return (
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50} spiderfyOnMaxZoom={true}>
            {properties.map(prop => {
                if (prop.lat == null || prop.lng == null) return null;

                return (
                    <Marker
                        key={prop.id}
                        position={[prop.lat, prop.lng]}
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
                                    <div className="popup-debug-coords" style={{ fontSize: '10px', color: '#777', padding: '6px 0', borderTop: '1px solid #eee', marginTop: '6px' }}>
                                        <strong>Raw DB Match:</strong><br />
                                        Lat: {prop.lat ? prop.lat.toFixed(5) : 'N/A'}<br />
                                        Lng: {prop.lng ? prop.lng.toFixed(5) : 'N/A'}
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
    const { selectedCity: globalCity } = useCity();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState(
        globalCity && globalCity !== 'Current Location' && globalCity !== 'Your Area' ? globalCity : ''
    );
    const [cities, setCities] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedPos, setSelectedPos] = useState(null);

    useEffect(() => {
        loadProperties();
    }, []);

    // Generate unique city list from properties
    useEffect(() => {
        if (properties.length > 0) {
            const cityCounts = {};
            properties.forEach(p => {
                const city = p.city || "Other";
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            });
            const sortedCities = Object.keys(cityCounts).sort().map(name => ({
                name,
                count: cityCounts[name]
            }));
            setCities(sortedCities);

            // Sync the selectedCity state with the actual data variants if there is a mismatch
            if (globalCity && globalCity !== 'Current Location' && globalCity !== 'Your Area') {
                const normalize = (c) => (c || '').toLowerCase().trim().replace('bengaluru', 'bangalore');
                const exactMatch = sortedCities.find(c => c.name === selectedCity);
                if (!exactMatch) {
                    const aliasFound = sortedCities.find(c => normalize(c.name) === normalize(selectedCity || globalCity));
                    if (aliasFound) {
                        setSelectedCity(aliasFound.name);
                    } else {
                        setSelectedCity(''); // fallback if genuinely no properties
                    }
                }
            }
        }
    }, [properties, globalCity]);

    const filteredProperties = properties.filter(p => {
        const matchesSearch = searchQuery === '' || 
            p.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCity = selectedCity === '' || p.city === selectedCity;
        
        return matchesSearch && matchesCity;
    });

    const loadProperties = async () => {
        try {
            const res = await getProperties({ limit: 1000 });
            const allProps = res.data.properties || [];
            let validProps = [];
            let needsGeocoding = [];

            // Distance calculation helper (Haversine formula in km)
            const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
                const R = 6371; // Radius of the earth in km
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c; 
            };

            // Authoritative Dictionary mapping common regions to core coordinates
            const CITY_CENTERS = {
                'bangalore': { lat: 12.9716, lng: 77.5946 },
                'bengaluru': { lat: 12.9716, lng: 77.5946 },
                'mumbai': { lat: 19.0760, lng: 72.8777 },
                'delhi': { lat: 28.7041, lng: 77.1025 },
                'pune': { lat: 18.5204, lng: 73.8567 },
                'hyderabad': { lat: 17.3850, lng: 78.4867 },
                'dubai': { lat: 25.2048, lng: 55.2708 }
            };

            // Pass 1: Parse and globally validate properties
            allProps.forEach(p => {
                // Instantly log raw backend data to help admins debug underlying database errors
                console.log(`[RAW DB] ${p.propertyName} | LAT: ${p.latitude} | LNG: ${p.longitude}`);

                let lat = parseFloat(p.latitude);
                let lng = parseFloat(p.longitude);

                // Try GeoJSON fallback if raw properties fail
                if ((!lat || !lng) && p.location?.coordinates) {
                    lng = parseFloat(p.location.coordinates[0]);
                    lat = parseFloat(p.location.coordinates[1]);
                }

                // If completely missing, push to Geocoder instantly
                if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
                    needsGeocoding.push(p);
                    return;
                }

                // Mathematical Swap Fallback: Catch explicitly flipped Global Inputs
                if (lat < -90 || lat > 90) {
                    if (lng >= -90 && lng <= 90) {
                        const temp = lat;
                        lat = lng;
                        lng = temp;
                    }
                }

                // Strict Haversine Distance Checker
                // Discards points severely offset (> 100km) from identified host cities.
                let isValidLocation = true;
                const propLocationText = (p.location || p.city || "").toLowerCase();
                
                for (const [cityKey, centerCoords] of Object.entries(CITY_CENTERS)) {
                    if (propLocationText.includes(cityKey)) {
                        const distance = getDistanceFromLatLonInKm(lat, lng, centerCoords.lat, centerCoords.lng);
                        if (distance > 100) {
                            console.warn(`[Map Debug] INVALID DISTANCE: ${p.propertyName} (${cityKey}). Distance: ${Math.round(distance)}km away. Clamping to Geocoder.`);
                            isValidLocation = false;
                        }
                        break;
                    }
                }

                if (!isValidLocation) {
                    needsGeocoding.push(p);
                    return;
                }

                // Final Basic Global Integrity Check
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    validProps.push({ ...p, lat, lng });
                } else {
                    needsGeocoding.push(p);
                }
            });

            setProperties([...validProps]);
            setLoading(false);

            // Pass 2: Handle Discarded/Missing Locations via Geocoding Pipeline
            if (needsGeocoding.length > 0) {
                const uniqueLocs = [...new Set(needsGeocoding.map(p => p.location).filter(Boolean))];

                const geocode = async (loc) => {
                    const queries = [`${loc}`, `${loc}, India`];
                    for (const query of queries) {
                        try {
                            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
                            const response = await fetch(geoUrl, { headers: { 'Accept-Language': 'en' } });
                            const data = await response.json();
                            if (data && data.length > 0) {
                                return {
                                    lat: parseFloat(data[0].lat),
                                    lng: parseFloat(data[0].lon)
                                };
                            }
                        } catch (e) {}
                        await new Promise(r => setTimeout(r, 800)); // Respect OSM limits
                    }
                    return null;
                };

                const DEFAULT_LAT = 12.9716;
                const DEFAULT_LON = 77.5946;

                for (const loc of uniqueLocs) {
                    let coords = await geocode(loc);

                    let locCityCenter = { lat: 12.9716, lng: 77.5946 };
                    if (loc) {
                        for (const [key, val] of Object.entries(CITY_CENTERS)) {
                            if (loc.toLowerCase().includes(key)) {
                                locCityCenter = val;
                                break;
                            }
                        }
                    }

                    if (!coords) {
                        coords = locCityCenter;
                    }

                    // Spread clustered locations slightly apart
                    const newlyResolved = needsGeocoding.filter(p => p.location === loc).map(p => ({
                        ...p,
                        lat: coords.lat + (Math.random() - 0.5) * 0.02,
                        lng: coords.lng + (Math.random() - 0.5) * 0.02
                    }));

                    validProps = [...validProps, ...newlyResolved];
                    setProperties([...validProps]);
                }

                // Final Sweep: Homeless properties (no location string) fall back to default
                const homeless = needsGeocoding.filter(p => !p.location).map(p => ({
                    ...p,
                    lat: DEFAULT_LAT + (Math.random() - 0.5) * 0.05,
                    lng: DEFAULT_LON + (Math.random() - 0.5) * 0.05
                }));
                if (homeless.length > 0) {
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
            <div className="map-search-container">
                <div className="map-search-bar">
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search properties or locations..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                    />
                    {searchQuery && (
                        <button className="clear-btn" onClick={() => setSearchQuery('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <select 
                    className="city-select"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                        <option key={city.name} value={city.name}>
                            {city.name} ({city.count})
                        </option>
                    ))}
                </select>

                {showResults && searchQuery && (
                    <div className="search-results">
                        <div className="results-header">
                            <span>{filteredProperties.length} matches found</span>
                            <button onClick={() => setShowResults(false)}>Close</button>
                        </div>
                        <div className="results-list">
                            {filteredProperties.slice(0, 10).map(prop => (
                                <div 
                                    key={prop.id} 
                                    className="result-item"
                                    onClick={() => {
                                        setSelectedPos({ lat: prop.lat, lng: prop.lng });
                                        setShowResults(false);
                                    }}
                                >
                                    <div className="result-info">
                                        <div className="result-name">{prop.propertyName}</div>
                                        <div className="result-location">{prop.location}</div>
                                    </div>
                                    <div className="result-tag">{prop.category}</div>
                                </div>
                            ))}
                            {filteredProperties.length === 0 && (
                                <div className="no-results">No properties found matching your search.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="map-header-stats desktop-only">
                <p><span>{properties.length}</span> total</p>
                <p><span>{filteredProperties.length}</span> visible</p>
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
            <MapController selectedPos={selectedPos} />
            {!loading && <LocationMarker properties={filteredProperties} selectedCity={selectedCity} />}
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

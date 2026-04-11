import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Maximize, MapPin, Navigation, Search, X } from 'lucide-react';
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

// Custom Cluster Icon - Matches the brand marker
const createCustomClusterIcon = (cluster) => {
    return new L.DivIcon({
        html: `<div class="custom-cluster-marker">
                <img src="/custom-marker.png" alt="cluster" />
                <div class="cluster-badge">
                    <span>${cluster.getChildCount()}</span>
                </div>
              </div>`,
        className: 'custom-cluster-wrapper',
        iconSize: L.point(60, 60, true),
        iconAnchor: [30, 30]
    });
};

const LocationMarker = ({ properties, selectedCity }) => {
    const navigate = useNavigate();
    return (
        <MarkerClusterGroup 
            chunkedLoading 
            maxClusterRadius={40} 
            spiderfyOnMaxZoom={true}
            iconCreateFunction={createCustomClusterIcon}
            showCoverageOnHover={false}
        >
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
                                    <div className="popup-coords" style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace' }}>
                                        {prop.lat.toFixed(6)}, {prop.lng.toFixed(6)}
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

// Component to handle map fitting/zooming
const MapAutoZoom = ({ filteredProperties, selectedCountry, selectedCity }) => {
    const map = useMap();

    useEffect(() => {
        if (filteredProperties.length > 0) {
            const bounds = L.latLngBounds(filteredProperties.map(p => [p.lat, p.lng]));
            
            // If only one property, zoom in closer
            if (filteredProperties.length === 1) {
                map.setView([filteredProperties[0].lat, filteredProperties[0].lng], 14, { animate: true });
            } else {
                // Determine zoom level based on selection type
                let padding = [50, 50];
                if (selectedCity) padding = [100, 100];
                else if (selectedCountry) padding = [60, 60];

                map.fitBounds(bounds, { padding, animate: true, maxZoom: selectedCity ? 12 : 10 });
            }
        }
    }, [selectedCountry, selectedCity, filteredProperties, map]);

    return null;
};

const MapExplorer = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedPos, setSelectedPos] = useState(null);

    const parseLocation = (prop) => {
        // Prioritize explicit values from database if available
        if (prop.country && prop.city) return { country: prop.country, city: prop.city };
        if (prop.country) return { country: prop.country, city: prop.city || 'Other' };
        
        const loc = (prop.location || '').toLowerCase();
        let country = 'India';
        let city = 'Other';
        if (loc.includes('uae') || loc.includes('dubai') || loc.includes('abu dhabi')) country = 'UAE';
        if (loc.includes('dubai')) city = 'Dubai';
        else if (loc.includes('abu dhabi')) city = 'Abu Dhabi';
        else if (loc.includes('sharjah')) city = 'Sharjah';
        else if (loc.includes('bangalore') || loc.includes('bengaluru')) city = 'Bangalore';
        else if (loc.includes('goa')) city = 'Goa';
        else if (loc.includes('mumbai')) city = 'Mumbai';
        else if (loc.includes('pune')) city = 'Pune';
        else if (loc.includes('hyderabad')) city = 'Hyderabad';
        return { country, city };
    };

    useEffect(() => {
        loadProperties();
    }, []);

    useEffect(() => {
        if (properties.length > 0) {
            const countryCounts = {};
            properties.forEach(p => {
                const { country } = parseLocation(p);
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            });
            setCountries(Object.keys(countryCounts).sort().map(name => ({ name, count: countryCounts[name] })));
        }
    }, [properties]);

    useEffect(() => {
        if (properties.length > 0) {
            const cityCounts = {};
            properties.forEach(p => {
                const { country, city } = parseLocation(p);
                if (selectedCountry === '' || country === selectedCountry) {
                    cityCounts[city] = (cityCounts[city] || 0) + 1;
                }
            });
            setCities(Object.keys(cityCounts).sort().map(name => ({ name, count: cityCounts[name] })));
        }
    }, [properties, selectedCountry]);

    const filteredProperties = properties.filter(p => {
        const { country, city } = parseLocation(p);
        const matchesSearch = searchQuery === '' || p.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) || (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCountry = selectedCountry === '' || country === selectedCountry;
        const matchesCity = selectedCity === '' || city === selectedCity;
        return matchesSearch && matchesCountry && matchesCity;
    });

    const loadProperties = async () => {
        try {
            const res = await getProperties({ limit: 1000 });
            const allProps = res.data.properties || [];
            let validProps = [];
            
            // Map to track used positions for jittering
            const posMap = new Map();

            allProps.forEach(p => {
                let lat = parseFloat(p.latitude);
                let lng = parseFloat(p.longitude);
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    const posKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
                    
                    // If position already taken, add a tiny bit of jitter
                    // This creates a "cloud" of markers instead of a single overlapping stack
                    if (posMap.has(posKey)) {
                        const count = posMap.get(posKey);
                        posMap.set(posKey, count + 1);
                        
                        // Jitter intensity (±0.0001 roughly equals ±10 meters)
                        lat += (Math.random() - 0.5) * 0.0002;
                        lng += (Math.random() - 0.5) * 0.0002;
                    } else {
                        posMap.set(posKey, 1);
                    }

                    validProps.push({ ...p, lat, lng });
                }
            });
            setProperties(validProps);
            setLoading(false);
        } catch (err) {
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
                        placeholder="Search projects, locations or countries..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                            // Searching globally: reset specific filters if they might block search results
                            if (e.target.value.length > 2) {
                                // optional: setSelectedCountry(''); 
                                // optional: setSelectedCity('');
                            }
                        }}
                        onFocus={() => setShowResults(true)}
                    />
                    {searchQuery && (
                        <button className="clear-btn" onClick={() => {
                            setSearchQuery('');
                            setSelectedPos(null);
                        }}>
                            <X size={16} />
                        </button>
                    )}
                    {showResults && searchQuery && (
                    <div className="search-results">
                        <div className="results-header">
                            <span>{filteredProperties.length} matches found</span>
                            <button onClick={() => setShowResults(false)}>Close</button>
                        </div>
                        <div className="results-list">
                            {filteredProperties.slice(0, 15).map(prop => (
                                <div 
                                    key={prop.id} 
                                    className="result-item"
                                    onClick={() => {
                                        // Update search query to property name or city for clarity
                                        setSearchQuery(prop.propertyName);
                                        // Trigger the map move
                                        setSelectedPos({ lat: prop.lat, lng: prop.lng });
                                        // Reset filters to ensure this property is visible
                                        const { country, city } = parseLocation(prop);
                                        setSelectedCountry(country);
                                        setSelectedCity(city);
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
                                <div className="no-results">No properties found. Try searching globally.</div>
                            )}
                        </div>
                    </div>
                )}
                </div>

                <div className="map-filters">
                    <select 
                        className="country-select"
                        value={selectedCountry}
                        onChange={(e) => {
                            setSelectedCountry(e.target.value);
                            setSelectedCity('');
                        }}
                    >
                        <option value="">All Countries</option>
                        {countries.map(country => (
                            <option key={country.name} value={country.name}>
                                {country.name} ({country.count})
                            </option>
                        ))}
                    </select>

                    <select 
                        className="city-select"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedCountry && countries.length > 1}
                    >
                        <option value="">{selectedCountry ? `All Cities in ${selectedCountry}` : 'All Cities'}</option>
                        {cities.map(city => (
                            <option key={city.name} value={city.name}>
                                {city.name} ({city.count})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            zoomControl={false}
            className="leaflet-map"
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapAutoZoom 
                filteredProperties={filteredProperties} 
                selectedCountry={selectedCountry} 
                selectedCity={selectedCity} 
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

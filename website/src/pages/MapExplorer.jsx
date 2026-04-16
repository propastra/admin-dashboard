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

const LocationMarker = ({ properties, selectedCity, selectedCountry }) => {
    const map = useMap();
    const navigate = useNavigate();
    const prevCity = React.useRef();
    const prevCountry = React.useRef();

    useEffect(() => {
        // Fit bounds if city OR country changed OR it's the first time
        if (properties.length > 0 && (prevCity.current !== selectedCity || prevCountry.current !== selectedCountry)) {
            const validPoints = properties.filter(p => p.lat != null && p.lng != null).map(p => [p.lat, p.lng]);

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints);
                if (bounds.isValid()) {
                    setTimeout(() => {
                        map.invalidateSize();
                        // Dynamic zoom level: Closer for city, wider for country, widest for all
                        let zoomOptions = { padding: [50, 50], maxZoom: 12 };
                        
                        if (selectedCity) {
                            zoomOptions = { padding: [100, 100], maxZoom: 14 };
                        } else if (selectedCountry) {
                            zoomOptions = { padding: [80, 80], maxZoom: 11 };
                        }
                        
                        map.fitBounds(bounds, zoomOptions);
                    }, 400);
                }
            }
            prevCity.current = selectedCity;
            prevCountry.current = selectedCountry;
        }
    }, [properties, map, selectedCity, selectedCountry]);

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
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState(
        globalCity && globalCity !== 'Current Location' && globalCity !== 'Your Area' ? globalCity : ''
    );
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedPos, setSelectedPos] = useState(null);

    // Frontend Helper for Dynamic Location Detection
    const getLocationMeta = (prop) => {
        // Priority 1: Explicit fields
        let city = prop.city;
        let country = prop.country;

        // Total fallback: Detect from location string
        const loc = (prop.location || "").toLowerCase();
        
        // Comprehensive Keywords
        const indiaKeywords = ['india', 'bangalore', 'bengaluru', 'goa', 'mumbai', 'pune', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'gurgaon', 'noida', 'ahmedabad', 'karnataka', 'maharashtra', 'sarjapur', 'whitefield', 'yelahanka', 'devanahalli', 'bicholim', 'doddaballapur', 'rajanukunte', 'rayasandra', 'jigani', 'electronic city', 'anekal'];
        const uaeKeywords = ['uae', 'dubai', 'emirates', 'abu dhabi', 'abudhabi', 'sharjah', 'ajman', 'rak', 'fujairah', 'quran', 'marina', 'jumeirah', 'downtown', 'business bay', 'palm', 'creek', 'ghadeer'];

        const isIndia = loc.includes('india') || indiaKeywords.some(k => loc.includes(k));
        const isUAE = loc.includes('uae') || uaeKeywords.some(k => loc.includes(k));

        // 1. Detect Country
        if (!country) {
            if (isUAE) country = 'UAE';
            else if (isIndia) country = 'India';
            else {
                // Coordinate-based fallback for properties with no/inconsistent location string
                const lat = parseFloat(prop.lat || prop.latitude);
                const lng = parseFloat(prop.lng || prop.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    // India Bounding Box approx
                    if (lat > 8 && lat < 38 && lng > 68 && lng < 98) country = 'India';
                    // UAE Bounding Box approx
                    else if (lat > 22 && lat < 26 && lng > 51 && lng < 57) country = 'UAE';
                    else country = 'Other';
                } else {
                    country = 'Other';
                }
            }
        }

        // 2. Detect City based on Keywords if missing
        if (!city || city === 'Other') {
            if (country === 'India') {
                if (loc.includes('goa') || loc.includes('bicholim')) city = 'Goa';
                else if (loc.includes('mumbai')) city = 'Mumbai';
                else if (loc.includes('pune')) city = 'Pune';
                else if (loc.includes('delhi') || loc.includes('noida') || loc.includes('gurgaon')) city = 'Delhi/NCR';
                else if (loc.includes('hyderabad')) city = 'Hyderabad';
                else if (loc.includes('chennai')) city = 'Chennai';
                else if (loc.includes('kolkata')) city = 'Kolkata';
                else if (loc.includes('ahmedabad')) city = 'Ahmedabad';
                else if (['bangalore', 'bengaluru', 'sarjapur', 'whitefield', 'yelahanka', 'devanahalli', 'jigani', 'doddaballapur', 'rajanukunte', 'rayasandra', 'electronic city', 'anekal', 'rr nagar', 'kengeri', 'hosakote', 'hebbal', 'kannamangala', 'varthur', 'bannerghatta', 'yadavanahalli', 'attibele', 'bellary road', 'gangasandra', 'kanakapura', 'bagalur'].some(k => loc.includes(k))) city = 'Bangalore';
                else city = 'Other';
            } else if (country === 'UAE') {
                if (loc.includes('abu dhabi') || loc.includes('abudhabi') || loc.includes('ghadeer')) city = 'Abu Dhabi';
                else if (loc.includes('sharjah')) city = 'Sharjah';
                else if (loc.includes('ajman')) city = 'Ajman';
                else if (uaeKeywords.some(k => loc.includes(k))) city = 'Dubai'; // Default for most UAE properties in this DB
                else city = 'Other';
            } else {
                city = 'Other';
            }
        }

        // Normalization
        if (city === 'Bengaluru') city = 'Bangalore';
        if (city === 'Abudhabi') city = 'Abu Dhabi';
        
        return { 
            country: country || 'Other', 
            city: city || 'Other' 
        };
    };

    useEffect(() => {
        loadProperties();
    }, []);
    // Generate unique hierarchy list from properties
    useEffect(() => {
        if (properties.length > 0) {
            const countryMap = {}; // { countryName: { count: N, cities: { cityName: count } } }

            properties.forEach(p => {
                const { country, city } = getLocationMeta(p);
                
                if (!countryMap[country]) {
                    countryMap[country] = { count: 0, cities: {} };
                }
                countryMap[country].count++;
                
                if (!countryMap[country].cities[city]) {
                    countryMap[country].cities[city] = 0;
                }
                countryMap[country].cities[city]++;
            });

            const sortedCountries = Object.entries(countryMap)
                .map(([name, data]) => ({
                    name,
                    count: data.count,
                    cities: Object.entries(data.cities)
                        .map(([cityName, cityCount]) => ({ name: cityName, count: cityCount }))
                        .sort((a, b) => b.count - a.count)
                }))
                .sort((a, b) => b.count - a.count);

            setCountries(sortedCountries);

            // Sync global city to country if needed
            if (globalCity && !selectedCountry && globalCity !== 'Current Location') {
                const match = sortedCountries.find(c => c.cities.some(ct => ct.name.toLowerCase() === globalCity.toLowerCase() || (ct.name === 'Bangalore' && globalCity.toLowerCase() === 'bengaluru')));
                if (match) {
                    setSelectedCountry(match.name);
                    // Ensure the selected city string matches exactly what's in our data
                    const cityMatch = match.cities.find(ct => ct.name.toLowerCase() === globalCity.toLowerCase() || (ct.name === 'Bangalore' && globalCity.toLowerCase() === 'bengaluru'));
                    if (cityMatch) setSelectedCity(cityMatch.name);
                }
            }
        }
    }, [properties, globalCity]);

    // Derive cities list for the selected country
    useEffect(() => {
        if (selectedCountry) {
            const countryData = countries.find(c => c.name === selectedCountry);
            setCities(countryData ? countryData.cities : []);
            
            // If current city doesn't belong to this country, reset it
            if (selectedCity && countryData && !countryData.cities.some(c => c.name === selectedCity)) {
                setSelectedCity('');
            }
        } else {
            setCities([]);
            setSelectedCity('');
        }
    }, [selectedCountry, countries]);


    const filteredProperties = properties.filter(p => {
        const { country, city } = getLocationMeta(p);
        
        const matchesSearch = searchQuery === '' || 
            p.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCountry = selectedCountry === '' || country === selectedCountry;
        const matchesCity = selectedCity === '' || city === selectedCity;
        
        return matchesSearch && matchesCountry && matchesCity;
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
                            const geoUrl = `/nominatim/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
                            const response = await fetch(geoUrl);
                            
                            if (response.status === 429) {
                                console.warn("Geocoding rate limit hit. Aborted background resolution.");
                                return { error: 'rate-limit' };
                            }

                            const data = await response.json();
                            if (data && data.length > 0) {
                                // Important: We still wait after success to respect OSM's policy for the NEXT location
                                await new Promise(r => setTimeout(r, 1200)); 
                                return {
                                    lat: parseFloat(data[0].lat),
                                    lng: parseFloat(data[0].lon)
                                };
                            }
                        } catch (e) {
                            console.error("Geocoding fetch failed:", e);
                        }
                        await new Promise(r => setTimeout(r, 1000)); // Respect OSM limits
                    }
                    return null;
                };

                const DEFAULT_LAT = 12.9716;
                const DEFAULT_LON = 77.5946;
                let rateLimitHit = false;

                for (const loc of uniqueLocs) {
                    if (rateLimitHit) {
                        // If we hit a rate limit, use local fallback center for the rest
                        updateRemainingWithFallback(loc);
                        continue;
                    }

                    let coords = await geocode(loc);

                    if (coords?.error === 'rate-limit') {
                        rateLimitHit = true;
                        updateRemainingWithFallback(loc);
                        continue;
                    }

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

                function updateRemainingWithFallback(loc) {
                    let locCityCenter = { lat: 12.9716, lng: 77.5946 };
                    if (loc) {
                        for (const [key, val] of Object.entries(CITY_CENTERS)) {
                            if (loc.toLowerCase().includes(key)) {
                                locCityCenter = val;
                                break;
                            }
                        }
                    }
                    const fallenBack = needsGeocoding.filter(p => p.location === loc).map(p => ({
                        ...p,
                        lat: locCityCenter.lat + (Math.random() - 0.5) * 0.05,
                        lng: locCityCenter.lng + (Math.random() - 0.5) * 0.05
                    }));
                    validProps = [...validProps, ...fallenBack];
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
                    className="country-select"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
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
                    disabled={!selectedCountry && countries.length > 0}
                >
                    <option value="">{selectedCountry ? 'All Cities' : 'Select Country First'}</option>
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
            {!loading && <LocationMarker properties={filteredProperties} selectedCity={selectedCity} selectedCountry={selectedCountry} />}
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

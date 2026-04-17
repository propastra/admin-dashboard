import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, MapPin, Landmark, Building, Hotel, TreePalm, Navigation } from 'lucide-react';
import { getCities } from '../services/api';
import { useCity } from '../context/CityContext';
import './CitySelect.css';

const defaultCities = [
    { name: 'Bangalore', icon: Building2 },
    { name: 'Delhi', icon: Landmark },
    { name: 'Mumbai', icon: Building },
    { name: 'Hyderabad', icon: MapPin },
    { name: 'Chennai', icon: Building2 },
    { name: 'Pune', icon: MapPin },
    { name: 'Jaipur', icon: Landmark },
    { name: 'Goa', icon: TreePalm },
    { name: 'Kerala', icon: TreePalm },
    { name: 'Gujarat', icon: Building },
    { name: 'Amritsar', icon: Landmark },
    { name: 'Dubai', icon: Building2 },
];

const CitySelect = () => {
    const navigate = useNavigate();
    const { setSelectedCity } = useCity();
    const [searchQuery, setSearchQuery] = useState('');
    const [apiCities, setApiCities] = useState([]);
    const [detecting, setDetecting] = useState(false);
    const [locationError, setLocationError] = useState('');

    useEffect(() => {
        const loadCities = async () => {
            try {
                const res = await getCities();
                setApiCities(res.data);
            } catch (err) {
                console.error('Failed to load cities:', err);
            }
        };
        loadCities();
    }, []);

    const allCities = defaultCities.map((dc) => {
        const apiCity = apiCities.find(
            (ac) => ac.name.toLowerCase().includes(dc.name.toLowerCase())
        );
        return { ...dc, propertyCount: apiCity?.propertyCount || 0 };
    });

    const filtered = allCities.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCityClick = (cityName) => {
        setSelectedCity(cityName);
        const returnTab = new URLSearchParams(window.location.search).get('returnTab');
        navigate(returnTab ? `/?tab=${returnTab}` : '/');
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const addr = data.address || {};
            return addr.city || addr.town || addr.county || addr.state_district || addr.state || null;
        } catch {
            return null;
        }
    };

    const matchCity = (detectedName) => {
        if (!detectedName) return null;
        const lower = detectedName.toLowerCase();
        const match = allCities.find(c =>
            lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower)
        );
        return match ? match.name : null;
    };

    const handleDetectLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationError('Geolocation is not supported by your browser. Please select a city below.');
            return;
        }

        setDetecting(true);
        setLocationError('');

        const finish = (cityName) => {
            setSelectedCity(cityName);
            setDetecting(false);
            const returnTab = new URLSearchParams(window.location.search).get('returnTab');
            navigate(returnTab ? `/?tab=${returnTab}` : '/');
        };

        const onSuccess = async (position) => {
            const { latitude, longitude } = position.coords;
            const rawCity = await reverseGeocode(latitude, longitude);
            const matched = matchCity(rawCity);
            finish(matched || 'Current Location');
        };

        const onErrorFinal = () => {
            setDetecting(false);
            setLocationError('Location detection timed out. Please select a city manually.');
        };

        const onError = (error) => {
            if (error.code === 1) {
                setDetecting(false);
                setLocationError('Location permission denied. Please allow access in your browser settings, or select a city below.');
            } else {
                // Timeout or unavailable — retry with low accuracy
                navigator.geolocation.getCurrentPosition(onSuccess, onErrorFinal, {
                    timeout: 15000, enableHighAccuracy: false, maximumAge: 60000,
                });
            }
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            timeout: 10000, enableHighAccuracy: false, maximumAge: 30000,
        });
    };

    return (
        <div className="city-select-page">
            <div className="city-select-container">
                <h1 className="city-title">Choose your city</h1>
                <p className="city-subtitle">to explore homes</p>

                <div className="city-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="city-detect-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <button
                        className="btn btn-accent detect-btn"
                        onClick={handleDetectLocation}
                        disabled={detecting}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', width: '100%', justifyContent: 'center' }}
                    >
                        {detecting ? (
                            <><div className="spinner-small" style={{ borderColor: 'white', borderRightColor: 'transparent', width: '16px', height: '16px', borderWidth: '2px' }}></div> Detecting...</>
                        ) : (
                            <><Navigation size={18} /> Detect My Location</>
                        )}
                    </button>
                    {locationError && (
                        <p style={{ marginTop: '10px', fontSize: '13px', color: '#ef4444', textAlign: 'center', lineHeight: '1.5' }}>
                            ⚠️ {locationError}
                        </p>
                    )}
                </div>

                <div className="city-grid">
                    {filtered.map((city) => {
                        const IconComp = city.icon;
                        return (
                            <button
                                key={city.name}
                                className="city-card"
                                onClick={() => handleCityClick(city.name)}
                            >
                                <div className="city-icon-wrapper">
                                    <IconComp size={28} />
                                </div>
                                <span className="city-name">{city.name}</span>

                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CitySelect;

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
];

const CitySelect = () => {
    const navigate = useNavigate();
    const { setSelectedCity } = useCity();
    const [searchQuery, setSearchQuery] = useState('');
    const [apiCities, setApiCities] = useState([]);
    const [detecting, setDetecting] = useState(false);

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
        navigate('/');
    };

    const handleDetectLocation = () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            () => {
                // Once permission is granted and coords retrieved, just set generic context and let Home handle the map load
                setSelectedCity("Current Location");
                setDetecting(false);
                navigate('/');
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
                alert("Failed to get location. Please select a city manually.");
                setDetecting(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
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

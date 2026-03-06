import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, User, ChevronRight, ArrowRight } from 'lucide-react';
import { getFeaturedProperties, getProperties, getCities, getFavorites, trackInteraction } from '../services/api';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import './Home.css';

const categories = ['Buy', 'Rent', 'Sell', 'Invest'];

const Home = () => {
    const navigate = useNavigate();
    const { selectedCity, setSelectedCity } = useCity();
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [nearbyProperties, setNearbyProperties] = useState([]);
    const [nearbyCategory, setNearbyCategory] = useState('All');
    const [cities, setCities] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [activeCategory, setActiveCategory] = useState('Buy');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingNearby, setLoadingNearby] = useState(false);

    // Live Location States
    const [userCoords, setUserCoords] = useState(null);
    const [displayCity, setDisplayCity] = useState('');

    useEffect(() => {
        loadData();
        trackInteraction({
            interactionType: 'View',
            ipAddress: 'website-user',
            userAgent: navigator.userAgent,
            metadata: { page: 'home', city: selectedCity }
        }).catch(() => { });
    }, []);

    useEffect(() => {
        // Auto-detect location if not already manually set
        if (!selectedCity || selectedCity === "Current Location") {
            detectLocation();
            loadData("Current Location");
        } else {
            setDisplayCity(selectedCity);
            setUserCoords(null);
            loadData(selectedCity);
            loadNearbyProperties(selectedCity);
        }
    }, [selectedCity]);

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                console.log('GPS Detected:', latitude, longitude);

                setUserCoords({ lat: latitude, lng: longitude });

                // Fetch properties by GPS coordinates immediately
                loadNearbyProperties(null, latitude, longitude);
                loadData("Current Location");

                try {
                    // Pre-set generic location so home page doesn't break
                    setDisplayCity("Your Area");
                    setSelectedCity("Current Location");

                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await response.json();
                    const city = data.city || data.locality || "Current Location";
                    if (city) setDisplayCity(city);
                } catch (error) {
                    console.error('Reverse geocode error:', error);
                    // Leave it as "Your Area"
                }
            }, (error) => {
                console.warn('Geolocation error:', error.message);
                if (selectedCity && selectedCity !== "Current Location") {
                    loadNearbyProperties(selectedCity);
                    loadData(selectedCity);
                    setDisplayCity(selectedCity);
                }
            }, { enableHighAccuracy: true });
        }
    };

    // Load user's favorites when logged in
    useEffect(() => {
        if (user) {
            loadFavorites();
        } else {
            setFavoriteIds(new Set());
        }
    }, [user]);

    const loadData = async (city = selectedCity) => {
        setLoading(true);
        try {
            const actualCity = city === "Current Location" || city === "Your Area" || !city ? '' : city;
            const [propRes, cityRes] = await Promise.all([
                getFeaturedProperties(actualCity),
                getCities(),
            ]);
            setProperties(propRes.data);
            setCities(cityRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadNearbyProperties = async (city, lat = null, lng = null, category = 'All') => {
        setLoadingNearby(true);
        try {
            const params = { limit: 6 };
            if (lat && lng) {
                params.lat = lat;
                params.lng = lng;
                params.radius = 30; // 30km radius
            } else if (city) {
                params.city = city;
            }

            if (category !== 'All') {
                params.category = category;
            }

            const res = await getProperties(params);

            // If we have user coordinates, calculate distance for labeling
            let props = res.data.properties;
            if (lat && lng) {
                props = props.map(p => {
                    const dist = calculateDistance(lat, lng, p.latitude, p.longitude);
                    return {
                        ...p,
                        distance: dist !== null ? dist.toFixed(1) : null
                    };
                });
            }

            setNearbyProperties(props);
        } catch (err) {
            console.error('Failed to load nearby properties:', err);
        } finally {
            setLoadingNearby(false);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat2 || !lon2) return null;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const loadFavorites = async () => {
        try {
            const res = await getFavorites();
            const ids = new Set(res.data.map(f => f.Property?.id).filter(Boolean));
            setFavoriteIds(ids);
        } catch (err) {
            console.error('Failed to load favorites:', err);
        }
    };

    const handleFavoriteToggle = (propertyId) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (next.has(propertyId)) {
                next.delete(propertyId);
            } else {
                next.add(propertyId);
            }
            return next;
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="home-page">
            {/* Hero Section with branded gradient */}
            <div className="home-hero">
                <div className="home-hero-content">
                    <header className="home-header">
                        <div className="home-header-left" onClick={() => navigate('/city')}>
                            <div className="location-icon-wrap">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <span className="location-label">Location</span>
                                <span className="location-city">{displayCity || selectedCity || 'Select City'} <ChevronRight size={14} /></span>
                            </div>
                        </div>
                        <div className="home-header-right">
                            <button
                                className="avatar-btn"
                                onClick={() => navigate(user ? '/profile' : '/auth')}
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="user-avatar-img" />
                                ) : (
                                    user ? user.name?.charAt(0).toUpperCase() : <User size={20} />
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Hero Text */}
                    <div className="hero-text">
                        <h1>Find Your <span className="hero-highlight">Dream Home</span></h1>
                        <p>Explore premium properties across India's top cities</p>
                    </div>

                    {/* Search Bar */}
                    <form className="home-search" onSubmit={handleSearch}>
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by location, project or property..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="button" className="map-btn" onClick={() => navigate('/map')}>
                            <MapPin size={18} />
                        </button>
                        <button type="button" className="filter-btn" onClick={() => navigate('/search')}>
                            <SlidersHorizontal size={18} />
                        </button>
                    </form>
                </div>

                {/* Decorative elements */}
                <div className="hero-decor hero-decor-1"></div>
                <div className="hero-decor hero-decor-2"></div>
            </div>

            {/* Category Tabs */}
            <div className="home-body">
                <div className="category-tabs">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Properties Near You - Dynamic Section */}
                {(selectedCity || userCoords) && (
                    <section className="home-section animate-section">
                        <div className="section-header">
                            <h2>Properties in <span className="hero-highlight">{displayCity || selectedCity}</span></h2>
                            <a className="see-all" onClick={() => navigate((displayCity || selectedCity) === "Your Area" ? '/search' : `/search?city=${displayCity || selectedCity}`)}>
                                See all <ArrowRight size={16} />
                            </a>
                        </div>

                        {/* Sub-category Filter for Nearby */}
                        <div className="nearby-filters">
                            {['All', 'Villa', 'Plot', 'Commercial'].map(cat => (
                                <button
                                    key={cat}
                                    className={`nearby-filter-chip ${nearbyCategory === cat ? 'active' : ''}`}
                                    onClick={() => {
                                        setNearbyCategory(cat);
                                        if (userCoords) {
                                            loadNearbyProperties(null, userCoords.lat, userCoords.lng, cat);
                                        } else {
                                            loadNearbyProperties(selectedCity, null, null, cat);
                                        }
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {loadingNearby ? (
                            <div className="loading-scroll"><div className="spinner-small"></div></div>
                        ) : nearbyProperties.length > 0 ? (
                            <div className="property-scroll">
                                {nearbyProperties.map((prop, index) => (
                                    <div key={prop.id} className="property-scroll-item" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <PropertyCard
                                            property={prop}
                                            isFavorited={favoriteIds.has(prop.id)}
                                            onFavoriteToggle={handleFavoriteToggle}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-small">
                                <p>No properties found in {displayCity || selectedCity} yet.</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Featured Estates */}
                <section className="home-section animate-section">
                    <div className="section-header">
                        <h2>Featured Estates</h2>
                        <a className="see-all" onClick={() => navigate('/search')}>
                            See all <ArrowRight size={16} />
                        </a>
                    </div>

                    {loading ? (
                        <div className="loading-screen"><div className="spinner"></div></div>
                    ) : properties.length > 0 ? (
                        <div className="property-scroll">
                            {properties.map((prop, index) => (
                                <div key={prop.id} className="property-scroll-item" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <PropertyCard
                                        property={prop}
                                        isFavorited={favoriteIds.has(prop.id)}
                                        onFavoriteToggle={handleFavoriteToggle}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🏠</div>
                            <p>No properties available yet</p>
                            <span>Check back soon for amazing listings!</span>
                        </div>
                    )}
                </section>

                {/* CTA Banner - Moved here as requested */}
                <div className="home-cta-banner" style={{ marginTop: '12px', marginBottom: '32px' }}>
                    <div className="cta-banner-content">
                        <h2>Don't hesitate to call us</h2>
                        <p>Our experts are ready to help you find your dream home</p>
                    </div>
                    <button
                        className="cta-banner-btn"
                        onClick={() => window.location.href = 'tel:8147069579'}
                    >
                        Contact Us Now
                    </button>
                </div>

                {/* Top Locations */}
                <section className="home-section animate-section">
                    <div className="section-header">
                        <h2>Top Locations</h2>
                        <a className="see-all" onClick={() => navigate('/city')}>
                            See all <ArrowRight size={16} />
                        </a>
                    </div>

                    <div className="locations-grid">
                        {cities.map((city, index) => (
                            <button
                                key={city.name}
                                className="location-card"
                                onClick={() => {
                                    setSelectedCity(city.name);
                                    navigate(`/search?city=${city.name}`);
                                }}
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <div className="location-info">
                                    <span className="location-name">{city.name}</span>
                                    <span className="location-count">{city.propertyCount} Properties</span>
                                </div>
                                <div className="location-pin">
                                    <MapPin size={18} />
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* Spacer for bottom nav */}
            <div style={{ height: '90px' }} />
        </div>
    );
};

export default Home;

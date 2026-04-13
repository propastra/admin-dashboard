import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, User, ChevronRight, ArrowRight, Hand, Menu, X } from 'lucide-react';
import { getFeaturedProperties, getProperties, getCities, getFavorites, trackInteraction, submitInquiry, getDevelopers } from '../services/api';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import PropertyCard from '../components/PropertyCard';
import ServiceCards from '../components/ServiceCards';
import HeroSlideshow from '../components/HeroSlideshow';
import './Home.css';

// Lazy load components below the fold
const DevelopersCarousel = React.lazy(() => import('../components/DevelopersCarousel'));
const WhyTrustUs = React.lazy(() => import('../components/WhyTrustUs'));
const PropertyTypeBar = React.lazy(() => import('../components/PropertyTypeBar'));
const CompareModal = React.lazy(() => import('../components/CompareModal'));

const categories = [];

const Home = () => {
    const navigate = useNavigate();
    
    // Memoized grouping function to prevent recreation on every render
    const groupProperties = React.useCallback((apiData) => {
        if (!apiData || !Array.isArray(apiData)) return [];
        const grouped = {};
        apiData.forEach(prop => {
            const projNameRaw = prop.projectName || prop.propertyName.split(' - ')[0].trim();
            const projName = projNameRaw.split('  ')[0].trim();
            if (!grouped[projName]) {
                grouped[projName] = { ...prop };
                grouped[projName].isProject = true;
                grouped[projName].displayTitle = projName;
                grouped[projName].configurations = [];
                grouped[projName].minPrice = parseFloat(prop.price);
                grouped[projName].maxPrice = parseFloat(prop.price);
                grouped[projName].priceUnit = prop.priceUnit;
            }
            if (prop.configuration && !grouped[projName].configurations.includes(prop.configuration)) {
                grouped[projName].configurations.push(prop.configuration);
            }
            const price = parseFloat(prop.price);
            if (price < grouped[projName].minPrice) grouped[projName].minPrice = price;
            if (price > grouped[projName].maxPrice) grouped[projName].maxPrice = price;
        });
        Object.values(grouped).forEach(proj => {
            proj.configurations.sort();
            proj.priceRange = { min: proj.minPrice, max: proj.maxPrice, unit: proj.priceUnit };
        });
        return Object.values(grouped);
    }, []);
    const { selectedCity, setSelectedCity } = useCity();
    const { user, login } = useAuth();
    const { ensureIdentified, showFirstVisitPopup } = useInquiryPopup();
    const [properties, setProperties] = useState([]);
    const [nearbyProperties, setNearbyProperties] = useState([]);
    const [nearbyCategory, setNearbyCategory] = useState('All');
    const [cities, setCities] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [activeCategory, setActiveCategory] = useState(() => {
        const urlTab = new URLSearchParams(window.location.search).get('tab');
        if (urlTab) return urlTab;
        return localStorage.getItem('active_category') || null;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingNearby, setLoadingNearby] = useState(false);
    const [showAllLocations, setShowAllLocations] = useState(false);
    const [investSubmitted, setInvestSubmitted] = useState(() => {
        return localStorage.getItem('invest_submitted') === 'true';
    });
    const [bannerCtaSubmitted, setBannerCtaSubmitted] = useState(() => {
        return localStorage.getItem('banner_cta_submitted') === 'true';
    });
    const [buyListingType, setBuyListingType] = useState(() => {
        return localStorage.getItem('buy_listing_type') || null;
    }); // 'Developer' or 'Owner'
    const [developers, setDevelopers] = useState([]);
    const [loadingDevelopers, setLoadingDevelopers] = useState(true);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Live Location States
    const [userCoords, setUserCoords] = useState(null);
    const [displayCity, setDisplayCity] = useState('');

    useEffect(() => {
        // Only run analytics and developers on mount.
        // Data loading is handled by the selectedCity/activeCategory effect below.
        showFirstVisitPopup(user);
        trackInteraction({
            interactionType: 'View',
            websiteUserId: user?.id,
            ipAddress: 'website-user',
            userAgent: navigator.userAgent,
            metadata: { page: 'home', city: selectedCity }
        }).catch(() => { });
        loadDevelopers();
    }, []);

    useEffect(() => {
        if (activeCategory) {
            localStorage.setItem('active_category', activeCategory);
        } else {
            localStorage.removeItem('active_category');
        }

        if (buyListingType) {
            localStorage.setItem('buy_listing_type', buyListingType);
        } else {
            localStorage.removeItem('buy_listing_type');
        }

        if (!selectedCity || selectedCity === "Current Location") {
            // Always try to detect location and load data
            loadData(null);
            detectLocation();
        } else {
            setDisplayCity(selectedCity);
            setUserCoords(null);
            loadData(selectedCity);
            loadNearbyProperties(selectedCity);
        }
    }, [selectedCity, activeCategory, buyListingType]);

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            setDisplayCity("Detecting location...");
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                console.log('GPS Detected:', latitude, longitude);
                setUserCoords({ lat: latitude, lng: longitude });

                try {
                    const response = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    const data = await response.json();
                    const detectedCity = data.city || data.locality || 'Bangalore';
                    console.log('Detected City:', detectedCity);

                    setDisplayCity(detectedCity);
                    // Update selectedCity only if it was "Current Location" to avoid re-trigger loop
                    // We call loadNearbyProperties directly with coords here
                    loadData(detectedCity);
                    loadNearbyProperties(detectedCity, latitude, longitude);
                } catch (error) {
                    console.error('Reverse geocode error:', error);
                    setDisplayCity('Bangalore');
                    loadData('Bangalore');
                    loadNearbyProperties('Bangalore', latitude, longitude);
                }
            }, (error) => {
                console.warn('Geolocation error:', error.message);
                // Fallback: load all Bangalore properties
                setDisplayCity('Bangalore');
                loadData('Bangalore');
                loadNearbyProperties('Bangalore');
            }, { enableHighAccuracy: true, timeout: 10000 });
        } else {
            // Geolocation not supported - use Bangalore as default
            setDisplayCity('Bangalore');
            loadData('Bangalore');
            loadNearbyProperties('Bangalore');
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

    const loadDevelopers = async () => {
        setLoadingDevelopers(true);
        try {
            const res = await getDevelopers();
            if (res.data.success) {
                setDevelopers(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load developers:', err);
        } finally {
            setLoadingDevelopers(false);
        }
    };

    const loadData = async (city = selectedCity) => {
        setLoading(true);
        try {
            const actualCity = city === "Current Location" || city === "Your Area" || !city ? '' : city;

            let categoryParam = (activeCategory === 'Buy' || activeCategory === 'Invest') ? null : activeCategory;

            // For Buy category, we handle Developer/Owner filtering
            if (activeCategory === 'Buy') {
                if (buyListingType === 'Owner') {
                    categoryParam = 'Resale';
                }
            }

            const [propRes, cityRes] = await Promise.all([
                getFeaturedProperties(null, categoryParam, actualCity),
                getCities(),
            ]);

            let fetchedProps = propRes.data;

            // Manual filter for Developer in Buy tab: excludes Resale and Rental
            if (activeCategory === 'Buy' && buyListingType === 'Developer') {
                fetchedProps = fetchedProps.filter(p => p.category !== 'Resale' && p.category !== 'Rental');
            }

            const groupedProps = groupProperties(fetchedProps);
            groupedProps.sort((a, b) => {
                const nameA = (a.displayTitle || a.projectName || a.propertyName || '').toLowerCase();
                const nameB = (b.displayTitle || b.projectName || b.propertyName || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setProperties(groupedProps.slice(0, 4)); // Show fewer cards initially for speed
            setCities(cityRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadNearbyProperties = async (city = null, userLat = null, userLng = null, category = null) => {
        setLoadingNearby(true);
        try {
            // Always fetch by city name — this is reliable regardless of whether
            // properties have lat/lng stored. We do client-side 10km filtering if coords exist.
            const params = { limit: 100 };
            if (city && city !== 'Current Location') {
                params.city = city;
            }

            let categoryFilter = category || (activeCategory === 'Buy' || activeCategory === 'Invest' ? null : activeCategory);

            if (activeCategory === 'Buy' && !category) {
                if (buyListingType === 'Owner') {
                    categoryFilter = 'Resale';
                }
            }

            if (categoryFilter && categoryFilter !== 'All') {
                params.category = categoryFilter;
            }

            const res = await getProperties(params);
            let props = res.data.properties || [];

            // Manual filter for Buy tab constraints
            if (activeCategory === 'Buy') {
                if (buyListingType === 'Developer') {
                    props = props.filter(p => p.category !== 'Resale' && p.category !== 'Rental');
                } else if (buyListingType === 'Owner') {
                    props = props.filter(p => p.category === 'Resale');
                }
            }

            // CLIENT-SIDE 10km RADIUS FILTER
            // Only applied if user GPS is available AND the property has coordinates stored.
            if (userLat && userLng) {
                const propsWithCoords = props.filter(p => p.latitude && p.longitude);
                const propsWithDist = propsWithCoords
                    .map(p => ({
                        ...p,
                        distance: calculateDistance(userLat, userLng, p.latitude, p.longitude)
                    }))
                    .filter(p => p.distance !== null && p.distance <= 10); // ≤ 10km

                if (propsWithDist.length > 0) {
                    // Sort by distance ascending
                    propsWithDist.sort((a, b) => a.distance - b.distance);
                    const grouped = groupProperties(propsWithDist.map(p => ({
                        ...p,
                        distance: parseFloat(p.distance).toFixed(1)
                    })));
                    grouped.sort((a, b) => {
                        const nameA = (a.displayTitle || a.projectName || a.propertyName || '').toLowerCase();
                        const nameB = (b.displayTitle || b.projectName || b.propertyName || '').toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    setNearbyProperties(grouped.slice(0, 20));
                    setLoadingNearby(false);
                    return;
                }

                // Fallback: if no properties have coords stored, show all city props with distance label
                props = props.map(p => ({ ...p, distance: null }));
            }

            const groupedNearbyProps = groupProperties(props);
            groupedNearbyProps.sort((a, b) => {
                const nameA = (a.displayTitle || a.projectName || a.propertyName || '').toLowerCase();
                const nameB = (b.displayTitle || b.projectName || b.propertyName || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            const displayLimit = (categoryFilter && categoryFilter !== 'All') ? 50 : 8;
            setNearbyProperties(groupedNearbyProps.slice(0, displayLimit));
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
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            ensureIdentified(() => {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            }, 'To search properties, we\'d love to know you better');
        }
    };

    const handleInvestSubmit = async () => {
        try {
            await submitInquiry({
                name: user?.name || 'Investment Lead',
                phone: user?.phone || '0000000000',
                message: 'Investment inquiry'
            });
            setInvestSubmitted(true);
            localStorage.setItem('invest_submitted', 'true');
        } catch (err) {
            console.error('Failed to submit investment inquiry', err);
            setInvestSubmitted(true);
            localStorage.setItem('invest_submitted', 'true');
        }
    };

    const handleBannerExpertClick = () => {
        // Submit inquiry and auto-login the user using the returned token
        submitInquiry({
            name: user?.name || 'Investment Lead',
            phone: user?.phone || '0000000000',
            email: user?.email || null,
            message: 'Investment inquiry'
        })
        .then((res) => {
            if (res?.data?.token && res?.data?.user) {
                login(res.data.token, res.data.user);
            }
            localStorage.setItem('banner_cta_submitted', 'true');
            setBannerCtaSubmitted(true);
        })
        .catch(() => {
            localStorage.setItem('banner_cta_submitted', 'true');
            setBannerCtaSubmitted(true);
        });
    };

    const handleResidentialClick = () => {
        setActiveCategory('Buy');
        setBuyListingType('Developer');
        setTimeout(() => {
            const element = document.querySelector('.home-body');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleResaleClick = () => {
        setActiveCategory('Buy');
        setBuyListingType('Owner');
        setTimeout(() => {
            const element = document.querySelector('.home-body');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="home-page">
            {/* Hero Section with branded gradient and slideshow */}
            <div className="home-hero">
                <HeroSlideshow />
                <div className="home-hero-content">
                    <header className="home-header">
                        <div className="home-header-left">
                            <img src="/images/header-logo.png" alt="PropAstra Logo" className="home-logo-img" fetchpriority="high" decoding="async" />
                        </div>
                        <div className="home-header-right">
                            <div className="home-header-location" onClick={() => navigate('/city')}>
                                <div className="location-icon-wrap">
                                    <MapPin size={18} />
                                </div>
                                <div className="location-text-wrap">
                                    <span className="location-label">Location</span>
                                    <span className="location-city">{displayCity || selectedCity || 'Select City'} <ChevronRight size={14} /></span>
                                </div>
                            </div>
                            <button
                                className="avatar-btn"
                                onClick={() => {
                                    if (user) navigate('/profile');
                                    else ensureIdentified(() => navigate('/profile'), 'Sign in to see your profile');
                                }}
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="user-avatar-img" />
                                ) : (
                                    user ? user.name?.charAt(0).toUpperCase() : <img src="/images/PROPASTRA%20P%20.png" alt="P" className="user-avatar-img" />
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
                        <button type="button" className="map-btn" onClick={() => ensureIdentified(() => navigate('/map'), 'Explore homes on map')}>
                            <MapPin size={18} />
                        </button>
                        <button type="button" className="filter-btn" onClick={() => ensureIdentified(() => navigate('/search'), 'Find your perfect match')}>
                            <SlidersHorizontal size={18} />
                        </button>
                    </form>
                </div>

                {/* Decorative elements */}
                <div className="hero-decor hero-decor-1"></div>
                <div className="hero-decor hero-decor-2"></div>
            </div>

            <React.Suspense fallback={null}>
                <PropertyTypeBar 
                    onResidentialClick={handleResidentialClick}
                    onResaleClick={handleResaleClick}
                    onCompareClick={() => setIsCompareModalOpen(true)}
                />
                
                <CompareModal 
                    isOpen={isCompareModalOpen} 
                    onClose={() => setIsCompareModalOpen(false)} 
                />
            </React.Suspense>

            {/* Promotional Banner with CTA - Enhanced Financial Dashboard version */}
            <div className="promo-banner-section premium-banner investment-dashboard">
                <div className="banner-overlay"></div>
                <div className="banner-grid-overlay"></div>
                
                <div className="banner-graph-bg">
                    <div className="svg-graph">
                        <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
                            {/* Main Trend Line Area */}
                            <path d="M0,250 C150,220 250,280 400,180 C500,100 650,220 800,140 C900,100 1000,120 1000,120 L1000,300 L0,300 Z" fill="rgba(245,145,10,0.05)" />
                            
                            {/* Secondary Trend Line */}
                            <path d="M0,220 C200,200 300,240 500,150 C650,100 800,180 1000,100" fill="none" stroke="rgba(0,210,255,0.15)" strokeWidth="3" strokeDasharray="1000" className="animate-path" />
                            
                            {/* Primary Trend Line */}
                            <path d="M0,250 C150,220 250,280 400,180 C500,100 650,220 800,140 C900,100 1000,120 1000,120" fill="none" stroke="rgba(245,145,10,0.4)" strokeWidth="4" strokeDasharray="1000" className="animate-path-slow" />
                            
                            {/* Glowing Data points */}
                            <circle cx="400" cy="180" r="6" fill="#f5910a" className="pulse-point" />
                            <circle cx="800" cy="140" r="6" fill="#00d2ff" className="pulse-point-delay" />
                        </svg>
                    </div>
                    
                    {/* Floating Stat Chips */}
                    <div className="floating-stats">
                        <div className="stat-chip chip-3">
                            <span className="stat-icon">🛡️</span>
                            <span className="stat-label">Safe Assets</span>
                        </div>
                    </div>
                </div>
                
                <div className="premium-banner-content">
                    <div className="banner-text-side">
                        <div className="investment-badge">INVESTMENT DASHBOARD</div>
                        <h2 className="banner-title">Get your personalized <br /> investment plan</h2>
                        <p className="banner-description">Experience the next generation of real estate investment. Get a data-backed plan tailored to your financial goals with premium high-yield opportunities.</p>
                    </div>
                    
                    <div className="banner-btn-side">
                        <div className="promo-banner-cta">
                            {bannerCtaSubmitted ? (
                                <div className="promo-cta-success">
                                    ✅ We will reach out soon...
                                </div>
                            ) : (
                                <button
                                    className="promo-cta-btn"
                                    onClick={() => ensureIdentified(
                                        handleBannerExpertClick,
                                        'To talk to our expert, please verify your details'
                                    )}
                                >
                                    Talk to Our Expert
                                    <span className="btn-shine"></span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ServiceCards 
                setActiveCategory={setActiveCategory} 
                setBuyListingType={setBuyListingType} 
                investSubmitted={investSubmitted}
                handleInvestSubmit={handleInvestSubmit}
                user={user}
                ensureIdentified={ensureIdentified}
                onCompareClick={() => setIsCompareModalOpen(true)}
            />

            {/* Category Tabs */}
            <div className="home-body">

                {activeCategory === 'Buy' && (selectedCity && selectedCity !== "Select City") && !buyListingType && (
                    <div className="listing-type-toggle">
                        <button
                            className={`listing-type-btn ${buyListingType === 'Developer' ? 'active' : ''}`}
                            onClick={() => setBuyListingType('Developer')}
                        >
                            Residential
                        </button>
                        <button
                            className={`listing-type-btn ${buyListingType === 'Owner' ? 'active' : ''}`}
                            onClick={() => setBuyListingType('Owner')}
                        >
                            Resale
                        </button>
                    </div>
                )}


                {/* Properties Near You - Always shown when city/location is available */}
                {(displayCity || selectedCity || userCoords) && displayCity !== 'Detecting location...' && (
                            <section className="home-section animate-section">
                                <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{ margin: 0 }}>Properties in <span className="hero-highlight" style={{ cursor: 'pointer' }} onClick={() => ensureIdentified(() => navigate((displayCity || selectedCity) === "Your Area" ? '/search' : `/search?city=${displayCity || selectedCity}`))} title={`See all properties in ${displayCity || selectedCity}`}>{displayCity || selectedCity}</span></h2>
                                        {activeCategory === 'Buy' && buyListingType && (
                                            <button 
                                                onClick={() => setBuyListingType(buyListingType === 'Developer' ? 'Owner' : 'Developer')} 
                                                className="listing-switch-btn"
                                            >
                                                <Hand size={14} className="pointing-hand" />
                                                Switch to {buyListingType === 'Developer' ? 'Resale' : 'Residential'}
                                            </button>
                                        )}
                                    </div>
                                    <a className="see-all" style={{ cursor: 'pointer' }} onClick={() => ensureIdentified(() => navigate((displayCity || selectedCity) === "Your Area" ? '/search' : `/search?city=${displayCity || selectedCity}`))}>
                                        See all <ArrowRight size={16} />
                                    </a>
                                </div>

                                {/* Sub-category Filter for Nearby */}
                                <div className="nearby-filters">
                                    {['All', 'Villa', 'Plot', 'Farm Land', 'Residential', 'Resale', 'Rental'].map(cat => (
                                        <button
                                            key={cat}
                                            className={`nearby-filter-chip ${nearbyCategory === cat ? 'active' : ''}`}
                                            onClick={() => {
                                                const updateFilter = () => {
                                                    setNearbyCategory(cat);
                                                    if (userCoords) {
                                                        loadNearbyProperties(null, userCoords.lat, userCoords.lng, cat === 'All' ? null : cat);
                                                    } else {
                                                        loadNearbyProperties(selectedCity, null, null, cat === 'All' ? null : cat);
                                                    }
                                                };

                                                if (user) updateFilter();
                                                else ensureIdentified(updateFilter, 'Filter properties by type');
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
                                    <div className="empty-state-small" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                        <p style={{ fontSize: '18px', fontWeight: '500' }}>We are coming soon...</p>
                                        <p style={{ fontSize: '14px', marginTop: '8px' }}>No {nearbyCategory !== 'All' ? nearbyCategory : ''} properties available in {displayCity || selectedCity} yet.</p>
                                    </div>
                                )}
                            </section>
                        )}

                {/* CTA Banner - Moved here as requested */}
                <div className="home-cta-banner" style={{ marginTop: '12px', marginBottom: '32px' }}>
                    <div className="cta-banner-content">
                        <h2>Talk to a Property Expert Now</h2>
                        <p>Our experts are ready to help you find your dream home</p>
                    </div>
                    <div className="cta-banner-action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                            className="cta-banner-btn"
                            onClick={() => {
                                if (user) window.location.href = 'tel:8147069579';
                                else ensureIdentified(() => window.location.href = 'tel:8147069579', 'Contact our experts');
                            }}
                        >
                            Get Free Consultation
                        </button>
                        <span className="cta-microcopy" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '8px', textAlign: 'center' }}>Takes less than 30 seconds</span>
                    </div>
                </div>

                {/* Trusted Developers & Company Stats */}
                {!loadingDevelopers && developers.length > 0 && (
                    <React.Suspense fallback={<div className="loading-screen"><div className="spinner"></div></div>}>
                        <DevelopersCarousel developers={developers} />
                        <WhyTrustUs />
                    </React.Suspense>
                )}

                {/* Top Locations */}
                <section className="home-section animate-section">
                    <div className="section-header">
                        <h2>Top Locations</h2>
                        {!showAllLocations && cities.length > 5 && (
                            <button className="see-all" onClick={() => setShowAllLocations(true)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                                See all <ArrowRight size={16} />
                            </button>
                        )}
                        {showAllLocations && (
                            <button className="see-all" onClick={() => setShowAllLocations(false)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                                Show less
                            </button>
                        )}
                    </div>

                    <div className="locations-grid">
                        {(showAllLocations ? cities : cities.slice(0, 5)).map((city, index) => (
                            <button
                                key={city.name}
                                className="location-card"
                                onClick={() => {
                                    ensureIdentified(() => {
                                        setSelectedCity(city.name);
                                        navigate(`/search?city=${city.name}`);
                                    }, `Explore properties in ${city.name}`);
                                }}
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <div className="location-info">
                                    <span className="location-name">{city.name}</span>
                                    <span className="location-count">{city.propertyCount} Projects</span>
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

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
        
        const getNormalized = (p, u) => parseFloat(p) * (u === 'Cr' ? 100 : 1);

        apiData.forEach(prop => {
            const projNameRaw = prop.projectName || prop.propertyName.split(' - ')[0].trim();
            const projName = projNameRaw.split('  ')[0].trim();
            if (!grouped[projName]) {
                grouped[projName] = { ...prop };
                grouped[projName].isProject = true;
                grouped[projName].displayTitle = projName;
                grouped[projName].configurations = [];
                grouped[projName].minNormalized = getNormalized(prop.price, prop.priceUnit);
                grouped[projName].maxNormalized = getNormalized(prop.price, prop.priceUnit);
                grouped[projName].minPriceRaw = prop.price;
                grouped[projName].minPriceUnit = prop.priceUnit;
                grouped[projName].maxPriceRaw = prop.price;
                grouped[projName].maxPriceUnit = prop.priceUnit;
            }
            if (prop.configuration) {
                const parseConfigs = (val) => {
                    if (!val) return [];
                    if (Array.isArray(val)) {
                        if (val.length > 0 && typeof val[0] === 'object') {
                            return val.map(c => c.configuration);
                        }
                        return val;
                    }
                    try {
                        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                        if (Array.isArray(parsed)) {
                            if (parsed.length > 0 && typeof parsed[0] === 'object') {
                                return parsed.map(c => c.configuration);
                            }
                            return parsed;
                        }
                        return [val];
                    } catch (e) {
                        return [val];
                    }
                };
                const cList = parseConfigs(prop.configuration);
                cList.forEach(c => {
                    if (c && !grouped[projName].configurations.includes(c)) {
                        grouped[projName].configurations.push(c);
                    }
                });
            }
            const norm = getNormalized(prop.price, prop.priceUnit);
            if (!isNaN(norm)) {
                if (norm < grouped[projName].minNormalized) {
                    grouped[projName].minNormalized = norm;
                    grouped[projName].minPriceRaw = prop.price;
                    grouped[projName].minPriceUnit = prop.priceUnit;
                    grouped[projName].price = prop.price;
                    grouped[projName].priceUnit = prop.priceUnit;
                    grouped[projName].id = prop.id;
                }
                if (norm > grouped[projName].maxNormalized) {
                    grouped[projName].maxNormalized = norm;
                    grouped[projName].maxPriceRaw = prop.price;
                    grouped[projName].maxPriceUnit = prop.priceUnit;
                }
            }
        });
        const sortConfigs = (a, b) => {
            const numA = parseFloat(a) || 0;
            const numB = parseFloat(b) || 0;
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b);
        };
        Object.values(grouped).forEach(proj => {
            proj.configurations.sort(sortConfigs);
            proj.priceRange = { min: proj.minPriceRaw, max: proj.maxPriceRaw, unit: proj.minPriceUnit };
        });
        return Object.values(grouped);
    }, []);
    const { selectedCity, setSelectedCity } = useCity();
    const { user, login } = useAuth();
    const { ensureIdentified, showFirstVisitPopup, openPopup } = useInquiryPopup();
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
                    // Ensure we don't zero out valid categories if they were explicitly requested
                    if (!category || category === 'Resale') {
                        props = props.filter(p => p.category === 'Resale');
                    }
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
                    setNearbyProperties(grouped.slice(0, 20));
                    setLoadingNearby(false);
                    return;
                }

                // Fallback: if no properties have coords stored, show all city props with distance label
                props = props.map(p => ({ ...p, distance: null }));
            }

            const groupedNearbyProps = groupProperties(props);
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
        const query = searchQuery.trim();
        ensureIdentified(() => {
            navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
        }, 'To search properties, we\'d love to know you better');
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
            {/* Hero Section with dynamic slideshow background */}
            <div className="home-hero">
                <HeroSlideshow />
                <div className="home-hero-content">
                    {/* Hero Text */}
                    <div className="hero-text">
                        <h1>Find Your <span className="hero-highlight">Dream Home</span></h1>
                        <p>Explore premium properties across India's top cities</p>
                    </div>

                    {/* Search Bar */}
                    <form className="home-search" onSubmit={handleSearch}>
                        <Search size={20} className="search-icon" onClick={handleSearch} style={{ cursor: 'pointer' }} />
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

            {/* Modern Promotional Banner */}
            <div className="promo-banner-section">
                <div className="promo-banner-bg-wrapper">
                    <img
                        src="/images/promo-banner-bg.png"
                        alt="Get your personalized investment plan"
                        className="promo-banner-img"
                    />
                </div>

                {/* Only the CTA — no text overlay, image already has it */}
                <div className="promo-banner-cta-wrap">
                    {bannerCtaSubmitted ? (
                        <div className="promo-cta-success">
                            <div className="promo-success-icon">✅</div>
                            <div className="promo-success-text">
                                <strong>We'll reach out soon!</strong>
                                <span>Our expert will contact you within 24 hrs.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="promo-action-group">
                            <button
                                className="promo-cta-btn"
                                onClick={() => ensureIdentified(
                                    handleBannerExpertClick,
                                    'To talk to our expert, please verify your details'
                                )}
                            >
                                Talk to Our Expert
                            </button>
                            <span className="promo-microcopy">Expert advice in under 24 hrs</span>
                        </div>
                    )}
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
                                    {[
                                        { label: 'All', value: 'All' },
                                        { label: 'Flat', value: 'Residential' },
                                        { label: 'Villa', value: 'Villa' },
                                        { label: 'Plot', value: 'Plot' },
                                        { label: 'Farm Land', value: 'Farm Land' },
                                        { label: 'Resale', value: 'Resale' },
                                        { label: 'Rental', value: 'Rental' },
                                    ].map(({ label, value }) => (
                                        <button
                                            key={label}
                                            className={`nearby-filter-chip ${nearbyCategory === value ? 'active' : ''}`}
                                            onClick={() => {
                                                const updateFilter = () => {
                                                    setNearbyCategory(value);
                                                    if (userCoords) {
                                                        loadNearbyProperties(null, userCoords.lat, userCoords.lng, value === 'All' ? null : value);
                                                    } else {
                                                        loadNearbyProperties(selectedCity, null, null, value === 'All' ? null : value);
                                                    }
                                                };

                                                if (user) updateFilter();
                                                else ensureIdentified(updateFilter, 'Filter properties by type');
                                            }}
                                        >
                                            {label}
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
                                openPopup({ message: 'Request a Free Consultation' });
                            }}
                        >
                            Get Free Consultation
                        </button>
                        <span className="cta-microcopy" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '8px', textAlign: 'center' }}>Takes less than 30 seconds</span>
                    </div>
                </div>

                {/* Trusted Developers */}
                {!loadingDevelopers && developers.length > 0 && (
                    <React.Suspense fallback={<div className="loading-screen"><div className="spinner"></div></div>}>
                        <DevelopersCarousel developers={developers} />
                        <WhyTrustUs />
                    </React.Suspense>
                )}

                {/* ── Stats Section ── */}
                <div className="stats-section">
                    <div className="stats-section-inner">
                        <div className="stats-header">
                            <span className="stats-eyebrow">Our Track Record</span>
                            <h2 className="stats-title">Numbers That <span className="stats-highlight">Speak</span></h2>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #eef2ff, #c7d2fe)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B3F8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                                </div>
                                <div className="stat-card-value">₹150<span className="stat-unit">Cr+</span></div>
                                <div className="stat-card-label">Inventory Sold</div>
                                <div className="stat-card-bar" style={{ '--bar-color': '#3B3F8C' }} />
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                </div>
                                <div className="stat-card-value">120<span className="stat-unit">+</span></div>
                                <div className="stat-card-label">Units Sold</div>
                                <div className="stat-card-bar" style={{ '--bar-color': '#d97706' }} />
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                </div>
                                <div className="stat-card-value">3.72<span className="stat-unit"> Cr</span></div>
                                <div className="stat-card-label">Revenue Generated</div>
                                <div className="stat-card-bar" style={{ '--bar-color': '#16a34a' }} />
                            </div>
                        </div>
                    </div>
                </div>

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

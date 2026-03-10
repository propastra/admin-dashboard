import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MapPin, Maximize, Phone, MessageCircle, Star, Check, Search, Route, Mail, Lock, Eye, EyeOff, GitCompare, X, Download } from 'lucide-react';
import { BiBed } from 'react-icons/bi';
import { getPropertyById, getProperties, submitInquiry, addFavorite, removeFavorite, API_BASE, BACKEND_URL, loginUser, trackInteraction } from '../services/api';
import { getCoordinates, calculateRoute } from '../utils/mapUtils';
import { useAuth } from '../context/AuthContext';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import PropertyCard from '../components/PropertyCard';
import './PropertyDetail.css';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const { ensureIdentified } = useInquiryPopup();
    const [property, setProperty] = useState(null);
    const [projectProperties, setProjectProperties] = useState([]);
    const [activeConfig, setActiveConfig] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePhoto, setActivePhoto] = useState(0);
    const [showInquiry, setShowInquiry] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        message: '',
        visitDate: ''
    });
    const [inquirySent, setInquirySent] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Sync user details with inquiry form
    useEffect(() => {
        if (user) {
            setInquiryForm(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);


    // Check if favorite on load
    useEffect(() => {
        if (user && property) {
            import('../services/api').then(({ getFavorites }) => {
                getFavorites().then(res => {
                    const favs = res.data.favorites || [];
                    setIsFavorite(favs.some(f => f.propertyId && f.propertyId._id === property.id || f.propertyId === property.id));
                }).catch(err => console.error(err));
            });
        }
    }, [user, property]);

    const handleToggleFavorite = async () => {
        const toggle = async () => {
            try {
                if (isFavorite) {
                    await removeFavorite(property.id);
                    setIsFavorite(false);
                } else {
                    await addFavorite(property.id);
                    setIsFavorite(true);
                }
            } catch (error) {
                console.error('Favorite action failed:', error);
            }
        };

        if (user) {
            toggle();
        } else {
            ensureIdentified(toggle, 'To save this property, we\'d love to know you better');
        }
    };


    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: getDisplayTitle(property),
                    text: `Check out ${getDisplayTitle(property)} on Ayora`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const [calcDestination, setCalcDestination] = useState('');
    const [calcResult, setCalcResult] = useState(null);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcError, setCalcError] = useState('');

    const handleCalculateDistance = async (e) => {
        if (e) e.preventDefault();
        if (!calcDestination.trim()) return;

        setCalcLoading(true);
        setCalcError('');
        setCalcResult(null);

        const queries = [];
        const area = property.location ? property.location.split(',')[0].trim() : '';
        // Some properties don't have projectName and their propertyName includes config (e.g., Sattva Lumina - 3 BHK Regular)
        // Clean this up to just "Sattva Lumina"
        const projNameRaw = property.projectName || property.propertyName.split('-')[0].trim();
        // Remove words like "Phase" or numbers that confuse Nominatim if possible, but keep it simple first
        const projName = projNameRaw.split('  ')[0].trim();

        if (projName && area) queries.push(`${projName}, ${area}, Bengaluru`);
        if (projName && area) queries.push(`${projName}, Bengaluru`);
        if (area) queries.push(`${area}, Bengaluru`);
        // Fallback to searching just the area name without Bengaluru in case it's entered weirdly
        if (area) queries.push(area);
        // Absolute fallback to Bengaluru city center so it doesn't just error out hard
        queries.push(`Bengaluru`);

        try {
            let propCoords = null;
            for (const q of queries) {
                if (!q) continue;
                propCoords = await getCoordinates(q);
                if (propCoords) break;
            }

            if (!propCoords) {
                setCalcError('Could not find property location on the map.');
                setCalcLoading(false);
                return;
            }

            const destCoords = await getCoordinates(calcDestination);
            if (!destCoords) {
                setCalcError('Could not find the destination on the map.');
                setCalcLoading(false);
                return;
            }

            const routeData = await calculateRoute(propCoords, destCoords);
            if (routeData) {
                setCalcResult(routeData);
            } else {
                setCalcError('Could not calculate route.');
            }
        } catch (err) {
            setCalcError('An error occurred while calculating distance.');
        } finally {
            setCalcLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        loadProperty();
        const params = new URLSearchParams(window.location.search);
        if (params.get('inquiry') === 'true') setShowInquiry(true);
    }, [id]);

    useEffect(() => {
        if (property) {
            loadSimilarProperties();
        }
    }, [property]);

    const loadProperty = async () => {
        try {
            const res = await getPropertyById(id);
            setProperty(res.data);

            // Track the property view interaction
            trackInteraction({
                interactionType: 'View',
                propertyId: id
            }).catch(err => console.error("Tracking error", err));

        } catch (err) {
            console.error('Failed to load property:', err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to extract project name for display
    const getDisplayTitle = (p) => {
        if (!p) return '';
        if (p.projectName && p.projectName.trim()) return p.projectName.trim();
        // Heuristic: take first part before hyphen
        if (p.propertyName) {
            const beforeHyphen = p.propertyName.split('-')[0].trim();
            if (beforeHyphen) return beforeHyphen;
            return p.propertyName.split(' ').slice(0, 2).join(' ').trim();
        }
        return 'Unknown Project';
    };

    const loadSimilarProperties = async () => {
        try {
            const currentProject = getDisplayTitle(property);

            // 1. Load all properties for this PROJECT specifically (ignore category, just match name)
            const projectRes = await getProperties({
                search: currentProject,
                limit: 50 // Get enough to find all units
            });

            // Filter strictly for the same project name to avoid "similar" name contamination
            const allProjProps = (projectRes.data.properties || []).filter(p => {
                const pName = getDisplayTitle(p);
                return pName.toLowerCase() === currentProject.toLowerCase();
            });

            // ALWAYS include the current property in its own project list
            if (!allProjProps.find(p => p.id === property.id)) {
                allProjProps.push(property);
            }

            // Sort project units by price
            allProjProps.sort((a, b) => {
                const getVal = x => parseFloat(x.price) * (x.priceUnit === 'Cr' ? 100 : 1);
                return getVal(a) - getVal(b);
            });

            setProjectProperties(allProjProps);

            // Default active config to current property's ID
            setActiveConfig(property.id);

            // 2. Load SIMILAR properties for the diversity section at the bottom
            const cityPart = property.location ? property.location.split(',').pop().trim().replace(/\.$/, '') : undefined;
            const similarRes = await getProperties({
                category: property.category,
                city: cityPart,
                limit: 30 // Increase limit to have more to choose from after filtering
            });

            const filtered = (similarRes.data.properties || []).filter(p => p.id !== property.id);
            const currentProjLower = currentProject.toLowerCase();
            const seenProjects = new Set([currentProjLower]);
            const diverseProperties = [];
            const otherProjectsProperties = [];

            for (const p of filtered) {
                const proj = getDisplayTitle(p).toLowerCase();

                // STRICT EXCLUSION: Never show anything from the same project
                if (proj === currentProjLower) continue;

                if (!seenProjects.has(proj)) {
                    seenProjects.add(proj);
                    diverseProperties.push(p);
                } else {
                    otherProjectsProperties.push(p);
                }
            }

            // Fill with diverse properties first, then others (all from different projects than the current one)
            setSimilarProperties([...diverseProperties, ...otherProjectsProperties].slice(0, 4));
        } catch (err) {
            console.error('Failed to load similar/project properties:', err);
        }
    };

    const handleInquiry = async (e) => {
        e.preventDefault();
        try {
            const res = await submitInquiry({ ...inquiryForm, propertyId: id });
            setInquirySent(true);

            // Handle auto-login if token is returned (for guest-to-user conversion)
            if (res.data.token && res.data.user && !user) {
                login(res.data.token, res.data.user);
            }

            setTimeout(() => {
                setShowInquiry(false);
                setInquirySent(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to submit inquiry:', err);
        }
    };

    const formatPrice = (price, unit) => {
        const p = parseFloat(price);
        if (unit === 'Cr') return `₹${p} Cr`;
        if (unit === 'Lakhs') return `₹${p} Lakhs`;
        return `₹${p.toLocaleString()}`;
    };

    if (loading) {
        return <div className="loading-screen"><div className="spinner"></div></div>;
    }

    if (!property) {
        return (
            <div className="detail-not-found">
                <p>Property not found</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    const photos = property.photos && property.photos.length > 0
        ? property.photos.map(p => p.startsWith('http') ? p : `${BACKEND_URL}${p.startsWith('/') ? '' : '/'}${p}`)
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop'];

    const amenities = property.amenities || [];

    return (
        <>
            <div className="detail-page">
                {/* Back Nav */}
                <button className="detail-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>

                {/* 1. Header Row */}
                <div className="detail-header-section">
                    <div className="header-breadcrumbs">
                        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</span> &gt;{' '}
                        <span onClick={() => {
                            const city = property.location ? property.location.split(',')[0].trim() : '';
                            if (city) navigate(`/search?location=${encodeURIComponent(city)}`);
                            else navigate('/search');
                        }} style={{ cursor: 'pointer' }}>
                            {property.location ? property.location.split(',')[0] : 'Area'}
                        </span> &gt;{' '}
                        <span style={{ color: 'var(--gray-900)', fontWeight: '500', cursor: 'default' }}>
                            {property.category} in {property.location ? property.location.split(',')[0] : 'Area'}
                        </span>
                    </div>
                    <div className="header-main-flex" style={{ alignItems: 'center' }}>
                        <div className="header-left-info">
                            <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {getDisplayTitle(property)}
                                {property.isVerified && (
                                    <span style={{ backgroundColor: '#10b981', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Check size={12} /> Verified
                                    </span>
                                )}
                            </h1>
                            <div className="header-price-row">
                                <h2 className="header-price">{formatPrice(property.price, property.priceUnit)}</h2>
                            </div>
                        </div>
                        <div className="header-right-actions" style={{ flexDirection: 'row' }}>
                            <div className="header-action-btns">
                                <button className="action-circle-sm" onClick={handleToggleFavorite} style={{ color: isFavorite ? '#ef4444' : 'var(--gray-500)', borderColor: isFavorite ? '#fee2e2' : '#e2e8f0', background: isFavorite ? '#fef2f2' : '#fff' }}>
                                    <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} />
                                </button>
                                <button className="action-circle-sm" onClick={handleShare}>
                                    <Share2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Masonry Gallery */}
                <div className="detail-masonry-gallery">
                    {/* Main large image */}
                    <div className="col-main image-wrap" onClick={() => {
                        const open = () => { setActivePhoto(0); setIsGalleryOpen(true); };
                        if (user) open();
                        else ensureIdentified(open, 'To view individual photos, we\'d love to know you better');
                    }}>
                        <img src={photos[0]} alt="Main view" className="masonry-img main-img" />
                    </div>

                    {/* 2x2 Grid of smaller images */}
                    <div className="col-grid">
                        {photos.slice(1, 5).map((photo, idx) => (
                            <div key={idx} className="image-wrap" onClick={() => {
                                const open = () => { setActivePhoto(idx + 1); setIsGalleryOpen(true); };
                                if (user) open();
                                else ensureIdentified(open, 'To view more photos, we\'d love to know you better');
                            }}>
                                <img src={photo} alt={`View ${idx + 2}`} className="masonry-img" />
                                {/* If it's the 4th thumbnail and there are more photos, show an overlay */}
                                {idx === 3 && photos.length > 5 && (
                                    <div className="more-photos-overlay">
                                        <Maximize size={24} />
                                        <span>+{photos.length - 5} Photos</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Fill empty spots if less than 5 total photos */}
                        {Array.from({ length: Math.max(0, 4 - Math.max(0, photos.length - 1)) }).map((_, i) => (
                            <div key={`empty-${i}`} className="image-wrap empty-wrap">
                                <div className="empty-placeholder">No Image</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Main Details Card */}
                <div className="detail-main-card">
                    {/* Top strip of key configs */}
                    <div className="card-top-strip">
                        {property.configuration && (
                            <div className="strip-item">
                                <BiBed size={20} className="strip-icon" />
                                <span className="strip-text"><strong>{property.configuration}</strong> Bedrooms</span>
                            </div>
                        )}
                        <div className="strip-item">
                            <Check size={18} className="strip-icon" />
                            <span className="strip-text"><strong>{property.status}</strong></span>
                        </div>
                        <div className="strip-item">
                            <Check size={18} className="strip-icon" />
                            <span className="strip-text"><strong>{property.category}</strong></span>
                        </div>
                    </div>

                    {/* Sub grid of details */}
                    <div className="card-metrics-grid">
                        <div className="metric-cell">
                            <span className="metric-label">Super Built-Up Area</span>
                            <span className="metric-value">{property.dimensions || 'N/A'}</span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Project</span>
                            <span className="metric-value">{property.projectName || 'Independent'}</span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Transaction Type</span>
                            <span className="metric-value">New Property</span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Status</span>
                            <span className="metric-value">{property.status}</span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Furnishing</span>
                            <span className="metric-value">{property.furnishingStatus || 'Unfurnished'}</span>
                        </div>
                        <div className="metric-cell">
                            <span className="metric-label">Possession</span>
                            <span className="metric-value">{property.possessionStatus || 'Ready to Move'}</span>
                        </div>
                        {property.floor && (
                            <div className="metric-cell">
                                <span className="metric-label">Floor</span>
                                <span className="metric-value">{property.floor}</span>
                            </div>
                        )}
                        {property.units && (
                            <div className="metric-cell">
                                <span className="metric-label">Total Units</span>
                                <span className="metric-value">{property.units}</span>
                            </div>
                        )}
                    </div>

                    {/* Main Card CTA Row */}
                    <div className="card-bottom-cta">
                        <button className="btn btn-accent btn-wide" onClick={() => {
                            if (user) setShowInquiry(true);
                            else ensureIdentified(() => setShowInquiry(true), `To message about ${getDisplayTitle(property)}, we'd love to know you better`);
                        }}>
                            <MessageCircle size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                            Message
                        </button>
                        <button className="btn btn-outline btn-wide" onClick={() => {
                            const callUs = () => window.location.href = 'tel:8147069579';
                            if (user) callUs();
                            else ensureIdentified(callUs, 'To contact our experts, we\'d love to know you better');
                        }}>
                            <Phone size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                            Call us
                        </button>
                        <span className="last-contact">Last contact made 1 day ago</span>
                    </div>
                </div>

                {/* 4. Description & Amenities Info Cards below */}
                <div className="detail-info-cards-container">
                    <div className="info-card">
                        <h3>More Details</h3>
                        <div className="more-details-row">
                            <span className="label">Address</span>
                            <span className="value">{property.location}, Bangalore - South, Karnataka</span>
                        </div>
                        <div className="more-details-row">
                            <span className="label">Landmarks</span>
                            <span className="value">{property.projectName || 'Near main road'}</span>
                        </div>
                        {property.reraNumber && (
                            <div className="more-details-row">
                                <span className="label">RERA Number</span>
                                <span className="value">{property.reraNumber}</span>
                            </div>
                        )}
                        {property.builderInfo && (
                            <div className="more-details-row">
                                <span className="label">Builder</span>
                                <span className="value">{property.builderInfo}</span>
                            </div>
                        )}

                        {property.description && (
                            <>
                                <h3 style={{ marginTop: '32px' }}>Description</h3>
                                <p className="description-text">{property.description}</p>
                            </>
                        )}

                        {property.projectHighlights && property.projectHighlights.length > 0 && (
                            <>
                                <h3 style={{ marginTop: '32px' }}>Project Highlights</h3>
                                <ul style={{ paddingLeft: '20px', marginTop: '12px', color: 'var(--gray-700)', lineHeight: '1.6' }}>
                                    {property.projectHighlights.map((hl, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px' }}>{hl}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    {amenities.length > 0 && (
                        <div className="info-card">
                            <h3>Amenities</h3>
                            <div className="amenities-grid-simple">
                                {amenities.map((am, i) => (
                                    <span key={i} className="amenity-simple-item">
                                        <Check size={16} color="#4f46e5" /> {am}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {property.brochure && property.brochure.length > 0 && (
                        <div className="info-card brochure-card">
                            <h3>Project Brochure</h3>
                            <div className="brochure-preview-container" onClick={() => {
                                const openBrochure = () => {
                                    const brochureUrl = property.brochure[0].startsWith('http') ? property.brochure[0] : `${BACKEND_URL}${property.brochure[0].startsWith('/') ? '' : '/'}${property.brochure[0]}`;
                                    window.open(brochureUrl, '_blank');
                                };
                                if (user) openBrochure();
                                else ensureIdentified(openBrochure, 'To view the project brochure, we\'d love to know you better');
                            }}>
                                <div className="brochure-images">
                                    {(() => {
                                        const bFiles = property.brochure.map(p => p.startsWith('http') ? p : `${BACKEND_URL}${p.startsWith('/') ? '' : '/'}${p}`);
                                        if (bFiles.length === 0) {
                                            return (
                                                <>
                                                    <img src={photos[0]} alt="Brochure preview 1" className="brochure-img-main" />
                                                    {photos.length > 1 && <img src={photos[1]} alt="Brochure preview 2" className="brochure-img-sub" />}
                                                    {photos.length > 2 && <img src={photos[2]} alt="Brochure preview 3" className="brochure-img-sub" />}
                                                </>
                                            );
                                        }

                                        const renderFile = (url, className, alt) => {
                                            if (url.toLowerCase().endsWith('.pdf')) {
                                                return <iframe src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} title={alt} className={className} style={{ pointerEvents: 'none', border: 'none', overflow: 'hidden' }} />;
                                            }
                                            return <img src={url} alt={alt} className={className} />;
                                        };

                                        return (
                                            <>
                                                {renderFile(bFiles[0], bFiles.length === 1 ? "brochure-img-main full-width" : "brochure-img-main", "Brochure preview 1")}
                                                {bFiles.length > 1 && renderFile(bFiles[1], "brochure-img-sub", "Brochure preview 2")}
                                                {bFiles.length > 2 && renderFile(bFiles[2], "brochure-img-sub", "Brochure preview 3")}
                                                {bFiles.length === 1 && photos.length > 0 && <img src={photos[0]} alt="Brochure fallback 1" className="brochure-img-sub" />}
                                                {bFiles.length <= 2 && photos.length > 1 && <img src={photos[1]} alt="Brochure fallback 2" className="brochure-img-sub" />}
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="brochure-overlay-center">
                                    <span className="view-brochure-btn">View Brochure</span>
                                </div>
                            </div>
                            <div className="brochure-download-container" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={() => {
                                        const downloadBrochure = () => {
                                            const brochureUrl = property.brochure[0].startsWith('http') ? property.brochure[0] : `${BACKEND_URL}${property.brochure[0].startsWith('/') ? '' : '/'}${property.brochure[0]}`;
                                            window.open(brochureUrl, '_blank');
                                        };
                                        if (user) downloadBrochure();
                                        else ensureIdentified(downloadBrochure, 'To download the brochure, we\'d love to know you better');
                                    }}
                                    className="btn btn-primary download-large-btn"
                                    style={{ background: '#3b82f6', color: '#ffffff', border: 'none', height: '44px', padding: '0 24px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    <Download size={18} />
                                    Download Brochure
                                </button>
                            </div>
                        </div>
                    )}

                    {(() => {
                        // Detect data structure
                        const isInternalUnits = property.floorPlan &&
                            property.floorPlan.length > 0 &&
                            typeof property.floorPlan[0] === 'object' &&
                            (property.floorPlan[0].configurations || property.floorPlan[0].type);

                        // If not internal units, we use the projectProperties (Brigade style)
                        const units = isInternalUnits ? property.floorPlan : projectProperties;

                        if (units.length === 0) return null;

                        return (
                            <div className="info-card floor-plans-card project-units-card" style={{ marginTop: '32px' }}>
                                <h3>Price & Floor Plan</h3>

                                <div className="units-tabs" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                                    {units.map((unit, idx) => {
                                        const id = isInternalUnits ? `idx-${idx}` : unit.id;
                                        const name = isInternalUnits ? (unit.type || `Unit ${idx + 1}`) : (unit.configuration || `${unit.bhk || 1} BHK`);
                                        const price = isInternalUnits ? (unit.priceRange || unit.price) : formatPrice(unit.price, unit.priceUnit);
                                        const isActive = isInternalUnits ? (activeConfig === id || (!activeConfig.startsWith('idx-') && idx === 0)) : activeConfig === id;

                                        return (
                                            <button
                                                key={id}
                                                className={`unit-tab ${isActive ? 'active' : ''}`}
                                                onClick={() => setActiveConfig(id)}
                                                style={{
                                                    padding: '12px 24px',
                                                    border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                    backgroundColor: isActive ? '#eff6ff' : '#fff',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    minWidth: '160px',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                <div className="unit-tab-title" style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#1e40af' : '#4b5563', marginBottom: '4px' }}>
                                                    {name}
                                                </div>
                                                <div className="unit-tab-price" style={{ fontSize: '13px', color: '#6b7280' }}>
                                                    {price}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="unit-tab-content">
                                    {units.map((unit, idx) => {
                                        const id = isInternalUnits ? `idx-${idx}` : unit.id;
                                        const isActive = isInternalUnits ? (activeConfig === id || (!activeConfig.startsWith('idx-') && idx === 0)) : activeConfig === id;
                                        if (!isActive) return null;

                                        if (isInternalUnits) {
                                            // Nambiar style rendering
                                            return (
                                                <div key={id} className="unit-content-inner">
                                                    <div className="unit-content-header" style={{ marginBottom: '24px' }}>
                                                        <span className="unit-content-price" style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                                                            {unit.priceRange || unit.price}
                                                        </span>
                                                    </div>

                                                    {unit.configurations && unit.configurations.map((config, cIdx) => (
                                                        <div key={cIdx} style={{ marginBottom: '32px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: '20px' }}>{config.size}</span>
                                                                <span style={{ color: '#6b7280' }}>{config.price}</span>
                                                            </div>
                                                            <div className="floor-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                                                {[config.image3d, config.image2d].filter(Boolean).map((img, iIdx) => (
                                                                    <div key={iIdx} className="floor-plan-item" onClick={() => window.open(img, '_blank')} style={{ position: 'relative', cursor: 'zoom-in', background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9' }}>
                                                                        <img src={img} alt={`Floor Plan ${iIdx}`} style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} />
                                                                        <div className="plan-overlay">
                                                                            <Maximize size={20} />
                                                                            <span>View {iIdx === 0 ? '3D' : '2D'} Plan</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        } else {
                                            // Brigade style rendering
                                            const plans = unit.floorPlan && unit.floorPlan.length > 0 ? unit.floorPlan : [unit.photos[0]].filter(Boolean);
                                            return (
                                                <div key={id} className="unit-content-inner">
                                                    <div className="unit-content-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
                                                        <span className="unit-content-price" style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                                                            {formatPrice(unit.price, unit.priceUnit)}
                                                        </span>
                                                        {unit.dimensions && (
                                                            <span className="unit-content-dim" style={{ marginLeft: '16px', color: '#9ca3af', fontSize: '18px' }}>
                                                                {unit.dimensions}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="floor-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                                                        {plans.length > 0 ? plans.map((fp, fpIdx) => {
                                                            const url = fp.startsWith('http') ? fp : `${BACKEND_URL}${fp.startsWith('/') ? '' : '/'}${fp}`;
                                                            return (
                                                                <div key={fpIdx} className="floor-plan-item" onClick={() => window.open(url, '_blank')} style={{ position: 'relative', cursor: 'zoom-in', background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                    <img src={url} alt="Floor Plan" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                                                                    <div className="plan-overlay">
                                                                        <Maximize size={20} />
                                                                        <span>View Plan</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <div className="no-floor-plan" style={{ padding: '60px', textAlign: 'center', background: '#f9fafb', borderRadius: '16px', color: '#9ca3af', width: '100%' }}>
                                                                No preview available for this configuration.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Bottom Full Width Sections */}
                <div className="detail-full-width-section">

                    {/* Localities & Map */}
                    <div className="detail-section">
                        <h3>Location & Neighborhood</h3>
                        <div className="detail-map-container">
                            <iframe
                                title="Property Location"
                                width="100%"
                                height="350"
                                style={{ border: 0, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                loading="lazy"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(getDisplayTitle(property) + ', ' + property.location)}&output=embed`}
                                allowFullScreen=""
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                            <div className="map-overlay-btn" onClick={() => window.open(`https://www.google.com/maps?q=${encodeURIComponent(getDisplayTitle(property) + ', ' + property.location)}`, '_blank')}>
                                <Maximize size={16} />
                                <span>View in Google Maps</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <div className="calculator-header">
                            <h3 className="calculator-title">Nearby Destinations</h3>
                            <p className="calculator-subtitle">Enter any destination to check driving distance from {getDisplayTitle(property)}</p>
                        </div>
                        <form onSubmit={handleCalculateDistance} className="distance-calc-form">
                            <div className="calc-input-wrapper">
                                <Search size={18} className="calc-search-icon" />
                                <input
                                    type="text"
                                    placeholder="e.g. Kempegowda Airport, Manyata Tech Park"
                                    value={calcDestination}
                                    onChange={(e) => setCalcDestination(e.target.value)}
                                    className="calc-input"
                                />
                                <button type="submit" className="calc-btn" disabled={calcLoading || !calcDestination.trim()}>
                                    {calcLoading ? 'Calculating...' : 'Calculate'}
                                </button>
                            </div>
                        </form>

                        {calcError && <div className="calc-error-msg">{calcError}</div>}

                        {calcResult && (
                            <div className="calc-result-box">
                                <div className="calc-result-item">
                                    <Route size={20} className="result-icon-accent" />
                                    <div className="result-text-group">
                                        <span className="result-label">Distance</span>
                                        <span className="result-value">{calcResult.distanceKm} km</span>
                                    </div>
                                </div>
                                <div className="calc-result-item">
                                    <div className="nearby-icon-wrap" style={{ backgroundColor: 'var(--accent-light, #e0e7ff)', color: 'var(--accent, #4f46e5)', width: '36px', height: '36px', padding: '8px' }}><MapPin size={20} /></div>
                                    <div className="result-text-group">
                                        <span className="result-label">Est. Driving Time</span>
                                        <span className="result-value">{calcResult.durationMin} mins</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="nearby-grid" style={{ marginTop: '24px' }}>
                            <div className="nearby-item" onClick={() => { setCalcDestination('Kempegowda International Airport, Bengaluru'); setTimeout(() => document.querySelector('.distance-calc-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 100); }} style={{ cursor: 'pointer' }}>
                                <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                                <div className="nearby-info">
                                    <span className="nearby-title">International Airport</span>
                                    <span className="nearby-dist">Click to calculate</span>
                                </div>
                            </div>
                            <div className="nearby-item" onClick={() => { setCalcDestination('Manyata Tech Park, Bengaluru'); setTimeout(() => document.querySelector('.distance-calc-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 100); }} style={{ cursor: 'pointer' }}>
                                <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                                <div className="nearby-info">
                                    <span className="nearby-title">Primary Tech Parks</span>
                                    <span className="nearby-dist">Click to calculate</span>
                                </div>
                            </div>
                            <div className="nearby-item">
                                <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                                <div className="nearby-info">
                                    <span className="nearby-title">Hospitals & Schools</span>
                                    <span className="nearby-dist">Within 5-10 km</span>
                                </div>
                            </div>
                            <div className="nearby-item">
                                <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                                <div className="nearby-info">
                                    <span className="nearby-title">Malls & Markets</span>
                                    <span className="nearby-dist">2-5 km away</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Inquiry Modal */}
                {
                    showInquiry && (
                        <div className="inquiry-overlay" onClick={() => setShowInquiry(false)}>
                            <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
                                {inquirySent ? (
                                    <div className="inquiry-success">
                                        <Check size={48} color="var(--accent)" />
                                        <h3>Inquiry Sent!</h3>
                                        <p>We'll get back to you soon</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3>Send Inquiry</h3>
                                        <p className="inquiry-for">About: {getDisplayTitle(property)}</p>
                                        <form onSubmit={handleInquiry}>
                                            {!user && (
                                                <>
                                                    <div className="input-group">
                                                        <label>Name</label>
                                                        <div className="input-field">
                                                            <input type="text" placeholder="Your name" required
                                                                value={inquiryForm.name}
                                                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Email</label>
                                                        <div className="input-field">
                                                            <input type="email" placeholder="Your email" required
                                                                value={inquiryForm.email}
                                                                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Phone</label>
                                                        <div className="input-field">
                                                            <input type="tel" placeholder="Your phone" required
                                                                value={inquiryForm.phone}
                                                                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <div className="input-group">
                                                <label>Message</label>
                                                <div className="input-field" style={{ alignItems: 'flex-start' }}>
                                                    <textarea placeholder="I'm interested in this property..."
                                                        rows="3" style={{ width: '100%', resize: 'vertical', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                                                        value={inquiryForm.message}
                                                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Schedule Site Visit (Optional)</label>
                                                <div className="input-field">
                                                    <input type="date"
                                                        style={{ width: '100%', border: 'none', outline: 'none' }}
                                                        value={inquiryForm.visitDate}
                                                        onChange={(e) => setInquiryForm({ ...inquiryForm, visitDate: e.target.value })} />
                                                </div>
                                            </div>
                                            <button type="submit" className="btn btn-accent btn-full" style={{ marginTop: '16px' }}>
                                                Send Inquiry
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Similar Properties */}
                {
                    similarProperties.length > 0 && (
                        <div className="similar-properties-section">
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h3>Similar Properties</h3>
                                    <p>Explore other {property.category} estates you might like</p>
                                </div>
                                <button className="btn btn-outline" onClick={() => setShowComparisonModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', height: 'auto', borderRadius: '8px' }}>
                                    <GitCompare size={18} />
                                    Compare All
                                </button>
                            </div>
                            <div className="similar-grid">
                                {similarProperties.map(prop => (
                                    <PropertyCard key={prop.id} property={prop} />
                                ))}
                            </div>
                        </div>
                    )
                }

                <div style={{ height: '80px' }} />
            </div>

            {/* Fullscreen Photo Gallery Lightbox */}
            {isGalleryOpen && (
                <div className="photo-lightbox-overlay" onClick={() => setIsGalleryOpen(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <button className="close-lightbox-btn" onClick={() => setIsGalleryOpen(false)} style={{
                        position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer',
                        padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', hover: { background: 'rgba(255,255,255,0.2)' }
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <img src={photos[activePhoto]} alt={`Gallery view ${activePhoto + 1}`} style={{
                        maxWidth: '90vw', maxHeight: '80vh', width: '100%', height: '100%', objectFit: 'contain',
                        borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }} onClick={(e) => e.stopPropagation()} />

                    {photos.length > 1 && (
                        <div className="lightbox-controls" style={{
                            marginTop: '30px', display: 'flex', gap: '24px', alignItems: 'center',
                            background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '100px'
                        }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))} style={{
                                background: 'white', color: 'black', border: 'none', padding: '10px 24px', borderRadius: '100px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                            }}>Previous</button>
                            <div style={{ color: 'white', fontWeight: '500', minWidth: '60px', textAlign: 'center' }}>
                                {activePhoto + 1} <span style={{ opacity: 0.6 }}>/ {photos.length}</span>
                            </div>
                            <button onClick={() => setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))} style={{
                                background: 'white', color: 'black', border: 'none', padding: '10px 24px', borderRadius: '100px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                            }}>Next</button>
                        </div>
                    )}
                </div>
            )}



            {/* Comparison Modal */}
            {showComparisonModal && (
                <div className="comparison-overlay" onClick={() => setShowComparisonModal(false)}>
                    <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="comparison-header">
                            <h3>Property Comparison</h3>
                            <button className="close-lightbox-btn" onClick={() => setShowComparisonModal(false)} style={{
                                background: 'rgba(0,0,0,0.05)', border: 'none', color: '#333', cursor: 'pointer',
                                padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="comparison-table-wrapper">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th className="feature-column">Features</th>
                                        <th className="property-column current-property text-center">
                                            <div className="prop-img-wrap">
                                                <img src={photos[0]} alt={getDisplayTitle(property)} />
                                            </div>
                                            <h4 className="compare-prop-name">{getDisplayTitle(property)}</h4>
                                            <span className="badge badge-current">Current Property</span>
                                        </th>
                                        {similarProperties.map(prop => (
                                            <th key={prop.id} className="property-column text-center">
                                                <div className="prop-img-wrap">
                                                    <img src={prop.photos && prop.photos.length > 0 ? (prop.photos[0].startsWith('http') ? prop.photos[0] : `${BACKEND_URL}${prop.photos[0].startsWith('/') ? '' : '/'}${prop.photos[0]}`) : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop'} alt={getDisplayTitle(prop)} />
                                                </div>
                                                <h4 className="compare-prop-name">{getDisplayTitle(prop)}</h4>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="feature-column">Price</td>
                                        <td className="property-column current-property text-center"><strong>{formatPrice(property.price, property.priceUnit)}</strong></td>
                                        {similarProperties.map(prop => (
                                            <td key={prop.id} className="property-column text-center"><strong>{formatPrice(prop.price, prop.priceUnit)}</strong></td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="feature-column">Location</td>
                                        <td className="property-column current-property text-center">{property.location}</td>
                                        {similarProperties.map(prop => (
                                            <td key={prop.id} className="property-column text-center">{prop.location}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="feature-column">Dimensions</td>
                                        <td className="property-column current-property text-center">{property.dimensions || 'N/A'}</td>
                                        {similarProperties.map(prop => (
                                            <td key={prop.id} className="property-column text-center">{prop.dimensions || 'N/A'}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="feature-column">Amenities</td>
                                        <td className="property-column current-property">
                                            <ul className="comparison-amenities">
                                                {(property.amenities || []).slice(0, 5).map((am, i) => <li key={i}><Check size={14} color="#10b981" /> {am}</li>)}
                                                {(property.amenities || []).length > 5 && <li className="more-am">+{property.amenities.length - 5} more</li>}
                                                {!(property.amenities || []).length && <li>N/A</li>}
                                            </ul>
                                        </td>
                                        {similarProperties.map(prop => (
                                            <td key={prop.id} className="property-column">
                                                <ul className="comparison-amenities">
                                                    {(prop.amenities || []).slice(0, 5).map((am, i) => <li key={i}><Check size={14} color="#10b981" /> {am}</li>)}
                                                    {(prop.amenities || []).length > 5 && <li className="more-am">+{prop.amenities.length - 5} more</li>}
                                                    {!(prop.amenities || []).length && <li>N/A</li>}
                                                </ul>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default PropertyDetail;

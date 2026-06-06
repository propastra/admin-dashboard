import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2, Star, Phone, MessageCircle, Maximize } from 'lucide-react';
import { BiBed } from 'react-icons/bi';
import { addFavorite, removeFavorite, API_BASE, BACKEND_URL, trackInteraction } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import './PropertyCard.css';

const PropertyCard = ({ property, isFavorited = false, onFavoriteToggle, showActions = true, variantCount, allConfigurations, maxPrice, maxPriceUnit }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { ensureIdentified } = useInquiryPopup();

    const displayTitle = property.projectName || property.propertyName.split('-')[0].trim();

    const openPropertyWithInquiry = (e) => {
        if (e) e.stopPropagation();

        // Track "Click" of the card
        trackInteraction({
            interactionType: 'Click',
            propertyId: property.id,
            websiteUserId: user?.id
        }).catch(err => console.error("Tracking error", err));

        // Use ensureIdentified to either navigate immediately (if logged in)
        // or open the popup and navigate after submission.
        ensureIdentified(() => {
            navigate(`/property/${property.id}`);
        }, `To view ${displayTitle}, we'd love to know you better`);
    };

    const photoUrl = property.coverPhoto
        ? (property.coverPhoto.startsWith('http') ? property.coverPhoto : `${BACKEND_URL}${property.coverPhoto.startsWith('/') ? '' : '/'}${property.coverPhoto}`)
        : (property.photos && property.photos.length > 0
            ? (property.photos[0].startsWith('http') ? property.photos[0] : `${BACKEND_URL}${property.photos[0].startsWith('/') ? '' : '/'}${property.photos[0]}`)
            : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=60&w=600');

    const handleFavorite = async (e) => {
        e.stopPropagation();

        const toggle = async () => {
            try {
                if (isFavorited) {
                    await removeFavorite(property.id);
                } else {
                    await addFavorite(property.id);
                }
                if (onFavoriteToggle) onFavoriteToggle(property.id);
            } catch (err) {
                console.error('Favorite action failed:', err);
            }
        };

        if (user) {
            toggle();
        } else {
            ensureIdentified(toggle, 'To save favorites, we\'d love to know you better');
        }
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        const title = displayTitle;
        const url = `${window.location.origin}/property/${property.id}`;
        const text = `Check out ${title} on Ayora`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Web Share API failed:', err);
            }
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch (err) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    alert('Link copied to clipboard!');
                }
            } catch (fallbackErr) {
                alert('Could not copy link.');
            }
        }
    };

    const formatPrice = (price, unit) => {
        const p = parseFloat(price);
        if (isNaN(p)) return '—';
        
        const u = (unit || '').toLowerCase().trim();
        if (u === 'cr' || u === 'crore' || u === 'crores') return `₹${p} Cr`;
        if (u === 'lakhs' || u === 'lakh' || u === 'lac' || u === 'lacs') return `₹${p} Lakhs`;
        if (u === 'thousands' || u === 'thousand' || u === 'k') return `₹${p} Thousand`;
        
        // Fallback for cases where it's a raw large number (e.g. 500000)
        if (p >= 10000000) return `₹${(p / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
        if (p >= 100000) return `₹${(p / 100000).toFixed(2).replace(/\.00$/, '')} Lakhs`;
        if (p >= 1000) return `₹${(p / 1000).toFixed(2).replace(/\.00$/, '')} Thousand`;
        
        return `₹${p.toLocaleString()}`;
    };

    const priceDisplay = `${formatPrice(property.price, property.priceUnit)} onwards`;

    const formatDimensions = (dim) => {
        if (!dim || dim === 'N/A') return 'N/A';
        let str = String(dim).trim();
        
        try {
            if (str.startsWith('[') && str.endsWith(']')) {
                const parsed = JSON.parse(str);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    str = parsed.join(', ');
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        
        if (str.toLowerCase().includes('sq') || str.toLowerCase().includes('acre') || str.toLowerCase().includes('hectare') || str.toLowerCase().includes('ft')) {
            return str;
        }
        return `${str} sq. ft.`;
    };

    // Safe parsing helper
    const parseConfigs = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
                return parsed.map(c => c.configuration);
            }
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const parsedConfigsFromProperty = parseConfigs(property.configuration);

    const configsList = (allConfigurations && allConfigurations.length > 0)
        ? allConfigurations
        : (property.configurations && property.configurations.length > 0)
            ? property.configurations
            : parsedConfigsFromProperty;

    const configDisplay = configsList.length > 0
        ? configsList.join(', ')
        : (typeof property.configuration === 'string' ? property.configuration : '');

    const effectiveVariantCount = variantCount || configsList.length;

    const rating = (4 + Math.random()).toFixed(1);

    return (
        <div className="property-card" onClick={openPropertyWithInquiry}>
            <div className="property-card-image">
                <img 
                    src={photoUrl} 
                    alt={displayTitle} 
                    loading="lazy" 
                    decoding="async" 
                    width="400" 
                    height="240" 
                    style={{ filter: property.isSoldOut ? 'grayscale(0.35) brightness(0.82)' : 'none', transition: 'filter 0.3s ease' }}
                />
                <div className="property-card-badges">
                    <span className="badge-category">{property.category}</span>
                    {property.isSoldOut && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
                            color: 'white', fontSize: '10px', fontWeight: '800',
                            padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px',
                            textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
                            border: '1px solid rgba(255,255,255,0.25)'
                        }}>
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                                <rect x="1" y="1" width="18" height="18" rx="3" fill="none" stroke="white" strokeWidth="2"/>
                                <line x1="5" y1="5" x2="15" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                <line x1="15" y1="5" x2="5" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                            Sold Out
                        </span>
                    )}
                    {property.distance && (
                        <span className="badge-distance">{property.distance} km away</span>
                    )}
                </div>
                {effectiveVariantCount > 1 && (
                    <div className="badge-variants">{effectiveVariantCount} configs</div>
                )}
                <div className="property-card-actions">
                    <button
                        className={`action-icon ${isFavorited ? 'favorited' : ''}`}
                        onClick={handleFavorite}
                    >
                        <Heart size={18} fill={isFavorited ? '#EF476F' : 'none'} color={isFavorited ? '#EF476F' : 'currentColor'} />
                    </button>
                    <button className="action-icon" onClick={handleShare}>
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            <div className="property-card-body">
                <div className="property-card-header">
                    <h3 className="property-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{displayTitle}</span>
                        {property.isVerified && (
                            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" title="Verified Property" style={{ flexShrink: 0 }}>
                                <circle cx="20" cy="20" r="19" fill="#10B981" />
                                <path d="M12 20.5l5.5 5.5 11-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                {[0,45,90,135,180,225,270,315].map((angle, i) => (
                                    <rect key={i} x="18.5" y="0" width="3" height="5" rx="1.5" fill="#10B981"
                                        transform={`rotate(${angle} 20 20)`} />
                                ))}
                            </svg>
                        )}
                        {property.isSoldOut && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
                                color: 'white', fontSize: '9px', fontWeight: '800',
                                padding: '2px 5px', borderRadius: '3px', letterSpacing: '0.5px',
                                textTransform: 'uppercase', flexShrink: 0
                            }}>
                                <svg width="8" height="8" viewBox="0 0 20 20" fill="none">
                                    <line x1="3" y1="3" x2="17" y2="17" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                    <line x1="17" y1="3" x2="3" y2="17" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                                Sold Out
                            </span>
                        )}
                    </h3>
                    <div className="property-card-rating">
                        <Star size={14} fill="#FFB703" color="#FFB703" />
                        <span>{rating}</span>
                    </div>
                </div>

                <p className="property-card-price">
                    {priceDisplay}
                </p>
                <p className="property-card-location">{property.location}</p>

                <div className="property-card-meta">
                    {property.dimensions && (
                        <span><Maximize size={14} /> {formatDimensions(property.dimensions)}</span>
                    )}
                    {configDisplay && !property.category?.toLowerCase().includes('plot') && (
                        <span><BiBed size={14} /> {configDisplay}</span>
                    )}
                </div>

                {showActions && (
                    <div className="property-card-cta">
                        <button className="cta-call" onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = 'tel:8147069579';
                        }}>
                            <Phone size={14} /> Call us
                        </button>
                        <button className="cta-message" onClick={(e) => {
                            e.stopPropagation();
                            window.open('https://wa.me/919731530103', '_blank', 'noopener,noreferrer');
                        }}>
                            <MessageCircle size={14} /> Message
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(PropertyCard);

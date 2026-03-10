import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2, Star, Phone, MessageCircle, Maximize } from 'lucide-react';
import { BiBed } from 'react-icons/bi';
import { addFavorite, removeFavorite, API_BASE, BACKEND_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import './PropertyCard.css';

const PropertyCard = ({ property, isFavorited = false, onFavoriteToggle, showActions = true }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { ensureIdentified } = useInquiryPopup();

    const displayTitle = property.projectName || property.propertyName.split('-')[0].trim();

    const openPropertyWithInquiry = (e) => {
        if (e) e.stopPropagation();

        // Use ensureIdentified to either navigate immediately (if logged in)
        // or open the popup and navigate after submission.
        ensureIdentified(() => {
            navigate(`/property/${property.id}`);
        }, `To view ${displayTitle}, we'd love to know you better`);
    };

    const photoUrl = property.photos && property.photos.length > 0
        ? (property.photos[0].startsWith('http') ? property.photos[0] : `${BACKEND_URL}${property.photos[0].startsWith('/') ? '' : '/'}${property.photos[0]}`)
        : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop';

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

    const formatPrice = (price, unit) => {
        const p = parseFloat(price);
        if (unit === 'Cr') return `₹${p} Cr`;
        if (unit === 'Lakhs') return `₹${p} L`;
        return `₹${p.toLocaleString()}`;
    };

    const rating = (4 + Math.random()).toFixed(1);

    return (
        <div className="property-card" onClick={openPropertyWithInquiry}>
            <div className="property-card-image">
                <img src={photoUrl} alt={displayTitle} />
                <div className="property-card-badges">
                    <span className="badge-category">{property.category}</span>
                    {property.distance && (
                        <span className="badge-distance">{property.distance} km away</span>
                    )}
                </div>
                <div className="property-card-actions">
                    <button
                        className={`action-icon ${isFavorited ? 'favorited' : ''}`}
                        onClick={handleFavorite}
                    >
                        <Heart size={18} fill={isFavorited ? '#EF476F' : 'none'} color={isFavorited ? '#EF476F' : 'currentColor'} />
                    </button>
                    <button className="action-icon" onClick={(e) => e.stopPropagation()}>
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            <div className="property-card-body">
                <div className="property-card-header">
                    <h3 className="property-card-title">{displayTitle}</h3>
                    <div className="property-card-rating">
                        <Star size={14} fill="#FFB703" color="#FFB703" />
                        <span>{rating}</span>
                    </div>
                </div>

                <p className="property-card-price">
                    {formatPrice(property.price, property.priceUnit)}
                </p>
                <p className="property-card-location">{property.location}</p>

                <div className="property-card-meta">
                    {property.dimensions && (
                        <span><Maximize size={14} /> {property.dimensions}</span>
                    )}
                    {property.configuration && (
                        <span><BiBed size={14} /> {property.configuration}</span>
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
                        <button className="cta-message" onClick={openPropertyWithInquiry}>
                            <MessageCircle size={14} /> Message
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyCard;

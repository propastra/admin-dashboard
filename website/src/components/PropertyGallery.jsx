import React, { useState } from 'react';
import { Maximize, ChevronLeft, ChevronRight } from 'lucide-react';

const PropertyGallery = ({ photos, user, ensureIdentified, BACKEND_URL }) => {
    const [activePhoto, setActivePhoto] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    return (
        <>
            {/* Masonry Gallery */}
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
                        padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
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
                            <button 
                                onClick={() => setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))} 
                                disabled={photos.length <= 1}
                                style={{
                                    background: photos.length <= 1 ? 'rgba(255,255,255,0.1)' : 'white', 
                                    color: photos.length <= 1 ? 'rgba(255,255,255,0.3)' : 'black', 
                                    border: 'none', width: '44px', height: '44px', borderRadius: '50%', 
                                    cursor: photos.length <= 1 ? 'default' : 'pointer', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ color: 'white', fontWeight: '600', minWidth: '80px', textAlign: 'center', fontSize: '16px' }}>
                                {activePhoto + 1} <span style={{ opacity: 0.5, fontWeight: '400', margin: '0 4px' }}>/</span> {photos.length}
                            </div>
                            <button 
                                onClick={() => setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))} 
                                disabled={photos.length <= 1}
                                style={{
                                    background: photos.length <= 1 ? 'rgba(255,255,255,0.1)' : 'white', 
                                    color: photos.length <= 1 ? 'rgba(255,255,255,0.3)' : 'black', 
                                    border: 'none', width: '44px', height: '44px', borderRadius: '50%', 
                                    cursor: photos.length <= 1 ? 'default' : 'pointer', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default PropertyGallery;

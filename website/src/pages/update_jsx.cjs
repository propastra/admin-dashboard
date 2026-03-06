#!/usr/bin/env node
const fs = require('fs');
const file = './PropertyDetail.jsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = '            {/* Split Container for Desktop */}';
const endMarker = '            {/* Bottom Full Width Sections */}';

if (content.includes(startMarker) && content.includes(endMarker)) {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    const replacement = `            {/* 1. Header Row */}
            <div className="detail-header-section">
                <div className="header-breadcrumbs">
                    <span>Home</span> &gt; <span>Property in {property.location ? property.location.split(',')[0] : 'Area'}</span> &gt; <span>{property.category} in {property.location}</span>
                </div>
                <div className="header-main-flex">
                    <div className="header-left-info">
                        <div className="header-price-row">
                            <h2 className="header-price">{formatPrice(property.price, property.priceUnit)}</h2>
                            <p className="header-emi">EMI - ₹ 2.18L | Need Home Loan?</p>
                        </div>
                        <h1 className="header-title">{property.dimensions ? \`\${property.dimensions} \` : ''}{property.configuration ? \`\${property.configuration} \` : ''}{property.category} For Sale in {property.location}</h1>
                    </div>
                    <div className="header-right-actions">
                        <div className="owner-badge">
                            <span className="owner-text">Contact Owner</span>
                            <span className="owner-name">Agent</span>
                        </div>
                        <div className="header-action-btns">
                            <button className="btn btn-accent btn-sm cta-header-call" onClick={() => window.location.href = 'tel:8147069579'}>
                                Contact Owner
                            </button>
                            <button className="action-circle-sm"><Heart size={16} /></button>
                            <button className="action-circle-sm"><Share2 size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Masonry Gallery */}
            <div className="detail-masonry-gallery">
                {/* Main large image */}
                <div className="col-main image-wrap" onClick={() => setActivePhoto(0)}>
                    <img src={photos[0]} alt="Main view" className="masonry-img main-img" />
                </div>
                
                {/* 2x2 Grid of smaller images */}
                <div className="col-grid">
                    {photos.slice(1, 5).map((photo, idx) => (
                        <div key={idx} className="image-wrap" onClick={() => setActivePhoto(idx + 1)}>
                            <img src={photo} alt={\`View \${idx + 2}\`} className="masonry-img" />
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
                        <div key={\`empty-\${i}\`} className="image-wrap empty-wrap">
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
                        <span className="metric-label">Furnished Status</span>
                        <span className="metric-value">Unfurnished</span>
                    </div>
                </div>

                {/* Main Card CTA Row */}
                <div className="card-bottom-cta">
                    <button className="btn btn-accent btn-wide" onClick={() => window.location.href = 'tel:8147069579'}>
                        Contact Owner
                    </button>
                    <button className="btn btn-outline btn-wide" onClick={() => setShowInquiry(true)}>
                        Ask Society Name
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
                    
                    {property.description && (
                       <>
                           <h3 style={{ marginTop: '32px' }}>Description</h3>
                           <p className="description-text">{property.description}</p>
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
            </div>

`;
    const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(file, newContent);
    console.log("Successfully replaced DOM structure.");
} else {
    console.log("Could not find markers.");
}

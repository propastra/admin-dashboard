import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Scale, MapPin, Ruler, IndianRupee, Star, CheckCircle } from 'lucide-react';
import { getProperties, BACKEND_URL, trackInteraction } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CompareModal.css';

const CompareModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [results1, setResults1] = useState([]);
  const [results2, setResults2] = useState([]);
  const [prop1, setProp1] = useState(null);
  const [prop2, setProp2] = useState(null);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [siblings1, setSiblings1] = useState([]);
  const [siblings2, setSiblings2] = useState([]);

  useEffect(() => {
    if (showDropdown1) {
      searchProps(searchTerm1, setResults1);
    }
  }, [searchTerm1, showDropdown1]);

  useEffect(() => {
    if (showDropdown2) {
      searchProps(searchTerm2, setResults2);
    }
  }, [searchTerm2, showDropdown2]);

  const searchProps = async (query, setResults) => {
    try {
      const params = { limit: 10 };
      if (query.length > 0) {
        params.search = query;  // fixed: was 'q', backend expects 'search'
      }
      const res = await getProperties(params);
      setResults(res.data.properties || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getProjectName = (p) => {
    if (!p) return '';
    const raw = p.projectName || p.propertyName.split('-')[0].trim();
    return raw.split('  ')[0].trim();
  };

  const loadSiblings = async (p, setSiblings) => {
    try {
      const projName = getProjectName(p);
      const res = await getProperties({ search: projName, limit: 20 });
      const props = (res.data.properties || []).filter(item => {
        const itemProj = getProjectName(item);
        return itemProj.toLowerCase() === projName.toLowerCase();
      });
      setSiblings(props);
    } catch (err) {
      console.error('Failed to load siblings', err);
    }
  };

  const handleSelect = (prop, setProp, setResults, setTerm, setShow, setSiblings) => {
    setProp(prop);
    setResults([]);
    setTerm(getProjectName(prop));
    setShow(false);
    setIsComparing(false);
    loadSiblings(prop, setSiblings);
  };

  // Fixed: backend URL construction — photos are served at BACKEND_URL/uploads/...
  const getPhotoUrl = (property) => {
    if (!property) return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800';

    if (property.coverPhoto) {
      if (property.coverPhoto.startsWith('http')) return property.coverPhoto;
      return `${BACKEND_URL}${property.coverPhoto.startsWith('/') ? '' : '/'}${property.coverPhoto}`;
    }
    if (property.photos && property.photos.length > 0) {
      const photo = property.photos[0];
      if (photo.startsWith('http')) return photo;
      return `${BACKEND_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800';
  };

  const formatPrice = (price, unit) => {
    if (!price) return 'N/A';
    const p = parseFloat(price);
    if (isNaN(p)) return `${price} ${unit || ''}`;
    if (unit === 'Cr') return `₹${p} Cr`;
    if (unit === 'Lakhs') return `₹${p} Lakhs`;
    return `₹${p.toLocaleString()}`;
  };

  const formatAmenities = (amenities) => {
    if (!amenities) return 'Standard';
    if (Array.isArray(amenities)) return amenities.slice(0, 5).join(', ') + (amenities.length > 5 ? ` +${amenities.length - 5} more` : '');
    if (typeof amenities === 'string') {
      try {
        const parsed = JSON.parse(amenities);
        if (Array.isArray(parsed)) return parsed.slice(0, 5).join(', ') + (parsed.length > 5 ? ` +${parsed.length - 5} more` : '');
      } catch {
        return amenities;
      }
    }
    return String(amenities);
  };

  const formatDimensions = (dim) => {
    if (!dim) return null;
    const str = String(dim).trim();
    if (str.toLowerCase().includes('sq') || str.toLowerCase().includes('acre') || str.toLowerCase().includes('ft')) return str;
    return `${str} sq. ft.`;
  };

  // Sort sibling configurations numerically
  const sortedSiblings = (siblings) => {
    return [...siblings].sort((a, b) => {
      const numA = parseFloat(a.configuration) || 0;
      const numB = parseFloat(b.configuration) || 0;
      if (numA !== numB) return numA - numB;
      return (a.configuration || '').localeCompare(b.configuration || '');
    });
  };

  if (!isOpen) return null;

  const renderPropCard = (prop) => {
    if (!prop) return null;
    return (
      <div className="selected-prop-card">
        <div className="selected-prop-img-wrap">
          <img
            src={getPhotoUrl(prop)}
            alt={prop.propertyName}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800';
            }}
          />
          <div className="selected-prop-badge">{prop.category}</div>
        </div>
        <div className="card-info">
          <h4>{getProjectName(prop)}</h4>
          <p><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{prop.location || 'N/A'}</p>
          <p style={{ fontWeight: 700, color: '#3B3F8C', marginTop: 4 }}>{formatPrice(prop.price, prop.priceUnit)} onwards</p>
        </div>
      </div>
    );
  };

  return (
    <div className="compare-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="compare-modal">
        <div className="compare-header">
          <h2>Compare Properties</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="compare-body">
          <div className="compare-selection">
            {/* Property 1 Column */}
            <div className="property-column">
              <div className="column-label">Property 1</div>
              <div className="search-box-wrap">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Search Property 1..."
                    value={searchTerm1}
                    onChange={(e) => { setSearchTerm1(e.target.value); setShowDropdown1(true); }}
                    onFocus={() => setShowDropdown1(true)}
                  />
                  <ChevronRight
                    className={`arrow-icon ${showDropdown1 ? 'rotate' : ''}`}
                    onClick={() => setShowDropdown1(!showDropdown1)}
                  />
                </div>
                {showDropdown1 && (results1.length > 0 || searchTerm1.length > 1) && (
                  <div className="search-dropdown">
                    {results1.map(p => (
                      <div
                        key={p.id}
                        className="dropdown-item"
                        onClick={() => handleSelect(p, setProp1, setResults1, setSearchTerm1, setShowDropdown1, setSiblings1)}
                      >
                        <div className="item-img">
                          <img
                            src={getPhotoUrl(p)}
                            alt=""
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=200'; }}
                          />
                        </div>
                        <div className="item-info">
                          <div className="item-name">{p.propertyName}</div>
                          <div className="item-loc"><MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />{p.location || 'N/A'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#3B3F8C', marginTop: 2 }}>{formatPrice(p.price, p.priceUnit)}</div>
                        </div>
                      </div>
                    ))}
                    {results1.length === 0 && <div className="no-results">No properties found</div>}
                  </div>
                )}
              </div>
              {renderPropCard(prop1)}
            </div>

            {/* Middle VS Button */}
            <div className="compare-btn-wrap">
              <button
                className={`compare-action-btn ${prop1 && prop2 ? 'active' : ''}`}
                disabled={!prop1 || !prop2}
                onClick={() => {
                  setIsComparing(true);
                  trackInteraction({
                    interactionType: 'Comparison',
                    websiteUserId: user?.id,
                    metadata: {
                      propertyIds: [prop1.id, prop2.id],
                      propertyNames: [prop1.propertyName, prop2.propertyName]
                    }
                  }).catch(err => console.error('Tracking error', err));
                }}
              >
                <Scale size={24} />
                <span>COMPARE</span>
              </button>
            </div>

            {/* Property 2 Column */}
            <div className="property-column">
              <div className="column-label">Property 2</div>
              <div className="search-box-wrap">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Search Property 2..."
                    value={searchTerm2}
                    onChange={(e) => { setSearchTerm2(e.target.value); setShowDropdown2(true); }}
                    onFocus={() => setShowDropdown2(true)}
                  />
                  <ChevronRight
                    className={`arrow-icon ${showDropdown2 ? 'rotate' : ''}`}
                    onClick={() => setShowDropdown2(!showDropdown2)}
                  />
                </div>
                {showDropdown2 && (results2.length > 0 || searchTerm2.length > 1) && (
                  <div className="search-dropdown">
                    {results2.map(p => (
                      <div
                        key={p.id}
                        className="dropdown-item"
                        onClick={() => handleSelect(p, setProp2, setResults2, setSearchTerm2, setShowDropdown2, setSiblings2)}
                      >
                        <div className="item-img">
                          <img
                            src={getPhotoUrl(p)}
                            alt=""
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=200'; }}
                          />
                        </div>
                        <div className="item-info">
                          <div className="item-name">{p.propertyName}</div>
                          <div className="item-loc"><MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />{p.location || 'N/A'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#3B3F8C', marginTop: 2 }}>{formatPrice(p.price, p.priceUnit)}</div>
                        </div>
                      </div>
                    ))}
                    {results2.length === 0 && <div className="no-results">No properties found</div>}
                  </div>
                )}
              </div>
              {renderPropCard(prop2)}
            </div>
          </div>

          {/* Comparison Table */}
          {isComparing && prop1 && prop2 && (
            <div className="comparison-results anim-fade-in">
              <div className="comparison-table">

                {/* Header Row with photos */}
                <div className="table-row header">
                  <div className="feature-cell">Feature</div>
                  <div className="prop-cell prop-header">
                    <img src={getPhotoUrl(prop1)} alt="" className="compare-thumb"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=200'; }} />
                    <span>{getProjectName(prop1)}</span>
                  </div>
                  <div className="prop-cell prop-header">
                    <img src={getPhotoUrl(prop2)} alt="" className="compare-thumb"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=200'; }} />
                    <span>{getProjectName(prop2)}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="table-row">
                  <div className="feature-cell"><IndianRupee size={16} /> Starting Price</div>
                  <div className="prop-cell highlight">{formatPrice(prop1.price, prop1.priceUnit)}</div>
                  <div className="prop-cell highlight">{formatPrice(prop2.price, prop2.priceUnit)}</div>
                </div>

                {/* Category */}
                <div className="table-row">
                  <div className="feature-cell">🏠 Type</div>
                  <div className="prop-cell">{prop1.category || 'N/A'}</div>
                  <div className="prop-cell">{prop2.category || 'N/A'}</div>
                </div>

                {/* Location */}
                <div className="table-row">
                  <div className="feature-cell"><MapPin size={16} /> Location</div>
                  <div className="prop-cell">{prop1.location || 'N/A'}</div>
                  <div className="prop-cell">{prop2.location || 'N/A'}</div>
                </div>

                {/* Configurations / Dimensions */}
                <div className="table-row">
                  <div className="feature-cell"><Ruler size={16} /> Configurations</div>
                  <div className="prop-cell">
                    <div className="units-count">{siblings1.length > 1 ? `${siblings1.length} variants` : '1 variant'}</div>
                    {sortedSiblings(siblings1).length > 0 ? (
                      <div className="units-list">
                        {sortedSiblings(siblings1).map((s, i) => (
                          <div key={i} className="unit-row">
                            <span className="unit-config">{s.configuration || 'Unit'}</span>
                            {s.dimensions && <span className="unit-dim">{formatDimensions(s.dimensions)}</span>}
                            <span className="unit-price">{formatPrice(s.price, s.priceUnit)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>{formatDimensions(prop1.dimensions) || 'N/A'}</div>
                    )}
                  </div>
                  <div className="prop-cell">
                    <div className="units-count">{siblings2.length > 1 ? `${siblings2.length} variants` : '1 variant'}</div>
                    {sortedSiblings(siblings2).length > 0 ? (
                      <div className="units-list">
                        {sortedSiblings(siblings2).map((s, i) => (
                          <div key={i} className="unit-row">
                            <span className="unit-config">{s.configuration || 'Unit'}</span>
                            {s.dimensions && <span className="unit-dim">{formatDimensions(s.dimensions)}</span>}
                            <span className="unit-price">{formatPrice(s.price, s.priceUnit)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>{formatDimensions(prop2.dimensions) || 'N/A'}</div>
                    )}
                  </div>
                </div>

                {/* Construction status */}
                <div className="table-row">
                  <div className="feature-cell">🏗️ Construction</div>
                  <div className="prop-cell">{prop1.possessionStatus || 'N/A'}</div>
                  <div className="prop-cell">{prop2.possessionStatus || 'N/A'}</div>
                </div>

                {/* Possession Time */}
                <div className="table-row">
                  <div className="feature-cell">📅 Possession</div>
                  <div className="prop-cell">{prop1.possessionTime || 'N/A'}</div>
                  <div className="prop-cell">{prop2.possessionTime || 'N/A'}</div>
                </div>

                {/* RERA */}
                <div className="table-row">
                  <div className="feature-cell"><CheckCircle size={16} /> RERA No.</div>
                  <div className="prop-cell" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{prop1.reraNumber || 'N/A'}</div>
                  <div className="prop-cell" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{prop2.reraNumber || 'N/A'}</div>
                </div>

                {/* Amenities */}
                <div className="table-row">
                  <div className="feature-cell">✨ Amenities</div>
                  <div className="prop-cell">{formatAmenities(prop1.amenities)}</div>
                  <div className="prop-cell">{formatAmenities(prop2.amenities)}</div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareModal;

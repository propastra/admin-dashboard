import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Scale, MapPin, Ruler, Home, IndianRupee } from 'lucide-react';
import { getProperties, BACKEND_URL } from '../services/api';
import './CompareModal.css';

const CompareModal = ({ isOpen, onClose }) => {
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
        params.q = query;
      }
      const res = await getProperties(params);
      setResults(res.data.properties);
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
    setTerm(prop.propertyName);
    setShow(false);
    setIsComparing(false);
    loadSiblings(prop, setSiblings);
  };

  const getPhotoUrl = (property) => {
    if (property.photos && property.photos.length > 0) {
      const photo = property.photos[0];
      if (photo.startsWith('http')) return photo;
      const baseUrl = BACKEND_URL.replace('/api', '');
      return `${baseUrl}${photo.startsWith('/') ? '' : '/'}${photo}`;
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop';
  };

  const formatPrice = (price, unit) => {
    if (!price) return 'N/A';
    const p = parseFloat(price);
    if (isNaN(p)) return `${price} ${unit || ''}`;
    
    // Better verbalizing for "mention on words"
    const unitMap = {
      'Cr': 'Crores',
      'Lakhs': 'Lakhs'
    };
    const unitLabel = unitMap[unit] || unit || '';
    
    return `Starting at ₹${p} ${unitLabel}`;
  };

  if (!isOpen) return null;

  return (
    <div className="compare-overlay">
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
                    onChange={(e) => {
                      setSearchTerm1(e.target.value);
                      setShowDropdown1(true);
                    }}
                    onFocus={() => setShowDropdown1(true)}
                  />
                  <ChevronRight 
                    className={`arrow-icon ${showDropdown1 ? 'rotate' : ''}`} 
                    onClick={() => setShowDropdown1(!showDropdown1)}
                  />
                </div>
                {showDropdown1 && (results1.length > 0 || searchTerm1.length > 2) && (
                  <div className="search-dropdown">
                    {results1.map(p => (
                      <div 
                        key={p.id} 
                        className="dropdown-item"
                        onClick={() => handleSelect(p, setProp1, setResults1, setSearchTerm1, setShowDropdown1, setSiblings1)}
                      >
                        <div className="item-img">
                          <img src={getPhotoUrl(p)} alt="" />
                        </div>
                        <div className="item-info">
                          <div className="item-name">{p.propertyName}</div>
                          <div className="item-loc">{p.address}</div>
                        </div>
                      </div>
                    ))}
                    {results1.length === 0 && <div className="no-results">No properties found</div>}
                  </div>
                )}
              </div>
              
              {prop1 && (
                <div className="selected-prop-card">
                  <img src={getPhotoUrl(prop1)} alt="" />
                  <div className="card-info">
                    <h4>{prop1.propertyName}</h4>
                    <p>{prop1.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Middle Button */}
            <div className="compare-btn-wrap">
              <button 
                className={`compare-action-btn ${prop1 && prop2 ? 'active' : ''}`}
                disabled={!prop1 || !prop2}
                onClick={() => setIsComparing(true)}
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
                    onChange={(e) => {
                      setSearchTerm2(e.target.value);
                      setShowDropdown2(true);
                    }}
                    onFocus={() => setShowDropdown2(true)}
                  />
                  <ChevronRight 
                    className={`arrow-icon ${showDropdown2 ? 'rotate' : ''}`} 
                    onClick={() => setShowDropdown2(!showDropdown2)}
                  />
                </div>
                {showDropdown2 && (results2.length > 0 || searchTerm2.length > 2) && (
                  <div className="search-dropdown">
                    {results2.map(p => (
                      <div 
                        key={p.id} 
                        className="dropdown-item"
                        onClick={() => handleSelect(p, setProp2, setResults2, setSearchTerm2, setShowDropdown2, setSiblings2)}
                      >
                        <div className="item-img">
                          <img src={getPhotoUrl(p)} alt="" />
                        </div>
                        <div className="item-info">
                          <div className="item-name">{p.propertyName}</div>
                          <div className="item-loc">{p.address}</div>
                        </div>
                      </div>
                    ))}
                    {results2.length === 0 && <div className="no-results">No properties found</div>}
                  </div>
                )}
              </div>

              {prop2 && (
                <div className="selected-prop-card">
                  <img src={getPhotoUrl(prop2)} alt="" />
                  <div className="card-info">
                    <h4>{prop2.propertyName}</h4>
                    <p>{prop2.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isComparing && prop1 && prop2 && (
            <div className="comparison-results anim-fade-in">
              <div className="comparison-table">
                <div className="table-row header">
                  <div className="feature-cell">Feature</div>
                  <div className="prop-cell">{prop1.propertyName}</div>
                  <div className="prop-cell">{prop2.propertyName}</div>
                </div>
                
                <div className="table-row">
                  <div className="feature-cell"><IndianRupee size={16} /> Starting Price</div>
                  <div className="prop-cell">{formatPrice(prop1.price, prop1.priceUnit)}</div>
                  <div className="prop-cell">{formatPrice(prop2.price, prop2.priceUnit)}</div>
                </div>

                <div className="table-row">
                  <div className="feature-cell"><MapPin size={16} /> Location</div>
                  <div className="prop-cell">{prop1.address || prop1.location}</div>
                  <div className="prop-cell">{prop2.address || prop2.location}</div>
                </div>

                <div className="table-row">
                  <div className="feature-cell"><Ruler size={16} /> Area & Dimensions</div>
                  <div className="prop-cell">
                    <div style={{ fontWeight: '700', color: '#10b981', fontSize: '12px', marginBottom: '8px' }}>
                      {siblings1.length > 0 ? `${siblings1.length} Units available` : '1 Unit available'}
                    </div>
                    {siblings1.length > 0 ? (
                      <div className="units-list">
                        {siblings1.map((s, i) => (
                          <div key={i} style={{ fontSize: '11px', marginBottom: '6px', paddingBottom: '4px', borderBottom: i < siblings1.length - 1 ? '1px dashed #eee' : 'none' }}>
                            <div style={{ fontWeight: '600' }}>{s.configuration || 'Unit'}</div>
                            <div style={{ color: '#64748b' }}>{s.sqft} sqft {s.dimensions ? `| ${s.dimensions}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div>{prop1.sqft ? `${prop1.sqft} sqft` : 'N/A'}</div>
                        {prop1.dimensions && <div style={{ fontSize: '11px', color: '#64748b' }}>({prop1.dimensions})</div>}
                      </>
                    )}
                  </div>
                  <div className="prop-cell">
                    <div style={{ fontWeight: '700', color: '#10b981', fontSize: '12px', marginBottom: '8px' }}>
                      {siblings2.length > 0 ? `${siblings2.length} Units available` : '1 Unit available'}
                    </div>
                    {siblings2.length > 0 ? (
                      <div className="units-list">
                        {siblings2.map((s, i) => (
                          <div key={i} style={{ fontSize: '11px', marginBottom: '6px', paddingBottom: '4px', borderBottom: i < siblings2.length - 1 ? '1px dashed #eee' : 'none' }}>
                            <div style={{ fontWeight: '600' }}>{s.configuration || 'Unit'}</div>
                            <div style={{ color: '#64748b' }}>{s.sqft} sqft {s.dimensions ? `| ${s.dimensions}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div>{prop2.sqft ? `${prop2.sqft} sqft` : 'N/A'}</div>
                        {prop2.dimensions && <div style={{ fontSize: '11px', color: '#64748b' }}>({prop2.dimensions})</div>}
                      </>
                    )}
                  </div>
                </div>

                <div className="table-row">
                  <div className="feature-cell">✨ Amenities</div>
                  <div className="prop-cell">{prop1.amenities || 'Standard'}</div>
                  <div className="prop-cell">{prop2.amenities || 'Standard'}</div>
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

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, X, ArrowLeft, ChevronDown, ChevronUp, Home as HomeIcon, MapPin } from 'lucide-react';
import { getProperties, getFavorites, trackInteraction } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import './SearchPage.css';

const propertyTypes = {
    residential: [
        { label: 'Flat', value: 'Residential', type: 'category' },
        { label: 'House/Villa', value: 'Villa', type: 'category' },
        { label: 'Plot', value: 'Plot', type: 'category' },
    ],
    bhk: [
        { label: '1 Bhk', value: '1 BHK', type: 'config' },
        { label: '2 Bhk', value: '2 BHK', type: 'config' },
        { label: '3 Bhk', value: '3 BHK', type: 'config' },
        { label: '4 Bhk', value: '4 BHK', type: 'config' },
        { label: '5 Bhk', value: '5 BHK', type: 'config' },
        { label: '5+ Bhk', value: '5+ BHK', type: 'config' },
    ],

    others: [
        { label: 'Farm Land', value: 'Farm Land', type: 'category' },
        { label: 'Resale', value: 'Resale', type: 'category' },
        { label: 'Rental', value: 'Rental', type: 'category' },
    ],
    plotDimensions: [
        { label: '1200 Sqft', value: '1,200', type: 'dimension' },
        { label: '1500 Sqft', value: '1,500', type: 'dimension' },
        { label: '1800 Sqft', value: '1,800', type: 'dimension' },
        { label: '2400 Sqft', value: '2,400', type: 'dimension' },
        { label: '3000+ Sqft', value: '3,000+', type: 'dimension' },
    ]
};

const pricePoints = [
    { label: 'Min', value: '' },
    { label: '₹5 Lac', value: '500000' },
    { label: '₹10 Lac', value: '1000000' },
    { label: '₹20 Lac', value: '2000000' },
    { label: '₹30 Lac', value: '3000000' },
    { label: '₹40 Lac', value: '4000000' },
    { label: '₹50 Lac', value: '5000000' },
    { label: '₹60 Lac', value: '6000000' },
    { label: '₹70 Lac', value: '7000000' },
    { label: '₹80 Lac', value: '8000000' },
    { label: '₹90 Lac', value: '9000000' },
    { label: '₹1 Cr', value: '10000000' },
    { label: '₹1.5 Cr', value: '15000000' },
    { label: '₹2 Cr', value: '20000000' },
    { label: '₹5 Cr', value: '50000000' },
    { label: '₹10 Cr', value: '100000000' },
];

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [properties, setProperties] = useState([]);
    const [allGroupedProperties, setAllGroupedProperties] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [favoriteIds, setFavoriteIds] = useState(new Set());

    // Dropdown visibility
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [budgetMode, setBudgetMode] = useState('min'); // 'min' or 'max'

    const [filters, setFilters] = useState({
        search: searchParams.get('q') || '',
        city: searchParams.get('city') || '',
        categories: searchParams.get('category') ? searchParams.get('category').split(',') : [],
        configurations: [],
        minPrice: '',
        maxPrice: '',
        possessionStatus: [],
        furnishingStatus: [],
        dimension: [],
    });

    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('DESC');

    const dropdownRef = useRef(null);

    useEffect(() => {
        loadProperties();
    }, [filters.search, filters.city, filters.categories, filters.configurations, filters.dimension, filters.minPrice, filters.maxPrice, filters.possessionStatus, filters.furnishingStatus, sortBy, sortOrder]);

    useEffect(() => {
        const start = (page - 1) * 20;
        const end = start + 20;
        setProperties(allGroupedProperties.slice(start, end));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page, allGroupedProperties]);

    useEffect(() => {
        if (user) loadFavorites();
        else setFavoriteIds(new Set());
    }, [user]);

    // Handle clicks outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // If clicking outside, close everything
                if (!event.target.closest('.filter-dropdown')) {
                    setShowTypeDropdown(false);
                    setShowBudgetDropdown(false);
                    setShowMoreFilters(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadProperties = async (overridePage) => {
        const params = { page: 1, limit: 5000 };
        if (filters.search) params.search = filters.search;
        if (filters.city) params.city = filters.city;
        if (filters.categories.length > 0) params.category = filters.categories.join(',');
        if (filters.configurations.length > 0) params.configurations = filters.configurations.join(',');
        if (filters.dimension && filters.dimension.length > 0) params.dimension = filters.dimension.join(',');
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.possessionStatus && filters.possessionStatus.length > 0) params.possessionStatus = filters.possessionStatus.join(',');
        if (filters.furnishingStatus && filters.furnishingStatus.length > 0) params.furnishingStatus = filters.furnishingStatus.join(',');

        params.sortBy = sortBy;
        params.sortOrder = sortOrder;

        console.log('Frontend Requesting Properties:', params);
        setLoading(true);
        try {
            const res = await getProperties(params);
            console.log('Frontend Request Params:', params);
            console.log('Frontend Received Response Data:', res.data);

            const raw = res.data.properties || [];

            const groupProperties = (apiData) => {
                if (!apiData || !Array.isArray(apiData)) return [];
                const grouped = {};
                
                const getNormalized = (p, u) => parseFloat(p) * (u === 'Cr' ? 100 : 1);

                apiData.forEach(prop => {
                    const projNameRaw = prop.projectName || prop.propertyName.split(' - ')[0].trim();
                    const projName = projNameRaw.split('  ')[0].trim();
                    
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

                    if (!grouped[projName]) {
                        grouped[projName] = { 
                            ...prop,
                            variantCount: cList.length > 0 ? cList.length : 1,
                            allConfigurations: cList.filter(Boolean),
                            minNormalized: getNormalized(prop.price, prop.priceUnit),
                            maxNormalized: getNormalized(prop.price, prop.priceUnit),
                            maxPrice: prop.price,
                            maxPriceUnit: prop.priceUnit
                        };
                    } else {
                        grouped[projName].variantCount += cList.length > 0 ? cList.length : 1;
                        cList.forEach(c => {
                            if (c && c.trim() !== '' && !grouped[projName].allConfigurations.includes(c)) {
                                grouped[projName].allConfigurations.push(c);
                            }
                        });
                        
                        const norm = getNormalized(prop.price, prop.priceUnit);
                        if (!isNaN(norm)) {
                            if (isNaN(grouped[projName].maxNormalized) || norm > grouped[projName].maxNormalized) {
                                grouped[projName].maxNormalized = norm;
                                grouped[projName].maxPrice = prop.price;
                                grouped[projName].maxPriceUnit = prop.priceUnit;
                            }
                            if (isNaN(grouped[projName].minNormalized) || norm < grouped[projName].minNormalized) {
                                grouped[projName].minNormalized = norm;
                                grouped[projName].price = prop.price;
                                grouped[projName].priceUnit = prop.priceUnit;
                                grouped[projName].id = prop.id;
                            }
                        }
                    }
                });
                Object.values(grouped).forEach(proj => {
                    const sortConfigs = (a, b) => {
                        const numA = parseFloat(a) || 0;
                        const numB = parseFloat(b) || 0;
                        if (numA !== numB) return numA - numB;
                        return a.localeCompare(b);
                    };
                    proj.allConfigurations.sort(sortConfigs);
                });
                return Object.values(grouped);
            };

            const groupedData = groupProperties(raw);

            setAllGroupedProperties(groupedData);
            setTotal(groupedData.length);
            setTotalPages(Math.ceil(groupedData.length / 20) || 1);
            setPage(1);
            // ...

            if (filters.search) {
                trackInteraction({
                    interactionType: 'Search',
                    websiteUserId: user?.id,
                    ipAddress: 'website-user',
                    userAgent: navigator.userAgent,
                    metadata: { query: filters.search, filters }
                }).catch(() => { });
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFavorites = async () => {
        try {
            const res = await getFavorites();
            const ids = new Set(res.data.map(f => f.Property?.id).filter(Boolean));
            setFavoriteIds(ids);
        } catch (err) { }
    };

    const handleFavoriteToggle = (propertyId) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (next.has(propertyId)) next.delete(propertyId);
            else next.add(propertyId);
            return next;
        });
    };

    const toggleType = (item) => {
        const field = item.type === 'category' ? 'categories' : (item.type === 'dimension' ? 'dimension' : 'configurations');
        setFilters(prev => {
            const current = [...prev[field]];
            if (current.includes(item.value)) {
                return { ...prev, [field]: current.filter(v => v !== item.value) };
            } else {
                return { ...prev, [field]: [...current, item.value] };
            }
        });
    };

    const selectPrice = (value) => {
        if (budgetMode === 'min') {
            setFilters({ ...filters, minPrice: value });
            setBudgetMode('max');
        } else {
            setFilters({ ...filters, maxPrice: value });
            setShowBudgetDropdown(false);
        }
    };

    const formatPriceLabel = (price) => {
        if (!price) return '';
        const p = parseFloat(price);
        if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)} Cr`;
        if (p >= 100000) return `₹${(p / 100000).toFixed(0)} Lac`;
        return `₹${p}`;
    };

    const getPropertyTypeLabel = () => {
        const totalSelected = filters.categories.length + filters.configurations.length + (filters.dimension ? filters.dimension.length : 0);
        if (totalSelected === 0) return 'Property Type';
        if (totalSelected === 1) {
            const allItems = [...propertyTypes.residential, ...propertyTypes.bhk, ...propertyTypes.others, ...propertyTypes.plotDimensions];
            const found = allItems.find(i =>
                (i.type === 'category' && filters.categories.includes(i.value)) ||
                (i.type === 'config' && filters.configurations.includes(i.value)) ||
                (i.type === 'dimension' && filters.dimension.includes(i.value))
            );
            return found ? found.label : 'Property Type';
        }

        // Show "Flat +1" style label if multiple selected
        if (filters.categories.length > 0) {
            const first = propertyTypes.residential.find(r => filters.categories.includes(r.value));
            return `${first ? first.label : 'Selected'} +${totalSelected - 1}`;
        }
        return `${totalSelected} Selected`;
    };

    const getBudgetLabel = () => {
        if (!filters.minPrice && !filters.maxPrice) return 'Budget';
        if (filters.minPrice && filters.maxPrice) {
            return `${formatPriceLabel(filters.minPrice)} - ${formatPriceLabel(filters.maxPrice)}`;
        }
        if (filters.minPrice) return `${formatPriceLabel(filters.minPrice)}+`;
        return `Up to ${formatPriceLabel(filters.maxPrice)}`;
    };

    const handleSearchSubmit = () => {
        setPage(1);
        loadProperties(1);
    };

    return (
        <div className="search-page">
            <div className="search-top-bar">
                <button className="search-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>

                <div className="filter-bar-container" ref={dropdownRef}>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearchSubmit();
                            }}
                            placeholder="Search properties, location or developer"
                        />
                    </div>

                    <button
                        type="button"
                        className="mobile-filter-summary"
                        onClick={() => {
                            setShowMoreFilters(!showMoreFilters);
                            setShowTypeDropdown(false);
                            setShowBudgetDropdown(false);
                        }}
                    >
                        <SlidersHorizontal size={16} className="filter-icon-blue" />
                        <span>Filters</span>
                    </button>

                    <div className="filter-items">
                        {/* Property Type Filter */}
                        <div className={`filter-item ${showTypeDropdown ? 'active' : ''}`} onClick={() => {
                            setShowTypeDropdown(!showTypeDropdown);
                            setShowBudgetDropdown(false);
                            setShowMoreFilters(false);
                        }}>
                            <HomeIcon size={20} className="filter-icon-blue" />
                            <span className="filter-item-label">{getPropertyTypeLabel()}</span>
                            <ChevronDown size={14} className="chevron-icon" />
                        </div>

                        <div className="filter-divider" />

                        {/* Budget Filter */}
                        <div className={`filter-item ${showBudgetDropdown ? 'active' : ''}`} onClick={() => {
                            setShowBudgetDropdown(!showBudgetDropdown);
                            setShowTypeDropdown(false);
                            setShowMoreFilters(false);
                            setBudgetMode('min');
                        }}>
                            <div className="rupee-icon">₹</div>
                            <span className="filter-item-label">{getBudgetLabel()}</span>
                            <ChevronDown size={14} className="chevron-icon" />
                        </div>

                        <div className="filter-divider" />

                        {/* Sorting */}
                        <div className="filter-item">
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [by, ord] = e.target.value.split('-');
                                    setSortBy(by);
                                    setSortOrder(ord);
                                    setPage(1);
                                }}
                                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--gray-700)', fontWeight: 500, paddingLeft: '8px', cursor: 'pointer' }}
                            >
                                <option value="createdAt-DESC">Newest First</option>
                                <option value="price-ASC">Price: Low to High</option>
                                <option value="price-DESC">Price: High to Low</option>
                                <option value="relevance-DESC">Relevance</option>
                            </select>
                        </div>

                        <div className="filter-divider" />

                        {/* More Filters */}
                        <div className={`filter-item ${showMoreFilters ? 'active' : ''}`} onClick={() => {
                            setShowMoreFilters(!showMoreFilters);
                            setShowTypeDropdown(false);
                            setShowBudgetDropdown(false);
                        }}>
                            <SlidersHorizontal size={18} className="filter-icon-blue" style={{ marginRight: '8px' }} />
                            <span className="filter-item-label">More Filters</span>
                            <ChevronDown size={14} className="chevron-icon" />
                        </div>
                    </div>

                    {/* Property Type Dropdown */}
                    {showTypeDropdown && (
                        <div className="filter-dropdown type-dropdown">
                            <div className="filter-section">
                                <div className="filter-section-title">
                                    <span>Residential</span>
                                    <ChevronUp size={16} />
                                </div>
                                <div className="chip-grid">
                                    {propertyTypes.residential.map(item => (
                                        <button
                                            key={item.label}
                                            className={`filter-chip ${(item.type === 'category' ? filters.categories : filters.configurations).includes(item.value) ? 'active' : ''}`}
                                            onClick={() => toggleType(item)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                { (filters.categories.length === 0 || filters.categories.includes('Residential') || filters.categories.includes('Villa')) && (
                                    <div className="chip-grid" style={{ marginTop: '12px' }}>
                                        {propertyTypes.bhk.map(item => (
                                            <button
                                                key={item.label}
                                                className={`filter-chip ${filters.configurations.includes(item.value) ? 'active' : ''}`}
                                                onClick={() => toggleType(item)}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                { (filters.categories.includes('Plot') || filters.categories.includes('Farm Land')) && (
                                    <div className="chip-grid" style={{ marginTop: '12px' }}>
                                        {propertyTypes.plotDimensions.map(item => (
                                            <button
                                                key={item.label}
                                                className={`filter-chip ${filters.dimension.includes(item.value) ? 'active' : ''}`}
                                                onClick={() => toggleType(item)}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>



                            <div className="filter-section">
                                <div className="filter-section-title">
                                    <span>Other Property Types</span>
                                    <ChevronUp size={16} />
                                </div>
                                <div className="chip-grid">
                                    {propertyTypes.others.map(item => (
                                        <button
                                            key={item.label}
                                            className={`filter-chip ${filters.categories.includes(item.value) ? 'active' : ''}`}
                                            onClick={() => toggleType(item)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Budget Dropdown */}
                    {showBudgetDropdown && (
                        <div className="filter-dropdown budget-dropdown">
                            <div className="budget-tabs">
                                <button
                                    className={`budget-tab ${budgetMode === 'min' ? 'active' : ''}`}
                                    onClick={() => setBudgetMode('min')}
                                >
                                    {filters.minPrice ? formatPriceLabel(filters.minPrice) : 'Min Price'}
                                </button>
                                <button
                                    className={`budget-tab ${budgetMode === 'max' ? 'active' : ''}`}
                                    onClick={() => setBudgetMode('max')}
                                >
                                    {filters.maxPrice ? formatPriceLabel(filters.maxPrice) : 'Max Price'}
                                </button>
                            </div>
                            <div className="price-list">
                                <div className="price-option label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{budgetMode === 'min' ? 'Min' : 'Max'}</span>
                                    {(filters.minPrice || filters.maxPrice) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilters({ ...filters, minPrice: '', maxPrice: '' });
                                                setShowBudgetDropdown(false);
                                            }}
                                            style={{ color: 'var(--brand)', background: 'none', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Reset All
                                        </button>
                                    )}
                                </div>
                                <div className="price-option" style={{ fontWeight: '600', color: 'var(--gray-900)' }} onClick={() => selectPrice('')}>
                                    Any Price
                                </div>
                                {pricePoints.filter(p => p.value !== '').map(point => (
                                    <div
                                        key={point.label}
                                        className="price-option"
                                        onClick={() => selectPrice(point.value)}
                                    >
                                        {point.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* More Filters Dropdown */}
                    {showMoreFilters && (
                        <div className="filter-dropdown more-filters-dropdown" style={{ right: 0, padding: '24px', width: '320px' }}>
                            <div className="filter-section">
                                <div className="filter-section-title">
                                    <span>Possession Status</span>
                                </div>
                                <div className="chip-grid">
                                    {['Ready to Move', 'Under Construction', 'Pre Launch'].map(item => (
                                        <button
                                            key={item}
                                            className={`filter-chip ${filters.possessionStatus.includes(item) ? 'active' : ''}`}
                                            onClick={() => setFilters(prev => {
                                                const cur = [...prev.possessionStatus];
                                                return { ...prev, possessionStatus: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item] };
                                            })}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-section" style={{ marginTop: '20px' }}>
                                <div className="filter-section-title">
                                    <span>Furnishing Status</span>
                                </div>
                                <div className="chip-grid">
                                    {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map(item => (
                                        <button
                                            key={item}
                                            className={`filter-chip ${filters.furnishingStatus.includes(item) ? 'active' : ''}`}
                                            onClick={() => setFilters(prev => {
                                                const cur = [...prev.furnishingStatus];
                                                return { ...prev, furnishingStatus: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item] };
                                            })}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop */}
            {(showTypeDropdown || showBudgetDropdown || showMoreFilters) && <div className="search-backdrop" onClick={() => {
                setShowTypeDropdown(false);
                setShowBudgetDropdown(false);
                setShowMoreFilters(false);
            }} />}



            {loading ? (
                <div className="loading-screen"><div className="spinner"></div></div>
            ) : properties.length > 0 ? (
                <div className="search-results-grid">
                    {properties.map((prop) => (
                        <PropertyCard
                            key={prop.id}
                            property={prop}
                            isFavorited={favoriteIds.has(prop.id)}
                            onFavoriteToggle={handleFavoriteToggle}
                            variantCount={prop.variantCount}
                            allConfigurations={prop.allConfigurations}
                            maxPrice={prop.maxPrice}
                            maxPriceUnit={prop.maxPriceUnit}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No properties found matching your criteria.</p>
                </div>
            )}



            {totalPages > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}
        </div>
    );
};

export default SearchPage;

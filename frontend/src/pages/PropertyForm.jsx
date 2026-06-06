import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';

const PropertyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        propertyName: '',
        description: '',
        category: 'Residential',
        location: '',
        price: '',
        priceUnit: 'Lakhs',
        dimensions: '',
        configuration: '',
        amenities: '', // comma separatedString
        status: 'Available',
        latitude: '',
        longitude: '',
        projectName: '',
        builderInfo: '',
        isVerified: false,
        isSoldOut: false,
        projectHighlights: '',
        bhk: '',
        possessionTime: '',
        possessionStatus: 'Ready to Move',
        furnishingStatus: 'Unfurnished',
        reraNumber: '',
        landParcel: '',
        floor: '',
        units: '',
        investmentType: 'Self Use'
    });
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [existingCoverPhoto, setExistingCoverPhoto] = useState(null);
    const [previewCoverPhoto, setPreviewCoverPhoto] = useState(null);

    const [photos, setPhotos] = useState([]); // For new files
    const [existingPhotos, setExistingPhotos] = useState([]); // For displaying existing images in edit mode
    const [previewPhotos, setPreviewPhotos] = useState([]);

    const [brochure, setBrochure] = useState([]);
    const [existingBrochure, setExistingBrochure] = useState([]);
    const [previewBrochure, setPreviewBrochure] = useState([]);

    const [floorPlan, setFloorPlan] = useState([]);
    const [existingFloorPlan, setExistingFloorPlan] = useState([]);
    const [previewFloorPlan, setPreviewFloorPlan] = useState([]);

    const [masterPlan, setMasterPlan] = useState([]);
    const [existingMasterPlan, setExistingMasterPlan] = useState([]);
    const [previewMasterPlan, setPreviewMasterPlan] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalImage, setModalImage] = useState(null);

    const [configs, setConfigs] = useState([
        { configuration: '', dimensions: '', price: '', priceUnit: 'Lakhs' }
    ]);

    useEffect(() => {
    }, []);


    useEffect(() => {
        if (isEdit) {
            const fetchProperty = async () => {
                setLoading(true);
                try {
                    const res = await api.get(`/properties/${id}`);
                    const data = res.data;
                    setFormData({
                        propertyName: data.propertyName || '',
                        description: data.description || '',
                        category: data.category || 'Residential',
                        location: data.location || '',
                        price: data.price || '',
                        priceUnit: data.priceUnit || 'Lakhs',
                        dimensions: data.dimensions || '',
                        configuration: data.configuration || '',
                        amenities: data.amenities ? (Array.isArray(data.amenities) ? data.amenities.join(', ') : data.amenities) : '',
                        status: data.status || 'Available',
                        latitude: data.latitude || '',
                        longitude: data.longitude || '',
                        possessionTime: data.possessionTime || '',
                        projectName: data.projectName || '',
                        builderInfo: data.builderInfo || '',
                        isVerified: data.isVerified || false,
                        isSoldOut: data.isSoldOut || false,
                        bhk: data.bhk || '',
                        projectHighlights: data.projectHighlights ? (Array.isArray(data.projectHighlights) ? data.projectHighlights.join(', ') : data.projectHighlights) : '',
                        reraNumber: data.reraNumber || '',
                        landParcel: data.landParcel || '',
                        floor: data.floor || '',
                        units: data.units || '',
                        investmentType: data.investmentType || 'Self Use'
                    });

                    let parsedConfigs = [];
                    try {
                        if (data.configuration) {
                            const parsed = typeof data.configuration === 'string' ? JSON.parse(data.configuration) : data.configuration;
                            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
                                parsedConfigs = parsed;
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing configuration on fetch:', e);
                    }

                    if (parsedConfigs.length > 0) {
                        setConfigs(parsedConfigs);
                    } else {
                        // Fallback for legacy format
                        setConfigs([
                            {
                                configuration: data.configuration || '',
                                dimensions: data.dimensions || '',
                                price: data.price || '',
                                priceUnit: data.priceUnit || 'Lakhs'
                            }
                        ]);
                    }

                    const parseArray = (val) => {
                        if (!val) return [];
                        if (Array.isArray(val)) return val;
                        try {
                            const parsed = JSON.parse(val);
                            return Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            return [];
                        }
                    };

                    setExistingPhotos(parseArray(data.photos));
                    setExistingBrochure(parseArray(data.brochure));
                    setExistingFloorPlan(parseArray(data.floorPlan));
                    setExistingMasterPlan(parseArray(data.masterPlan));
                    setExistingCoverPhoto(data.coverPhoto || null);
                } catch (err) {
                    console.error("Error fetching property", err);
                    const msg = err.response?.data?.message || "Failed to load property details. The server might be experiencing issues.";
                    setError(msg);
                } finally {
                    setLoading(false);
                }
            };
            fetchProperty();
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCoverPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverPhoto(file);
            setPreviewCoverPhoto(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(prev => [...prev, ...files]);

        // Create previews
        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type
        }));
        setPreviewPhotos(prev => [...prev, ...newPreviews]);
    };

    const handleBrochureChange = (e) => {
        const files = Array.from(e.target.files);
        setBrochure(prev => [...prev, ...files]);
        const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), type: file.type, name: file.name }));
        setPreviewBrochure(prev => [...prev, ...newPreviews]);
    };

    const handleFloorPlanChange = (e) => {
        const files = Array.from(e.target.files);
        setFloorPlan(prev => [...prev, ...files]);
        const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), type: file.type, name: file.name }));
        setPreviewFloorPlan(prev => [...prev, ...newPreviews]);
    };

    const handleMasterPlanChange = (e) => {
        const files = Array.from(e.target.files);
        setMasterPlan(prev => [...prev, ...files]);
        const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), type: file.type, name: file.name }));
        setPreviewMasterPlan(prev => [...prev, ...newPreviews]);
    };

    const handleClearNewPhotos = () => {
        setPhotos([]);
        setPreviewPhotos([]);
    };
    const handleClearCoverPhoto = () => {
        setCoverPhoto(null);
        setPreviewCoverPhoto(null);
        document.getElementById('coverPhotoInput').value = '';
    };
    const handleClearNewBrochure = () => {
        setBrochure([]);
        setPreviewBrochure([]);
    };
    const handleClearNewFloorPlan = () => {
        setFloorPlan([]);
        setPreviewFloorPlan([]);
    };
    const handleClearNewMasterPlan = () => {
        setMasterPlan([]);
        setPreviewMasterPlan([]);
    };

    const handleRemoveExistingPhoto = (photoPath) => {
        setExistingPhotos(prev => prev.filter(p => p !== photoPath));
    };

    const handleRemoveExistingCoverPhoto = () => {
        setExistingCoverPhoto(null);
    };

    const handleRemoveExistingBrochure = (brochurePath) => {
        setExistingBrochure(prev => prev.filter(b => b !== brochurePath));
    };

    const handleRemoveExistingFloorPlan = (fpPath) => {
        setExistingFloorPlan(prev => prev.filter(f => f !== fpPath));
    };

    const handleRemoveExistingMasterPlan = (mpPath) => {
        setExistingMasterPlan(prev => prev.filter(m => m !== mpPath));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'dimensions' || key === 'configuration') {
                return; // Append manually below
            }
            if (key === 'amenities' || key === 'projectHighlights') {
                const array = formData[key].split(',').map(item => item.trim()).filter(i => i);
                data.append(key, JSON.stringify(array));
            } else {
                data.append(key, formData[key]);
            }
        });

        // Ensure Project Name is always equal to Property Name behind the scenes
        data.set('projectName', formData.propertyName);

        // Collect new config floor plan files
        const configFiles = [];
        const processedConfigs = configs.map(c => {
            const configCopy = { ...c };
            
            // Format dimensions by default to include 'Sqft' if no unit is present
            if (configCopy.dimensions) {
                const dimStr = String(configCopy.dimensions).trim();
                const lower = dimStr.toLowerCase();
                if (dimStr && !lower.includes('sq') && !lower.includes('ft') && !lower.includes('acre') && !lower.includes('hectare')) {
                    configCopy.dimensions = `${dimStr} Sqft`;
                }
            }

            if (configCopy.newFile) {
                configCopy.floorPlanFileIndex = floorPlan.length + configFiles.length;
                configFiles.push(configCopy.newFile);
                delete configCopy.newFile;
                delete configCopy.previewUrl;
            }
            return configCopy;
        });

        // Append dynamic configs as JSON
        data.append('configuration', JSON.stringify(processedConfigs));
        data.append('dimensions', JSON.stringify(processedConfigs.map(c => c.dimensions).filter(Boolean)));

        if (coverPhoto) data.append('coverPhoto', coverPhoto);
        photos.forEach(file => data.append('photos', file));
        brochure.forEach(file => data.append('brochure', file));
        floorPlan.forEach(file => data.append('floorPlan', file));
        configFiles.forEach(file => data.append('floorPlan', file)); // Append configuration specific files
        masterPlan.forEach(file => data.append('masterPlan', file));

        if (isEdit) {
            data.append('existingCoverPhoto', existingCoverPhoto || '');
            if (existingPhotos.length === 0) data.append('existingPhotos', '');
            else existingPhotos.forEach(photo => data.append('existingPhotos', photo));

            if (existingBrochure.length === 0) data.append('existingBrochure', '');
            else existingBrochure.forEach(b => data.append('existingBrochure', b));

            if (existingFloorPlan.length === 0) data.append('existingFloorPlan', '');
            else existingFloorPlan.forEach(f => data.append('existingFloorPlan', f));

            if (existingMasterPlan.length === 0) data.append('existingMasterPlan', '');
            else existingMasterPlan.forEach(m => data.append('existingMasterPlan', m));
        }

        try {
            if (isEdit) {
                await api.put(`/properties/${id}`, data);
            } else {
                await api.post('/properties', data);
            }
            navigate('/properties');
        } catch (err) {
            console.error("Error saving property", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to save property. Please check if all fields are correct and the server is running.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>{isEdit ? 'Edit Property' : 'Add New Property'}</h2>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Property Name</label>
                    <input name="propertyName" value={formData.propertyName} onChange={handleChange} className="form-input" />
                </div>

                {/* Project Name is hidden and automatically set to Property Name on save */}

                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="form-select">
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Farm Land">Farm Land</option>
                        <option value="Residential">Residential</option>
                        <option value="Resale">Resale</option>
                        <option value="Rental">Rental</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="form-input" />
                </div>

                <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} className="form-input" placeholder="e.g. 12.9716" />
                </div>

                <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} className="form-input" placeholder="e.g. 77.5946" />
                </div>

                <div className="form-group">
                    <label className="form-label">Possession Time (Position Time)</label>
                    <input name="possessionTime" value={formData.possessionTime} onChange={handleChange} className="form-input" placeholder="e.g. Dec 2024" />
                </div>

                <div className="form-group">
                    <label className="form-label">RERA Number</label>
                    <input name="reraNumber" value={formData.reraNumber} onChange={handleChange} className="form-input" placeholder="e.g. PRM/KA/RERA/..." />
                </div>


                <div className="form-group">
                    <label className="form-label">Land Parcel</label>
                    <input name="landParcel" value={formData.landParcel} onChange={handleChange} className="form-input" placeholder="e.g. 5 Acres" />
                </div>

                <div className="form-group">
                    <label className="form-label">Total Number of Floors</label>
                    <input name="floor" value={formData.floor} onChange={handleChange} className="form-input" placeholder="e.g. 10" />
                </div>

                <div className="form-group">
                    <label className="form-label">Total Number of Units</label>
                    <input name="units" value={formData.units} onChange={handleChange} className="form-input" placeholder="e.g. 100" />
                </div>

                <div className="form-group">
                    <label className="form-label">Builder Info</label>
                    <input name="builderInfo" value={formData.builderInfo} onChange={handleChange} className="form-input" placeholder="e.g. Grade A Builder" />
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Verified Toggle */}
                    <div
                        onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                            padding: '10px 16px', borderRadius: '10px', border: '2px solid',
                            borderColor: formData.isVerified ? '#10B981' : '#e5e7eb',
                            background: formData.isVerified ? '#f0fdf4' : '#f9fafb',
                            transition: 'all 0.2s ease', userSelect: 'none',
                            minWidth: '180px'
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="19" fill={formData.isVerified ? '#10B981' : '#d1d5db'} />
                            <path d="M12 20.5l5.5 5.5 11-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {[0,45,90,135,180,225,270,315].map((angle, i) => (
                                <rect key={i} x="18.5" y="0" width="3" height="6" rx="1.5" fill={formData.isVerified ? '#10B981' : '#d1d5db'}
                                    transform={`rotate(${angle} 20 20)`} />
                            ))}
                        </svg>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: formData.isVerified ? '#065f46' : '#6b7280' }}>VERIFIED</div>
                            <div style={{ fontSize: '11px', color: formData.isVerified ? '#10B981' : '#9ca3af' }}>{formData.isVerified ? 'Active' : 'Not Verified'}</div>
                        </div>
                    </div>

                    {/* Sold Out Toggle */}
                    <div
                        onClick={() => setFormData({ ...formData, isSoldOut: !formData.isSoldOut })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                            padding: '10px 16px', borderRadius: '10px', border: '2px solid',
                            borderColor: formData.isSoldOut ? '#dc2626' : '#e5e7eb',
                            background: formData.isSoldOut ? '#fff1f2' : '#f9fafb',
                            transition: 'all 0.2s ease', userSelect: 'none',
                            minWidth: '180px'
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <rect x="1" y="1" width="38" height="38" rx="6" fill={formData.isSoldOut ? '#dc2626' : '#d1d5db'} />
                            <path d="M10 20h20M20 10v20" stroke="white" strokeWidth="3.5" strokeLinecap="round"
                                transform="rotate(45 20 20)" />
                            <text x="20" y="24" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">SOLD</text>
                        </svg>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: formData.isSoldOut ? '#991b1b' : '#6b7280' }}>SOLD OUT</div>
                            <div style={{ fontSize: '11px', color: formData.isSoldOut ? '#dc2626' : '#9ca3af' }}>{formData.isSoldOut ? 'Active' : 'Available'}</div>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Looking for Investment</label>
                    <select name="investmentType" value={formData.investmentType} onChange={handleChange} className="form-select">
                        <option value="Self Use">Self Use</option>
                        <option value="Investment">Investment</option>
                        <option value="Both">Both</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Possession Status</label>
                    <select name="possessionStatus" value={formData.possessionStatus} onChange={handleChange} className="form-select">
                        <option value="Ready to Move">Ready to Move</option>
                        <option value="Under Construction">Under Construction</option>
                        <option value="Pre Launch">Pre Launch</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Furnishing Status</label>
                    <select name="furnishingStatus" value={formData.furnishingStatus} onChange={handleChange} className="form-select">
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                    </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#f9fafb', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <label className="form-label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: 0 }}>Configurations & Dimensions Builder</label>
                        <button type="button" onClick={() => setConfigs([...configs, { configuration: '', dimensions: '', price: '', priceUnit: 'Lakhs' }])} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', background: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>
                            + Add Variant
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {configs.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                <div style={{ flex: '1 1 20%', minWidth: '150px' }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Configuration</label>
                                    <input 
                                        value={item.configuration} 
                                        onChange={(e) => {
                                            const newConfigs = [...configs];
                                            newConfigs[index].configuration = e.target.value;
                                            setConfigs(newConfigs);
                                        }} 
                                        className="form-input" 
                                        placeholder="e.g. 2 BHK + 2T" 
                                        style={{ fontSize: '14px', padding: '8px' }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 20%', minWidth: '150px' }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Dimensions</label>
                                    <input 
                                        value={item.dimensions} 
                                        onChange={(e) => {
                                            const newConfigs = [...configs];
                                            newConfigs[index].dimensions = e.target.value;
                                            setConfigs(newConfigs);
                                        }} 
                                        className="form-input" 
                                        placeholder="e.g. 1340 - 1350 sqft" 
                                        style={{ fontSize: '14px', padding: '8px' }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 15%', minWidth: '100px' }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Price</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={item.price} 
                                        onChange={(e) => {
                                            const newConfigs = [...configs];
                                            newConfigs[index].price = e.target.value;
                                            setConfigs(newConfigs);
                                        }} 
                                        className="form-input" 
                                        placeholder="Price" 
                                        style={{ fontSize: '14px', padding: '8px' }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 12%', minWidth: '90px' }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Unit</label>
                                    <select 
                                        value={item.priceUnit} 
                                        onChange={(e) => {
                                            const newConfigs = [...configs];
                                            newConfigs[index].priceUnit = e.target.value;
                                            setConfigs(newConfigs);
                                        }} 
                                        className="form-select"
                                        style={{ fontSize: '14px', padding: '8px' }}
                                    >
                                        <option value="Lakhs">Lakhs</option>
                                        <option value="Cr">Cr</option>
                                        <option value="Thousands">Thousand</option>
                                    </select>
                                </div>
                                {item.configuration && item.configuration.trim() !== '' && (
                                    <div style={{ flex: '1 1 20%', minWidth: '150px' }}>
                                        <label className="form-label" style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Floor Plan</label>
                                        {item.floorPlan ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                                                {String(item.floorPlan).toLowerCase().endsWith('.pdf') ? (
                                                    <a href={`${API_BASE_URL}${item.floorPlan}`} target="_blank" rel="noreferrer" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', height: '32px', cursor: 'pointer' }} title="View PDF">📄</a>
                                                ) : (
                                                    <img src={`${API_BASE_URL}${item.floorPlan}`} alt="FP" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                )}
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const newConfigs = [...configs];
                                                        delete newConfigs[index].floorPlan;
                                                        setConfigs(newConfigs);
                                                    }} 
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '600' }}
                                                >
                                                    Remove Existing
                                                </button>
                                            </div>
                                        ) : item.newFile ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                                                {item.newFile.type === 'application/pdf' ? (
                                                    <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center', height: '32px' }} title={item.newFile.name}>📄</span>
                                                ) : (
                                                    <img src={item.previewUrl} alt="New FP" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                )}
                                                <span style={{ fontSize: '11px', color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }} title={item.newFile.name}>{item.newFile.name}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const newConfigs = [...configs];
                                                        delete newConfigs[index].newFile;
                                                        delete newConfigs[index].previewUrl;
                                                        setConfigs(newConfigs);
                                                    }} 
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '600' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <input 
                                                type="file" 
                                                accept="image/*,application/pdf,.webp" 
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const newConfigs = [...configs];
                                                        newConfigs[index].newFile = file;
                                                        newConfigs[index].previewUrl = URL.createObjectURL(file);
                                                        setConfigs(newConfigs);
                                                    }
                                                }} 
                                                style={{ fontSize: '11px', width: '100%', height: '38px', display: 'flex', alignItems: 'center' }} 
                                            />
                                        )}
                                    </div>
                                )}
                                {configs.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => setConfigs(configs.filter((_, idx) => idx !== index))} 
                                        style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', height: '36px', padding: '0 12px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                        <option value="Available">Available</option>
                        <option value="Pending">Pending</option>
                        <option value="Sold">Sold Out</option>
                        <option value="EOI">EOI</option>
                        <option value="RTMI">RTMI</option>
                    </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Amenities (comma separated)</label>
                    <input name="amenities" value={formData.amenities} onChange={handleChange} className="form-input" placeholder="Gym, Pool, Park" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Project Highlights (comma separated)</label>
                    <input name="projectHighlights" value={formData.projectHighlights} onChange={handleChange} className="form-input" placeholder="Luxury Living, Prime Location" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows="4" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Cover Photo (Main Image)</label>
                        {previewCoverPhoto && (
                            <button type="button" onClick={handleClearCoverPhoto} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear New File</button>
                        )}
                    </div>
                    <input type="file" id="coverPhotoInput" accept="image/*,.webp" onChange={handleCoverPhotoChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {existingCoverPhoto && !previewCoverPhoto && (
                            <div style={{ position: 'relative' }}>
                                <img src={`${API_BASE_URL}${existingCoverPhoto}`} alt="Existing Cover" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #10b981', cursor: 'pointer' }} onClick={() => setModalImage(`${API_BASE_URL}${existingCoverPhoto}`)} />
                                <button type="button" onClick={handleRemoveExistingCoverPhoto} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 10 }}>&times;</button>
                            </div>
                        )}
                        {previewCoverPhoto && (
                            <img src={previewCoverPhoto} alt="Preview Cover" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '2px solid #10b981' }} onClick={() => setModalImage(previewCoverPhoto)} />
                        )}
                    </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Photos & Videos (Endless upload)</label>
                        {previewPhotos.length > 0 && (
                            <button type="button" onClick={handleClearNewPhotos} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear New Files</button>
                        )}
                    </div>
                    <input type="file" multiple accept="image/*,video/*,.webp" onChange={handleFileChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {Array.isArray(existingPhotos) && existingPhotos.map((photo, index) => {
                            if (typeof photo !== 'string') return null;
                            const isVideo = photo.match(/\.(mp4|webm|ogg|mov)$/i);
                            return (
                                <div key={`exist-${index}`} style={{ position: 'relative' }}>
                                    {isVideo ? (
                                        <video src={`${API_BASE_URL}${photo}`} controls style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6' }} />
                                    ) : (
                                        <img src={`${API_BASE_URL}${photo}`} alt="Existing" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6', cursor: 'pointer' }} onClick={() => setModalImage(`${API_BASE_URL}${photo}`)} />
                                    )}
                                    <button type="button" onClick={() => handleRemoveExistingPhoto(photo)} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 10 }}>&times;</button>
                                </div>
                            );
                        })}
                        {previewPhotos.map((photo, index) => (
                            photo.type.startsWith('video/') ? (
                                <video key={`new-${index}`} src={photo.url} controls style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                                <img key={`new-${index}`} src={photo.url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setModalImage(photo.url)} />
                            )
                        ))}
                    </div>
                </div>


                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Master Plan (Images or PDFs)</label>
                        {previewMasterPlan.length > 0 && (
                            <button type="button" onClick={handleClearNewMasterPlan} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear New Files</button>
                        )}
                    </div>
                    <input type="file" multiple accept="image/*,application/pdf,.webp" onChange={handleMasterPlanChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {Array.isArray(existingMasterPlan) && existingMasterPlan.map((file, index) => {
                            if (typeof file !== 'string') return null;
                            const isPdf = file.match(/\.pdf$/i);
                            return (
                                <div key={`exist-mp-${index}`} style={{ position: 'relative' }}>
                                    {isPdf ? (
                                        <a href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
                                            <span style={{ fontSize: '24px' }}>🗺️</span>
                                            <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Existing PDF</span>
                                        </a>
                                    ) : (
                                        <img src={`${API_BASE_URL}${file}`} alt="Existing Master Plan" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6', cursor: 'pointer' }} onClick={() => setModalImage(`${API_BASE_URL}${file}`)} />
                                    )}
                                    <button type="button" onClick={() => handleRemoveExistingMasterPlan(file)} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 10 }}>&times;</button>
                                </div>
                            );
                        })}
                        {previewMasterPlan.map((file, index) => (
                            file.type === 'application/pdf' ? (
                                <div key={`new-mp-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '24px' }}>🗺️</span>
                                    <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                </div>
                            ) : (
                                <img key={`new-mp-${index}`} src={file.url} alt="Preview Master Plan" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setModalImage(file.url)} />
                            )
                        ))}
                    </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Brochures (PDFs)</label>
                        {previewBrochure.length > 0 && (
                            <button type="button" onClick={handleClearNewBrochure} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear New Files</button>
                        )}
                    </div>
                    <input type="file" multiple accept="application/pdf" onChange={handleBrochureChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {Array.isArray(existingBrochure) && existingBrochure.map((file, index) => (
                            <div key={`exist-b-${index}`} style={{ position: 'relative' }}>
                                <a href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
                                    <span style={{ fontSize: '24px' }}>📕</span>
                                    <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Existing Brochure</span>
                                </a>
                                <button type="button" onClick={() => handleRemoveExistingBrochure(file)} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 10 }}>&times;</button>
                            </div>
                        ))}
                        {previewBrochure.map((file, index) => (
                            <div key={`new-b-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                                <span style={{ fontSize: '24px' }}>📕</span>
                                <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : (isEdit ? 'Update Property' : 'Add Property')}
                    </button>
                    <button type="button" className="btn" style={{ marginLeft: '10px', backgroundColor: '#9ca3af', color: 'white' }} onClick={() => navigate('/properties')}>
                        Cancel
                    </button>
                </div>
            </form>

            {/* Image Modal for Fullscreen Preview */}
            {modalImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <img src={modalImage} alt="Fullscreen Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
                    <button type="button" onClick={() => setModalImage(null)} style={{
                        position: 'absolute', top: '20px', right: '30px',
                        background: 'transparent', border: 'none', color: 'white',
                        fontSize: '40px', cursor: 'pointer'
                    }}>
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
};

export default PropertyForm;

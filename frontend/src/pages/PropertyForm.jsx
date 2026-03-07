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
        possessionTime: '',
        developerName: '',
        landParcel: '',
        floor: '',
        units: '',
        investmentType: 'Self Use',
        reraNumber: ''
    });
    const [photos, setPhotos] = useState([]); // For new files
    const [existingPhotos, setExistingPhotos] = useState([]); // For displaying existing images in edit mode
    const [previewPhotos, setPreviewPhotos] = useState([]);

    const [brochure, setBrochure] = useState([]);
    const [existingBrochure, setExistingBrochure] = useState([]);
    const [previewBrochure, setPreviewBrochure] = useState([]);

    const [floorPlan, setFloorPlan] = useState([]);
    const [existingFloorPlan, setExistingFloorPlan] = useState([]);
    const [previewFloorPlan, setPreviewFloorPlan] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        if (isEdit) {
            const fetchProperty = async () => {
                try {
                    const res = await api.get(`/properties/${id}`);
                    const data = res.data;
                    setFormData({
                        propertyName: data.propertyName,
                        description: data.description,
                        category: data.category,
                        location: data.location,
                        price: data.price,
                        priceUnit: data.priceUnit || 'Lakhs',
                        dimensions: data.dimensions,
                        configuration: data.configuration,
                        amenities: data.amenities ? data.amenities.join(', ') : '',
                        status: data.status,
                        latitude: data.latitude || '',
                        longitude: data.longitude || '',
                        possessionTime: data.possessionTime || '',
                        developerName: data.developerName || '',
                        landParcel: data.landParcel || '',
                        floor: data.floor || '',
                        units: data.units || '',
                        investmentType: data.investmentType || 'Self Use',
                        reraNumber: data.reraNumber || ''
                    });
                    setExistingPhotos(data.photos || []);
                    setExistingBrochure(data.brochure || []);
                    setExistingFloorPlan(data.floorPlan || []);
                } catch (err) {
                    console.error("Error fetching property", err);
                    setError("Failed to load property details");
                }
            };
            fetchProperty();
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const handleClearNewPhotos = () => {
        setPhotos([]);
        setPreviewPhotos([]);
    };
    const handleClearNewBrochure = () => {
        setBrochure([]);
        setPreviewBrochure([]);
    };
    const handleClearNewFloorPlan = () => {
        setFloorPlan([]);
        setPreviewFloorPlan([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'amenities') {
                const amenitiesArray = formData.amenities.split(',').map(item => item.trim()).filter(i => i);
                data.append('amenities', JSON.stringify(amenitiesArray));
            } else {
                data.append(key, formData[key]);
            }
        });

        photos.forEach(file => data.append('photos', file));
        brochure.forEach(file => data.append('brochure', file));
        floorPlan.forEach(file => data.append('floorPlan', file));

        if (isEdit) {
            existingPhotos.forEach(photo => data.append('existingPhotos', photo));
            existingBrochure.forEach(b => data.append('existingBrochure', b));
            existingFloorPlan.forEach(f => data.append('existingFloorPlan', f));
        }

        try {
            if (isEdit) {
                await api.put(`/properties/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/properties', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            navigate('/properties');
        } catch (err) {
            console.error("Error saving property", err);
            setError("Failed to save property");
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

                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="form-select">
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Farm Land">Farm Land</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Residential">Residential</option>
                        <option value="Resale">Resale</option>
                        <option value="Rental">Rental</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Price</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="form-input" style={{ flex: '1 1 60%' }} />
                        <select name="priceUnit" value={formData.priceUnit} onChange={handleChange} className="form-select" style={{ flex: '1 1 30%' }}>
                            <option value="Lakhs">Lakhs</option>
                            <option value="Cr">Cr</option>
                            <option value="Thousands">Thousands</option>
                        </select>
                    </div>
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
                    <label className="form-label">Developer Name</label>
                    <input name="developerName" value={formData.developerName} onChange={handleChange} className="form-input" placeholder="e.g. Prestige Group" />
                </div>

                <div className="form-group">
                    <label className="form-label">Land Parcel</label>
                    <input name="landParcel" value={formData.landParcel} onChange={handleChange} className="form-input" placeholder="e.g. 5 Acres" />
                </div>

                <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input name="floor" value={formData.floor} onChange={handleChange} className="form-input" placeholder="e.g. 5th Floor" />
                </div>

                <div className="form-group">
                    <label className="form-label">Units</label>
                    <input name="units" value={formData.units} onChange={handleChange} className="form-input" placeholder="e.g. 100" />
                </div>

                <div className="form-group">
                    <label className="form-label">Looking for Investment</label>
                    <select name="investmentType" value={formData.investmentType} onChange={handleChange} className="form-select">
                        <option value="Self Use">Self Use</option>
                        <option value="Investment">Investment</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Dimensions</label>
                    <input name="dimensions" value={formData.dimensions} onChange={handleChange} className="form-input" placeholder="e.g. 1200 sqft" />
                </div>

                <div className="form-group">
                    <label className="form-label">Configuration</label>
                    <input name="configuration" list="config-options" value={formData.configuration} onChange={handleChange} className="form-input" placeholder="e.g. 3BHK" />
                    <datalist id="config-options">
                        <option value="1BHK" />
                        <option value="2BHK" />
                        <option value="3BHK" />
                        <option value="4BHK" />
                    </datalist>
                </div>

                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                        <option value="Available">Available</option>
                        <option value="Pending">Pending</option>
                        <option value="Sold">Sold</option>
                        <option value="EOI">EOI</option>
                        <option value="RTMI">RTMI</option>
                    </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Amenities (comma separated)</label>
                    <input name="amenities" value={formData.amenities} onChange={handleChange} className="form-input" placeholder="Gym, Pool, Park" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows="4" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Photos & Videos (Endless upload)</label>
                        {previewPhotos.length > 0 && (
                            <button type="button" onClick={handleClearNewPhotos} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear New Files</button>
                        )}
                    </div>
                    <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {existingPhotos.map((photo, index) => {
                            const isVideo = photo.match(/\.(mp4|webm|ogg|mov)$/i);
                            return isVideo ? (
                                <video key={`exist-${index}`} src={`${API_BASE_URL}${photo}`} controls style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6' }} />
                            ) : (
                                <img key={`exist-${index}`} src={`${API_BASE_URL}${photo}`} alt="Existing" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6', cursor: 'pointer' }} onClick={() => setModalImage(`${API_BASE_URL}${photo}`)} />
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
                        <label className="form-label">Floor Plans (Images or PDFs)</label>
                        {previewFloorPlan.length > 0 && (
                            <button type="button" onClick={handleClearNewFloorPlan} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear New Files</button>
                        )}
                    </div>
                    <input type="file" multiple accept="image/*,application/pdf" onChange={handleFloorPlanChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {existingFloorPlan.map((file, index) => {
                            const isPdf = file.match(/\.pdf$/i);
                            return isPdf ? (
                                <a key={`exist-fp-${index}`} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
                                    <span style={{ fontSize: '24px' }}>📄</span>
                                    <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Existing PDF</span>
                                </a>
                            ) : (
                                <img key={`exist-fp-${index}`} src={`${API_BASE_URL}${file}`} alt="Existing Floor Plan" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6', cursor: 'pointer' }} onClick={() => setModalImage(`${API_BASE_URL}${file}`)} />
                            );
                        })}
                        {previewFloorPlan.map((file, index) => (
                            file.type === 'application/pdf' ? (
                                <div key={`new-fp-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '24px' }}>📄</span>
                                    <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                </div>
                            ) : (
                                <img key={`new-fp-${index}`} src={file.url} alt="Preview Floor Plan" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setModalImage(file.url)} />
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
                        {existingBrochure.map((file, index) => (
                            <a key={`exist-b-${index}`} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
                                <span style={{ fontSize: '24px' }}>📕</span>
                                <span style={{ fontSize: '10px', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Existing Brochure</span>
                            </a>
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

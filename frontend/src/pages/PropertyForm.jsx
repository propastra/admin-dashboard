import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

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
        projectName: '',
        amenities: '', // comma separatedString
        status: 'Available'
    });
    const [photos, setPhotos] = useState([]); // For new files
    const [existingPhotos, setExistingPhotos] = useState([]); // For displaying existing images in edit mode
    const [previewPhotos, setPreviewPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                        projectName: data.projectName,
                        amenities: data.amenities ? data.amenities.join(', ') : '',
                        status: data.status
                    });
                    setExistingPhotos(data.photos || []);
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
        setPhotos(files);

        // Create previews
        const previews = files.map(file => URL.createObjectURL(file));
        setPreviewPhotos(previews);
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

        photos.forEach(file => {
            data.append('photos', file);
        });

        if (isEdit) {
            existingPhotos.forEach(photo => {
                data.append('existingPhotos', photo);
            });
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
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Property Name</label>
                    <input name="propertyName" value={formData.propertyName} onChange={handleChange} className="form-input" required />
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
                        <option value="Retail">Retail</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Price</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="form-input" required style={{ flex: 2 }} />
                        <select name="priceUnit" value={formData.priceUnit} onChange={handleChange} className="form-select" style={{ flex: 1 }}>
                            <option value="Lakhs">Lakhs</option>
                            <option value="Cr">Cr</option>
                            <option value="Thousands">Thousands</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="form-input" required />
                </div>

                <div className="form-group">
                    <label className="form-label">Project Name</label>
                    <input name="projectName" value={formData.projectName} onChange={handleChange} className="form-input" />
                </div>

                <div className="form-group">
                    <label className="form-label">Dimensions</label>
                    <input name="dimensions" value={formData.dimensions} onChange={handleChange} className="form-input" placeholder="e.g. 1200 sqft" />
                </div>

                <div className="form-group">
                    <label className="form-label">Configuration</label>
                    <input name="configuration" value={formData.configuration} onChange={handleChange} className="form-input" placeholder="e.g. 3BHK" />
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
                    <label className="form-label">Photos</label>
                    <input type="file" multiple onChange={handleFileChange} className="form-input" />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {existingPhotos.map((photo, index) => (
                            <img key={`exist-${index}`} src={`http://localhost:5000${photo}`} alt="Existing" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #3b82f6' }} />
                        ))}
                        {previewPhotos.map((photo, index) => (
                            <img key={`new-${index}`} src={photo} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
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
        </div>
    );
};

export default PropertyForm;

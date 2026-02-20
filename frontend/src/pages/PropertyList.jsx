import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await api.get('/properties');
            setProperties(res.data);
        } catch (err) {
            console.error("Failed to fetch properties", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this property?")) {
            try {
                await api.delete(`/properties/${id}`);
                setProperties(properties.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to delete property", err);
                alert("Failed to delete property");
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Properties</h1>
                <Link to="/properties/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }}>
                    <FaPlus style={{ marginRight: '5px' }} /> Add Property
                </Link>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['All', 'Villa', 'Plot', 'Farm Land', 'Commercial', 'Residential', 'Resale', 'Retail'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: filter === cat ? '#3b82f6' : '#e5e7eb',
                            color: filter === cat ? 'white' : '#374151',
                            cursor: 'pointer',
                            fontWeight: filter === cat ? 'bold' : 'normal'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Image</th>
                            <th style={{ padding: '12px' }}>Property Name</th>
                            <th style={{ padding: '12px' }}>Category</th>
                            <th style={{ padding: '12px' }}>Location</th>
                            <th style={{ padding: '12px' }}>Price</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {properties.filter(p => filter === 'All' || p.category === filter).map(property => (
                            <tr key={property.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>
                                    {property.photos && property.photos.length > 0 ? (
                                        <img src={`${API_BASE_URL}${property.photos[0]}`} alt={property.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '50px', height: '50px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>{property.propertyName}</td>
                                <td style={{ padding: '12px' }}>{property.category}</td>
                                <td style={{ padding: '12px' }}>{property.location}</td>
                                <td style={{ padding: '12px' }}>{property.price} {property.priceUnit}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        backgroundColor:
                                            property.status === 'Available' ? '#d1fae5' :
                                                property.status === 'Pending' ? '#fee2e2' :
                                                    property.status === 'EOI' ? '#dbeafe' : // Blue for EOI
                                                        property.status === 'RTMI' ? '#fef3c7' : // Yellow for RTMI
                                                            '#f3f4f6', // Gray for Sold or others
                                        color:
                                            property.status === 'Available' ? '#065f46' :
                                                property.status === 'Pending' ? '#991b1b' :
                                                    property.status === 'EOI' ? '#1e40af' :
                                                        property.status === 'RTMI' ? '#92400e' :
                                                            '#374151'
                                    }}>
                                        {property.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <Link to={`/properties/edit/${property.id}`} style={{ marginRight: '10px', color: '#2563eb' }}>
                                        <FaEdit />
                                    </Link>
                                    <button onClick={() => handleDelete(property.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {properties.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No properties found.</p>}
            </div>
        </div>
    );
};

export default PropertyList;

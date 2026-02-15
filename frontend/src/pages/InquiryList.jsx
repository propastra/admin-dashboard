import React, { useEffect, useState } from 'react';
import api from '../services/api';

const InquiryList = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const res = await api.get('/inquiries');
            setInquiries(res.data);
        } catch (err) {
            console.error("Failed to fetch inquiries", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/inquiries/${id}`, { status: newStatus });
            setInquiries(inquiries.map(inq =>
                inq.id === id ? { ...inq, status: newStatus } : inq
            ));
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this inquiry?")) {
            try {
                await api.delete(`/inquiries/${id}`);
                setInquiries(inquiries.filter(inq => inq.id !== id));
            } catch (err) {
                console.error("Failed to delete inquiry", err);
                alert("Failed to delete inquiry");
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Inquiries</h1>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Date</th>
                            <th style={{ padding: '12px' }}>Customer Name</th>
                            <th style={{ padding: '12px' }}>Contact</th>
                            <th style={{ padding: '12px' }}>Property</th>
                            <th style={{ padding: '12px' }}>Message</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inquiries.map(inquiry => (
                            <tr key={inquiry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>
                                    {new Date(inquiry.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px' }}>{inquiry.name}</td>
                                <td style={{ padding: '12px' }}>
                                    <div>{inquiry.email}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{inquiry.phone}</div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {inquiry.Property ? (
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{inquiry.Property.propertyName}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{inquiry.Property.location}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {inquiry.Property.price} {inquiry.Property.priceUnit}
                                            </div>
                                        </div>
                                    ) : (
                                        <span style={{ color: '#9ca3af' }}>Property Deleted</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inquiry.message}>
                                        {inquiry.message}
                                    </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <select
                                        value={inquiry.status}
                                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                                        style={{
                                            padding: '4px',
                                            borderRadius: '4px',
                                            border: '1px solid #d1d5db',
                                            backgroundColor:
                                                inquiry.status === 'New' ? '#dbeafe' :
                                                    inquiry.status === 'Contacted' ? '#fef3c7' :
                                                        '#d1fae5',
                                            color:
                                                inquiry.status === 'New' ? '#1e40af' :
                                                    inquiry.status === 'Contacted' ? '#92400e' :
                                                        '#065f46'
                                        }}
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => handleDelete(inquiry.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            padding: '4px 8px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {inquiries.length === 0 && (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No inquiries found.</p>
                )}
            </div>
        </div>
    );
};

export default InquiryList;

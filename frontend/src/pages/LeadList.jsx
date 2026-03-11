import React, { useEffect, useState } from 'react';
import api from '../services/api';

const LeadList = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await api.get('/inquiries');
            const investmentLeads = res.data.filter(inq => inq.message === 'Investment inquiry');
            setLeads(investmentLeads);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching investment inquiries:', err);
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/inquiries/${id}`, { status: newStatus });
            setLeads(leads.map(lead =>
                lead.id === id ? { ...lead, status: newStatus } : lead
            ));
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this investment inquiry?')) {
            try {
                await api.delete(`/inquiries/${id}`);
                setLeads(leads.filter(lead => lead.id !== id));
            } catch (err) {
                console.error('Failed to delete inquiry:', err);
                alert('Failed to delete inquiry');
            }
        }
    };

    if (loading) return <div>Loading Investment Inquiries...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Investment Inquiries</h1>
            </div>

            <div className="table-container card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Date</th>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Phone</th>
                            <th style={{ padding: '12px' }}>Message</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? leads.map(lead => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>{new Date(lead.createdAt).toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>{lead.name || '-'}</td>
                                <td style={{ padding: '12px' }}>{lead.email || '-'}</td>
                                <td style={{ padding: '12px' }}>{lead.phone || '-'}</td>
                                <td style={{ padding: '12px' }}>{lead.message || '-'}</td>
                                <td style={{ padding: '12px' }}>
                                    <select
                                        value={lead.status || 'New'}
                                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid #d1d5db',
                                            backgroundColor:
                                                lead.status === 'New' ? '#dbeafe' :
                                                    lead.status === 'Contacted' ? '#fef3c7' :
                                                        lead.status === 'Visit Scheduled' ? '#e0e7ff' : '#d1fae5',
                                            color:
                                                lead.status === 'New' ? '#1e40af' :
                                                    lead.status === 'Contacted' ? '#92400e' :
                                                        lead.status === 'Visit Scheduled' ? '#3730a3' : '#065f46'
                                        }}
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Visit Scheduled">Visit Scheduled</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => handleDelete(lead.id)}
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
                        )) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No investment inquiries found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadList;

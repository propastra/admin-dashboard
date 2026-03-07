import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const LeadList = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();

        // Connect to Socket.IO backend for real-time updates
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            transports: ['websocket', 'polling']
        });

        socket.on('new_lead', (newLead) => {
            console.log('New real-time lead received:', newLead);

            // Format to match API structure if needed
            const formattedLead = {
                id: newLead.userId + '_' + Date.now(),
                loginMethod: newLead.method,
                ipAddress: 'Website User',
                createdAt: newLead.timestamp,
                WebsiteUser: {
                    name: newLead.name,
                    email: newLead.email,
                    phone: newLead.phone,
                }
            };

            setLeads(prev => [formattedLead, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await api.get('/leads');
            setLeads(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leads:', err);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Leads...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Login Leads</h1>
            </div>

            <div className="table-container card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Date</th>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Phone</th>
                            <th style={{ padding: '12px' }}>Login Method</th>
                            <th style={{ padding: '12px' }}>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? leads.map(lead => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>{new Date(lead.createdAt).toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>{lead.WebsiteUser?.name || '-'}</td>
                                <td style={{ padding: '12px' }}>{lead.WebsiteUser?.email || '-'}</td>
                                <td style={{ padding: '12px' }}>{lead.WebsiteUser?.phone || '-'}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        backgroundColor: lead.loginMethod.includes('OTP') ? '#dbeafe' : '#e0e7ff',
                                        color: lead.loginMethod.includes('OTP') ? '#1e40af' : '#3730a3'
                                    }}>
                                        {lead.loginMethod}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>{lead.ipAddress || '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No leads found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadList;

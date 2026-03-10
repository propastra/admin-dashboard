import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageSquare, Calendar, User, CheckCircle, Clock, MapPin, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInquiries, getDashboardStats, updateInquiryStatus } from '../services/api';
import './AgentDashboard.css';

const AgentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user || (user.role !== 'Agent' && user.role !== 'Admin')) {
            navigate('/');
            return;
        }
        loadDashboardData();
    }, [user, navigate]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsRes, leadsRes] = await Promise.all([
                getDashboardStats(),
                getInquiries(),
            ]);
            setStats(statsRes.data);
            setLeads(leadsRes.data);
        } catch (err) {
            console.error('Failed to load dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateInquiryStatus(id, { status: newStatus });
            // Update local state
            setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
            // Reload stats seamlessly
            const statsRes = await getDashboardStats();
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Could not update status. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'var(--danger-light, #fee2e2)';
            case 'Contacted': return 'var(--warning-light, #fef3c7)';
            case 'Visit Scheduled': return 'var(--brand-light, #e0e7ff)';
            case 'Closed': return 'var(--success-light, #d1fae5)';
            default: return '#f3f4f6';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'New': return '#ef4444';
            case 'Contacted': return '#d97706';
            case 'Visit Scheduled': return 'var(--brand, #4f46e5)';
            case 'Closed': return '#10b981';
            default: return '#374151';
        }
    };

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery) ||
        (l.Property?.propertyName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="loading-screen"><div className="spinner"></div></div>;
    }

    return (
        <div className="agent-dashboard">
            <div className="dashboard-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-titles">
                    <h1>Agent CRM</h1>
                    <p>Manage your leads & pipelines</p>
                </div>
                <div className="agent-avatar">
                    <User size={24} />
                </div>
            </div>

            {/* Stats Section */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon-wrap" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}><User size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalLeads}</span>
                            <span className="stat-label">Total Leads</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrap" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}><Clock size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.newLeads}</span>
                            <span className="stat-label">New Leads</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}><Phone size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.contactedLeads}</span>
                            <span className="stat-label">Contacted</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrap" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}><CheckCircle size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.closedDeals}</span>
                            <span className="stat-label">Closed</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Leads Section */}
            <div className="leads-section">
                <div className="leads-header-row">
                    <h2>Recent Inquiries</h2>
                    <div className="leads-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="leads-list">
                    {filteredLeads.length > 0 ? (
                        filteredLeads.map(lead => (
                            <div key={lead.id} className="lead-card">
                                <div className="lead-top">
                                    <div className="lead-contact">
                                        <h3>{lead.name}</h3>
                                        <span className="lead-date">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <select
                                        className="status-dropdown"
                                        style={{ backgroundColor: getStatusColor(lead.status), color: getStatusTextColor(lead.status) }}
                                        value={lead.status}
                                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Visit Scheduled">Visit Scheduled</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div className="lead-property">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span>
                                        {lead.Property ? `${lead.Property.propertyName} ${lead.Property.location ? `(${lead.Property.location.split(',')[0]})` : ''}` : 'General Inquiry'}
                                    </span>
                                </div>
                                {lead.message && (
                                    <div className="lead-message">
                                        <MessageSquare size={14} className="text-gray-400" />
                                        <p>"{lead.message}"</p>
                                    </div>
                                )}
                                {lead.visitDate && (
                                    <div className="lead-visit">
                                        <Calendar size={14} className="text-brand" />
                                        <span>Requested Visit: <strong>{new Date(lead.visitDate).toLocaleDateString()}</strong></span>
                                    </div>
                                )}
                                <div className="lead-actions">
                                    <button className="btn-call" onClick={() => window.open(`tel:${lead.phone}`)}>
                                        <Phone size={16} /> Call {lead.phone}
                                    </button>
                                    <button className="btn-whatsapp" onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')}>
                                        <MessageSquare size={16} /> WhatsApp
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-leads">
                            <p>No leads found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ height: '80px' }}></div>
        </div>
    );
};

export default AgentDashboard;

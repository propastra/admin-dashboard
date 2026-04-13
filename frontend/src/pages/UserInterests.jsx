import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FaUserCircle, FaFire, FaMapMarkerAlt, FaTags, FaChartLine, FaEye, FaExchangeAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';

const UserInterests = () => {
    const [interestProfiles, setInterestProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUserInterests();
    }, []);

    const fetchUserInterests = async () => {
        try {
            const res = await api.get('/analytics/user-interests');
            setInterestProfiles(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching user interests:', err);
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score > 100) return '#dc2626'; // Red
        if (score > 50) return '#ea580c';  // Orange
        if (score > 20) return '#ca8a04';  // Yellow-Gold
        return '#65a30d'; // Green
    };

    const getEngagementBadge = (level) => {
        const colors = {
            'High': { bg: '#fee2e2', text: '#ef4444', icon: <FaFire /> },
            'Medium': { bg: '#fef3c7', text: '#d97706', icon: <FaChartLine /> },
            'Low': { bg: '#f0fdf4', text: '#16a34a', icon: <FaEye /> }
        };
        const config = colors[level] || colors['Low'];
        return (
            <span style={{
                padding: '4px 10px',
                backgroundColor: config.bg,
                color: config.text,
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                width: 'fit-content'
            }}>
                {config.icon} {level}
            </span>
        );
    };

    const filteredProfiles = interestProfiles.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader">Loading Behavioral Insights...</div>
        </div>
    );

    return (
        <div className="anim-fade-in" style={{ padding: '10px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem', color: '#1e293b', marginBottom: '8px' }}>User Interest Profiles</h1>
                <p style={{ color: '#64748b' }}>Discover high-intent leads based on real behavior and property preferences.</p>
            </div>

            {/* Header Stats */}
            <div className="grid-2-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '12px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px' }}>
                        <FaUsers size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Analyzed Users</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{interestProfiles.length}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px' }}>
                        <FaFire size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>High-Intent Leads</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {interestProfiles.filter(p => p.engagementLevel === 'High').length}
                        </div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '12px', background: '#fdf4ff', color: '#d946ef', borderRadius: '12px' }}>
                        <FaExchangeAlt size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Comparisons</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {interestProfiles.reduce((acc, p) => acc + p.comparisonCount, 0)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
                            width: '300px', fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f1f5f9' }}>
                                <th style={{ padding: '15px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>USER</th>
                                <th style={{ padding: '15px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>ENGAGEMENT</th>
                                <th style={{ padding: '15px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>SCORE</th>
                                <th style={{ padding: '15px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>TOP INTERESTS</th>
                                <th style={{ padding: '15px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProfiles.length > 0 ? filteredProfiles.map(profile => (
                                <tr key={profile.userId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="hover-row">
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', background: '#e2e8f0', 
                                                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                                                justifyContent: 'center', color: '#64748b'
                                            }}>
                                                <FaUserCircle size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{profile.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FaEnvelope size={10} /> {profile.email}
                                                </div>
                                                {profile.phone && (
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <FaPhoneAlt size={10} /> {profile.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        {getEngagementBadge(profile.engagementLevel)}
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ 
                                                width: '45px', height: '45px', borderRadius: '50%',
                                                border: `3px solid ${getScoreColor(profile.leadScore)}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 'bold', color: getScoreColor(profile.leadScore)
                                            }}>
                                                {profile.leadScore}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                                <FaTags size={12} color="#ec4899" /> <span>{profile.topCategory}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                                                <FaMapMarkerAlt size={12} color="#ef4444" /> <span>{profile.topLocation}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <button 
                                            onClick={() => setSelectedUser(profile)}
                                            style={{
                                                padding: '6px 14px', background: '#3b82f6', color: 'white',
                                                border: 'none', borderRadius: '6px', fontSize: '0.85rem',
                                                fontWeight: '500', cursor: 'pointer'
                                            }}
                                        >
                                            View Analysis
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No users matched your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)'
                }}>
                    <div className="anim-fade-in" style={{
                        backgroundColor: 'white', width: '800px', maxHeight: '90vh',
                        borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ padding: '24px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <FaUserCircle size={48} />
                                <div>
                                    <h2 style={{ margin: 0 }}>{selectedUser.name}</h2>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.8, display: 'flex', gap: '15px', marginTop: '4px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaEnvelope size={12} /> {selectedUser.email}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaPhoneAlt size={12} /> {selectedUser.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }}
                            >&times;</button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <div className="grid-2-cols" style={{ gap: '24px' }}>
                                {/* Left Column: Stats */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #3b82f6', paddingBottom: '8px', display: 'inline-block' }}>Interest Breakdown</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>Top Property Type</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{selectedUser.topCategory}</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>Primary Location</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{selectedUser.topLocation}</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>Comparison Count</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ec4899' }}>{selectedUser.comparisonCount} Comparisons</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Interactions */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #3b82f6', paddingBottom: '8px', display: 'inline-block' }}>Key Comparisons</h3>
                                    {selectedUser.recentComparisons.length > 0 ? selectedUser.recentComparisons.map((comp, idx) => (
                                        <div key={idx} style={{ marginBottom: '15px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                                                {new Date(comp.date).toLocaleString()}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {comp.names.map((name, i) => (
                                                    <span key={i} style={{ padding: '4px 8px', background: '#fce7f3', color: '#be185d', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No comparisons performed yet.</p>}

                                    <h3 style={{ fontSize: '1.1rem', margin: '20px 0 16px', color: '#1e293b', borderBottom: '2px solid #10b981', paddingBottom: '8px', display: 'inline-block' }}>Interacted Properties</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedUser.recentProperties.map(prop => (
                                            <span key={prop.id} style={{ padding: '6px 12px', background: '#f0fdf4', color: '#15803d', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #dcfce7' }}>
                                                {prop.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                style={{ padding: '10px 24px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >Close Profile</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hover-row:hover {
                    background-color: #f8fafc !important;
                }
                .loader {
                    width: 48px;
                    height: 48px;
                    border: 5px solid #e2e8f0;
                    border-bottom-color: #3b82f6;
                    border-radius: 50%;
                    display: inline-block;
                    box-sizing: border-box;
                    animation: rotation 1s linear infinite;
                }
                @keyframes rotation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default UserInterests;

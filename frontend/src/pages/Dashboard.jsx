import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalVisitors: 0,
        totalInteractions: 0,
        topProperties: []
    });
    const [activity, setActivity] = useState([]);
    const [recentInquiries, setRecentInquiries] = useState([]);
    const [filteredActivity, setFilteredActivity] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [activityFilter, setActivityFilter] = useState('all');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [dashRes, actRes, chartRes, inqRes] = await Promise.all([
                    api.get('/analytics/dashboard'),
                    api.get('/analytics/activity'),
                    api.get('/analytics/chart-data'),
                    api.get('/inquiries').catch(() => ({ data: [] }))
                ]);

                setStats(dashRes.data);
                setActivity(actRes.data);
                setChartData(chartRes.data);
                setRecentInquiries(Array.isArray(inqRes.data) ? inqRes.data.slice(0, 5) : []);
            } catch (err) {
                console.error("Error fetching stats", err);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        if (activityFilter === 'all') {
            setFilteredActivity(activity);
        } else {
            const now = new Date();
            const filtered = activity.filter(act => {
                const actDate = new Date(act.createdAt);
                const diffTime = Math.abs(now.getTime() - actDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (activityFilter === '7d') return diffDays <= 7;
                if (activityFilter === '30d') return diffDays <= 30;
                return true;
            });
            setFilteredActivity(filtered);
        }
    }, [activity, activityFilter]);

    const barData = {
        labels: stats.topProperties.map(p => p.Property?.propertyName || 'Unknown'),
        datasets: [
            {
                label: 'Views',
                data: stats.topProperties.map(p => p.count),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    const lineChartData = {
        labels: chartData.map(d => d.date),
        datasets: [
            {
                label: 'Total Views / Interactions',
                data: chartData.map(d => d.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3
            }
        ]
    };

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Dashboard Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div 
                    className="card" 
                    onClick={() => navigate('/properties')}
                    style={{ borderLeft: '4px solid #3b82f6', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <h3>Total Properties</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalProperties}</p>
                </div>
                <div 
                    className="card" 
                    onClick={() => navigate('/visitors')}
                    style={{ borderLeft: '4px solid #10b981', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <h3>Total Visitors</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalVisitors}</p>
                </div>
                <div 
                    className="card" 
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <h3>Total Interactions (Views)</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalInteractions}</p>
                </div>
            </div>

            <div className="grid-2-cols">
                <div className="card">
                    <h3>Top Properties by Views</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        {stats.topProperties.length > 0 ? (
                            <Bar options={{ responsive: true, maintainAspectRatio: false }} data={barData} />
                        ) : (
                            <p>No data available</p>
                        )}
                    </div>
                </div>
                <div className="card">
                    <h3>Website Reach (Last 30 Days)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={lineChartData} />
                    </div>
                </div>
            </div>

            <div className="card table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Recent Activity Log</h3>
                    <select 
                        value={activityFilter} 
                        onChange={(e) => setActivityFilter(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="all">All Activity</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '8px' }}>Date/Time</th>
                                <th style={{ padding: '8px' }}>Action</th>
                                <th style={{ padding: '8px' }}>Property</th>
                                <th style={{ padding: '8px' }}>User / IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActivity.length > 0 ? filteredActivity.map(act => (
                                <tr key={act.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px' }}>{new Date(act.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{act.interactionType}</div>
                                        {act.interactionType === 'Comparison' && act.metadata?.propertyNames && (
                                            <div style={{ fontSize: '0.75em', color: '#64748b', marginTop: '4px' }}>
                                                {act.metadata.propertyNames.join(' vs ')}
                                            </div>
                                        )}
                                        {act.interactionType === 'Search' && act.metadata?.query && (
                                            <div style={{ fontSize: '0.75em', color: '#059669', marginTop: '4px' }}>
                                                "{act.metadata.query}"
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '8px' }}>{act.Property ? act.Property.propertyName : '-'}</td>
                                    <td style={{ padding: '8px' }}>
                                        {act.WebsiteUser ? (
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#2563eb' }}>{act.WebsiteUser.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.WebsiteUser.email}</div>
                                                {act.WebsiteUser.phone && (
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.WebsiteUser.phone}</div>
                                                )}
                                            </div>
                                        ) : (
                                            act.Visitor ? act.Visitor.ipAddress : 'Unknown'
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No activity found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card table-container" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Recent Inquiries & Messages</h3>
                    <button onClick={() => navigate('/inquiries')} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View All</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '8px' }}>Date</th>
                                <th style={{ padding: '8px' }}>Name</th>
                                <th style={{ padding: '8px' }}>Contact</th>
                                <th style={{ padding: '8px' }}>Property</th>
                                <th style={{ padding: '8px' }}>Message</th>
                                <th style={{ padding: '8px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentInquiries.length > 0 ? recentInquiries.map(inq => (
                                <tr key={inq.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px' }}>{new Date(inq.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', fontWeight: '600' }}>{inq.name || '-'}</td>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{inq.email || '-'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{inq.phone || '-'}</div>
                                    </td>
                                    <td style={{ padding: '8px' }}>{inq.Property ? inq.Property.propertyName : <span style={{color: '#9ca3af'}}>General Inquiry</span>}</td>
                                    <td style={{ padding: '8px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inq.message || ''}>
                                        {inq.message || '-'}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em',
                                            backgroundColor: inq.status === 'New' ? '#dbeafe' : '#f3f4f6',
                                            color: inq.status === 'New' ? '#1e40af' : '#4b5563'
                                        }}>
                                            {inq.status || 'New'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No recent messages found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

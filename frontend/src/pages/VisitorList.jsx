import React, { useEffect, useState } from 'react';
import api from '../services/api';
import VisitorHistoryModal from '../components/VisitorHistoryModal';

const VisitorList = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [history, setHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchVisitors();
    }, []);

    const fetchVisitors = async () => {
        try {
            const res = await api.get('/visitors');
            setVisitors(res.data);
        } catch (err) {
            console.error("Failed to fetch visitors", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = async (id) => {
        try {
            const res = await api.put(`/visitors/block/${id}`);
            setVisitors(visitors.map(v => v.id === id ? { ...v, isBlocked: res.data.isBlocked } : v));
        } catch (err) {
            console.error("Failed to toggle block status", err);
        }
    };

    const handleViewHistory = async (visitor) => {
        try {
            const res = await api.get(`/visitors/${visitor.id}/history`);
            setHistory(res.data);
            setSelectedVisitor(visitor);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch visitor history", err);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this visitor?")) return;
        try {
            await api.delete(`/visitors/${id}`);
            setVisitors(visitors.filter(v => v.id !== id));
        } catch (err) {
            console.error("Failed to delete visitor", err);
        }
    };

    const handleExport = () => {
        const headers = ["IP Address", "User Agent", "Time Spent (seconds)", "Last Visit", "Status"];
        const rows = visitors.map(v => [
            v.ipAddress,
            `"${v.userAgent ? v.userAgent.replace(/"/g, '""') : ''}"`, // Escaped for CSV
            v.totalDuration || 0,
            `"${new Date(v.lastVisit).toLocaleString()}"`,
            v.isBlocked ? 'Blocked' : 'Active'
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Visitors_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Visitor Management</h1>
                <button 
                    onClick={handleExport} 
                    className="btn btn-primary"
                    style={{ backgroundColor: '#10b981', color: 'white' }}
                >
                    Export to Excel
                </button>
            </div>
            <div className="card" style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>IP Address</th>
                            <th style={{ padding: '12px' }}>Time Spent</th>
                            <th style={{ padding: '12px' }}>Last Visit</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitors.map(visitor => (
                            <tr key={visitor.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>
                                    {visitor.ipAddress}
                                    <div style={{ fontSize: '0.8em', color: '#6b7280' }}>{visitor.userAgent?.substring(0, 50)}...</div>
                                </td>
                                <td style={{ padding: '12px' }}>{formatDuration(visitor.totalDuration)}</td>
                                <td style={{ padding: '12px' }}>{new Date(visitor.lastVisit).toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        backgroundColor: visitor.isBlocked ? '#fee2e2' : '#d1fae5',
                                        color: visitor.isBlocked ? '#991b1b' : '#065f46'
                                    }}>
                                        {visitor.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleViewHistory(visitor)}
                                        className="btn"
                                        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 8px', fontSize: '14px' }}
                                    >
                                        History
                                    </button>
                                    <button
                                        onClick={() => toggleBlock(visitor.id)}
                                        className="btn"
                                        style={{ backgroundColor: visitor.isBlocked ? '#10b981' : '#f59e0b', color: 'white', padding: '4px 8px', fontSize: '14px' }}
                                    >
                                        {visitor.isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(visitor.id)}
                                        className="btn"
                                        style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', fontSize: '14px' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {visitors.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No visitors recorded yet.</p>}
            </div>

            <VisitorHistoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                history={history}
                visitorIp={selectedVisitor?.ipAddress}
            />
        </div>
    );
};

export default VisitorList;

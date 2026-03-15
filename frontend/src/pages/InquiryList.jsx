import React, { useEffect, useState } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const InquiryList = () => {
    const [inquiries, setInquiries] = useState([]);
    const [filteredInquiries, setFilteredInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [searchDate, setSearchDate] = useState('');

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [inquiries, dateFilter, searchDate]);

    const fetchInquiries = async () => {
        try {
            const res = await api.get('/inquiries');
            setInquiries(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch inquiries", err);
            setInquiries([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = inquiries;

        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(inq => {
                const inqDate = new Date(inq.createdAt);
                const diffTime = Math.abs(now.getTime() - inqDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (dateFilter === '7d') return diffDays <= 7;
                if (dateFilter === '30d') return diffDays <= 30;
                if (dateFilter === '60d') return diffDays <= 60;
                if (dateFilter === 'month') {
                    return inqDate.getMonth() === now.getMonth() && inqDate.getFullYear() === now.getFullYear();
                }
                return true;
            });
        }

        if (searchDate) {
            filtered = filtered.filter(inq => {
                // Ignore time completely
                const inqDate = new Date(inq.createdAt).toISOString().split('T')[0];
                return inqDate === searchDate;
            });
        }

        setFilteredInquiries(filtered);
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
                setSelectedId(null);
            } catch (err) {
                console.error("Failed to delete inquiry", err);
                alert("Failed to delete inquiry");
            }
        }
    };

    const exportToExcel = () => {
        const dataToExport = filteredInquiries.map(inq => ({
            Date: new Date(inq.createdAt).toLocaleString(),
            Name: inq.name || '-',
            Phone: inq.phone || '-',
            Email: inq.email || '-',
            Property: inq.Property?.propertyName || '-',
            Location: inq.Property?.location || '-',
            Message: inq.message || '-',
            Status: inq.status || 'New'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inquiries");
        XLSX.writeFile(workbook, `Inquiries_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const selected = selectedId ? filteredInquiries.find((i) => i.id === selectedId) : null;

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1>Inquiries</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '14px', color: '#4b5563' }}>Specific Date:</label>
                        <input 
                            type="date" 
                            value={searchDate} 
                            onChange={(e) => {
                                setSearchDate(e.target.value);
                                if (e.target.value) setDateFilter('all'); // Clear interval when specific date chosen
                            }}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => {
                            setDateFilter(e.target.value);
                            if (e.target.value !== 'all') setSearchDate(''); // Clear specific date when interval chosen
                        }}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="60d">Last 60 Days</option>
                        <option value="month">This Month</option>
                    </select>
                    <button 
                        onClick={exportToExcel}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        Export to Excel
                    </button>
                </div>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Date</th>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Mobile</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Property</th>
                            <th style={{ padding: '12px' }}>Message</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInquiries.map((inquiry) => (
                            <React.Fragment key={inquiry.id}>
                                <tr
                                    style={{
                                        borderBottom: '1px solid #f3f4f6',
                                        backgroundColor: selectedId === inquiry.id ? '#f0f9ff' : undefined,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedId(selectedId === inquiry.id ? null : inquiry.id)}
                                >
                                    <td style={{ padding: '12px' }}>{formatDate(inquiry.createdAt)}</td>
                                    <td style={{ padding: '12px' }}>{inquiry.name ?? '—'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <a href={`tel:${inquiry.phone || ''}`} onClick={(e) => e.stopPropagation()} style={{ color: '#2563eb' }}>
                                            {inquiry.phone ?? '—'}
                                        </a>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {inquiry.email ? (
                                            <a href={`mailto:${inquiry.email}`} onClick={(e) => e.stopPropagation()} style={{ color: '#2563eb' }}>
                                                {inquiry.email}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                                        {inquiry.Property ? (
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{inquiry.Property.propertyName ?? '—'}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{inquiry.Property.location ?? '—'}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {inquiry.Property.price != null ? `${inquiry.Property.price} ${inquiry.Property.priceUnit || ''}` : '—'}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', maxWidth: '200px' }}>
                                        <div
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            title={inquiry.message || ''}
                                        >
                                            {inquiry.message || '—'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={inquiry.status || 'New'}
                                            onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #d1d5db',
                                                backgroundColor:
                                                    inquiry.status === 'New' ? '#dbeafe' :
                                                        inquiry.status === 'Contacted' ? '#fef3c7' :
                                                            inquiry.status === 'Visit Scheduled' ? '#e0e7ff' : '#d1fae5',
                                                color:
                                                    inquiry.status === 'New' ? '#1e40af' :
                                                        inquiry.status === 'Contacted' ? '#92400e' :
                                                            inquiry.status === 'Visit Scheduled' ? '#3730a3' : '#065f46'
                                            }}
                                        >
                                            <option value="New">New</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="Visit Scheduled">Visit Scheduled</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
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
                                {selectedId === inquiry.id && selected && (
                                    <tr key={`${inquiry.id}-detail`} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                                        <td colSpan={8} style={{ padding: '16px 12px' }}>
                                            <div style={{ maxWidth: '720px' }}>
                                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>Full details</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', fontSize: '14px' }}>
                                                    <div><strong>Name</strong>: {selected.name ?? '—'}</div>
                                                    <div><strong>Mobile</strong>: {selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : '—'}</div>
                                                    <div><strong>Email</strong>: {selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : '—'}</div>
                                                    <div><strong>Date</strong>: {formatDate(selected.createdAt)}</div>
                                                    <div><strong>Status</strong>: {selected.status ?? 'New'}</div>
                                                </div>
                                                {selected.Property && (
                                                    <div style={{ marginTop: '12px' }}>
                                                        <strong>Property</strong>: {selected.Property.propertyName ?? '—'}
                                                        {selected.Property.location && ` · ${selected.Property.location}`}
                                                        {(selected.Property.price != null) && ` · ${selected.Property.price} ${selected.Property.priceUnit || ''}`}
                                                    </div>
                                                )}
                                                <div style={{ marginTop: '12px' }}>
                                                    <strong>Message</strong>: {selected.message || '—'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {filteredInquiries.length === 0 && (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No inquiries found.</p>
                )}
            </div>
        </div>
    );
};

export default InquiryList;

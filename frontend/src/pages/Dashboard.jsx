import React, { useEffect, useState } from 'react';
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
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalVisitors: 0,
        totalInteractions: 0,
        topProperties: []
    });
    const [activity, setActivity] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                setStats(res.data);

                const actRes = await api.get('/analytics/activity');
                setActivity(actRes.data);

                const chartRes = await api.get('/analytics/chart-data');
                setChartData(chartRes.data);
            } catch (err) {
                console.error("Error fetching stats", err);
            }
        };
        fetchStats();
    }, []);

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
                <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <h3>Total Properties</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalProperties}</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <h3>Total Visitors</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalVisitors}</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
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
                <h3>Recent Activity Log</h3>
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '8px' }}>Date/Time</th>
                                <th style={{ padding: '8px' }}>Action</th>
                                <th style={{ padding: '8px' }}>Property</th>
                                <th style={{ padding: '8px' }}>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.map(act => (
                                <tr key={act.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px' }}>{new Date(act.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: '8px' }}>{act.interactionType}</td>
                                    <td style={{ padding: '8px' }}>{act.Property ? act.Property.propertyName : '-'}</td>
                                    <td style={{ padding: '8px' }}>{act.Visitor ? act.Visitor.ipAddress : 'Unknown'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

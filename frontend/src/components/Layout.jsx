import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
                <div style={{ padding: '20px' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;

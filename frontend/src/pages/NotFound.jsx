import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '40px'
        }}>
            <h1 style={{ fontSize: '72px', fontWeight: '800', color: '#3b82f6', marginBottom: '8px' }}>404</h1>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Page Not Found</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
                The page you're looking for doesn't exist.
            </p>
            <button
                onClick={() => navigate('/')}
                style={{
                    padding: '10px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                }}
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default NotFound;

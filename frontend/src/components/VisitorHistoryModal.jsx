import React from 'react';
import { FaEye, FaSearch, FaEnvelope, FaClock, FaMousePointer, FaExchangeAlt } from 'react-icons/fa';

const VisitorHistoryModal = ({ isOpen, onClose, history, visitorIp }) => {
    if (!isOpen) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'View': return <FaEye style={{ color: '#3b82f6' }} />;
            case 'Search': return <FaSearch style={{ color: '#10b981' }} />;
            case 'Inquiry': return <FaEnvelope style={{ color: '#f59e0b' }} />;
            case 'Click': return <FaMousePointer style={{ color: '#6366f1' }} />;
            case 'Comparison': return <FaExchangeAlt style={{ color: '#ec4899' }} />;
            default: return <FaClock style={{ color: '#94a3b8' }} />;
        }
    };

    const renderMetadata = (item) => {
        const { interactionType, metadata, Property } = item;
        
        switch (interactionType) {
            case 'Comparison':
                if (metadata && metadata.propertyNames) {
                    return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.85em', color: '#64748b', alignSelf: 'center' }}>Compared:</span>
                            {metadata.propertyNames.map((name, i) => (
                                <React.Fragment key={i}>
                                    <span style={{
                                        padding: '4px 10px',
                                        backgroundColor: '#fce7f3',
                                        color: '#9d174d',
                                        borderRadius: '16px',
                                        fontSize: '0.8em',
                                        fontWeight: '600'
                                    }}>
                                        {name}
                                    </span>
                                    {i < metadata.propertyNames.length - 1 && <span style={{ color: '#cbd5e1' }}>vs</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    );
                }
                return null;

            case 'Search':
                if (metadata && metadata.query) {
                    return (
                        <p style={{ marginTop: '8px', fontSize: '0.9em' }}>
                            <span style={{ color: '#64748b' }}>Searched for: </span>
                            <strong style={{ color: '#059669' }}>"{metadata.query}"</strong>
                        </p>
                    );
                }
                return null;

            case 'Click':
                return (
                    <p style={{ marginTop: '5px', fontSize: '0.9em', color: '#64748b' }}>
                        Clicked on property card
                    </p>
                );

            case 'View':
                return (
                    <p style={{ marginTop: '5px', fontSize: '0.9em', color: '#64748b' }}>
                        Viewed property details
                    </p>
                );

            default:
                if (metadata && Object.keys(metadata).length > 0) {
                    return (
                        <pre style={{ 
                            fontSize: '0.75em', 
                            background: '#f8fafc', 
                            padding: '8px', 
                            borderRadius: '6px',
                            marginTop: '8px',
                            border: '1px solid #e2e8f0',
                            color: '#475569'
                        }}>
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    );
                }
                return null;
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="anim-fade-in" style={{
                backgroundColor: 'white', padding: '0', borderRadius: '12px',
                width: '650px', maxHeight: '85vh', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#f8fafc',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '10px', 
                            backgroundColor: '#3b82f6', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FaClock />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                                {(() => {
                                    const user = history.find(h => h.WebsiteUser)?.WebsiteUser;
                                    return user ? user.name : 'Visitor Activity';
                                })()}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>IP: {visitorIp}</p>
                                {(() => {
                                    const user = history.find(h => h.WebsiteUser)?.WebsiteUser;
                                    return user?.phone ? (
                                        <>
                                            <span style={{ color: '#cbd5e1' }}>•</span>
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#2563eb', fontWeight: '600' }}>
                                                {user.phone}
                                            </p>
                                        </>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            border: 'none', background: '#f1f5f9', fontSize: '20px', 
                            cursor: 'pointer', width: '32px', height: '32px', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', color: '#64748b', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                        onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <FaClock style={{ fontSize: '48px', color: '#e2e8f0', marginBottom: '16px' }} />
                            <p style={{ color: '#94a3b8' }}>No history recorded for this visitor yet.</p>
                        </div>
                    ) : (
                        <div className="timeline">
                            {history.map((item, index) => (
                                <div key={item.id} style={{
                                    display: 'flex', gap: '20px', marginBottom: '24px',
                                    borderLeft: '2px solid #f1f5f9', paddingLeft: '28px', position: 'relative'
                                }}>
                                    {/* Timeline Dot */}
                                    <div style={{
                                        position: 'absolute', left: '-13px', top: '0',
                                        backgroundColor: 'white', padding: '4px',
                                        borderRadius: '50%', border: '2px solid #f1f5f9',
                                        width: '24px', height: '24px', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        {getIcon(item.interactionType)}
                                    </div>
                                    
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ 
                                                margin: 0, 
                                                fontSize: '1rem', 
                                                color: '#1e293b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                flexWrap: 'wrap'
                                            }}>
                                                {item.interactionType}
                                                {item.WebsiteUser && (
                                                    <span style={{ 
                                                        fontWeight: '600', 
                                                        fontSize: '0.85em', 
                                                        color: '#2563eb',
                                                        backgroundColor: '#eff6ff',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        By {item.WebsiteUser.name}
                                                    </span>
                                                )}
                                                {item.Property && (
                                                    <span style={{ 
                                                        fontWeight: '400', 
                                                        fontSize: '0.9em', 
                                                        color: '#64748b',
                                                        backgroundColor: '#f1f5f9',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {item.Property.propertyName}
                                                    </span>
                                                )}
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                        
                                        <div style={{ 
                                            background: '#ffffff',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s'
                                        }}>
                                            {renderMetadata(item)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisitorHistoryModal;

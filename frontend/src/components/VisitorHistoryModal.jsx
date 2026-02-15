import React from 'react';
import { FaEye, FaSearch, FaEnvelope, FaClock, FaMousePointer } from 'react-icons/fa';

const VisitorHistoryModal = ({ isOpen, onClose, history, visitorIp }) => {
    if (!isOpen) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'View': return <FaEye className="text-blue-500" />;
            case 'Search': return <FaSearch className="text-green-500" />;
            case 'Inquiry': return <FaEnvelope className="text-yellow-500" />;
            case 'Click': return <FaMousePointer className="text-gray-500" />;
            default: return <FaClock className="text-gray-400" />;
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                width: '600px', maxHeight: '80vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2>Visitor History ({visitorIp})</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                </div>

                {history.length === 0 ? (
                    <p>No history available for this visitor.</p>
                ) : (
                    <div className="timeline">
                        {history.map((item, index) => (
                            <div key={item.id} style={{
                                display: 'flex', gap: '15px', marginBottom: '15px',
                                borderLeft: '2px solid #e5e7eb', paddingLeft: '20px', position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute', left: '-9px', top: '0',
                                    backgroundColor: 'white', padding: '2px'
                                }}>
                                    {getIcon(item.interactionType)}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 'bold', margin: 0 }}>
                                        {item.interactionType}
                                        {item.Property ? ` - ${item.Property.propertyName}` : ''}
                                    </p>
                                    <p style={{ fontSize: '0.85em', color: '#6b7280', margin: '5px 0' }}>
                                        {new Date(item.createdAt).toLocaleString()}
                                    </p>
                                    {item.metadata && (
                                        <pre style={{ fontSize: '0.75em', background: '#f3f4f6', padding: '5px', borderRadius: '4px' }}>
                                            {JSON.stringify(item.metadata, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisitorHistoryModal;

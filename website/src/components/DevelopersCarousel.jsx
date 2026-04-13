import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../services/api';
import './DevelopersCarousel.css';

const DevelopersCarousel = ({ developers }) => {
    const navigate = useNavigate();

    if (!developers || developers.length === 0) return null;


    return (
        <section className="developers-section animate-section">
            <div className="section-header">
                <div className="title-group">
                    <h2>Trusted Developers in <span className="hero-highlight">India</span></h2>
                    <p className="section-subtitle">Find projects from India's most reputable builders.</p>
                </div>
            </div>
            
            <div className="developers-wrapper">
                <div className="developers-container">
                    <div className="developers-grid">
                        {developers.map((dev, index) => (
                            <div 
                                key={`${dev.id}-${index}`} 
                                className="developer-card" 
                                onClick={() => navigate(`/search?q=${encodeURIComponent(dev.name)}`)}
                            >
                                <div className="developer-logo-wrap">
                                    <img 
                                        src={dev.logo?.startsWith('http') ? dev.logo : `${BACKEND_URL}${dev.logo}`} 
                                        alt={dev.name} 
                                        className="developer-logo" 
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=2563eb&color=fff&bold=true&size=128`;
                                        }}
                                    />
                                </div>
                                <div className="developer-info">
                                    <h3 className="developer-name">{dev.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(DevelopersCarousel);

import React from 'react';
import { BACKEND_URL } from '../services/api';
import './DevelopersCarousel.css';

const DevelopersCarousel = ({ developers }) => {
    if (!developers || developers.length === 0) return null;

    // Create a robust set of developers to ensure it fills the longest screens perfectly
    const devSet = [...developers, ...developers, ...developers, ...developers];

    const renderCard = (dev, index, offset) => (
        <div 
            key={`${dev.id}-${offset}-${index}`} 
            className="developer-card"
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
    );

    return (
        <section className="developers-section animate-section">
            <div className="section-header">
                <div className="title-group">
                    <h2>Trusted Developers in <span className="hero-highlight">India</span></h2>
                    <p className="section-subtitle">Find projects from India's most reputable builders.</p>
                </div>
            </div>
            
            <div className="developers-marquee">
                {/* Top Row - Moves Left */}
                <div className="marquee-track">
                    <div className="marquee-content">
                        {devSet.map((dev, index) => renderCard(dev, index, 'top-a'))}
                    </div>
                    <div className="marquee-content">
                        {devSet.map((dev, index) => renderCard(dev, index, 'top-b'))}
                    </div>
                </div>
                {/* Bottom Row - Moves Right */}
                <div className="marquee-track reverse" style={{ marginTop: '16px' }}>
                    <div className="marquee-content">
                        {devSet.map((dev, index) => renderCard(dev, index, 'bottom-a'))}
                    </div>
                    <div className="marquee-content">
                        {devSet.map((dev, index) => renderCard(dev, index, 'bottom-b'))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(DevelopersCarousel);

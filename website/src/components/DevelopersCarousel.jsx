import React, { useRef } from 'react';
import { ChevronRight, ArrowRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../services/api';
import './DevelopersCarousel.css';

const DevelopersCarousel = ({ developers }) => {
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    if (!developers || developers.length === 0) return null;

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' 
                ? scrollLeft - clientWidth * 0.8 
                : scrollLeft + clientWidth * 0.8;
            
            scrollRef.current.scrollTo({
                left: scrollTo,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="developers-section animate-section">
            <div className="section-header">
                <div className="title-group">
                    <h2>Trusted Developers in <span className="hero-highlight">India</span></h2>
                    <p className="section-subtitle">Find projects from India's most reputable builders.</p>
                </div>
            </div>
            
            <div className="developers-wrapper">
                <button className="side-control-btn prev" onClick={() => scroll('left')} aria-label="Scroll Left">
                    <ChevronLeft size={24} />
                </button>
                
                <div className="developers-container" ref={scrollRef}>
                    <div className="developers-grid">
                        {developers.map((dev, index) => (
                            <div 
                                key={dev.id} 
                                className="developer-card" 
                                style={{ animationDelay: `${index * 0.05}s` }}
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

                <button className="side-control-btn next" onClick={() => scroll('right')} aria-label="Scroll Right">
                    <ChevronRight size={24} />
                </button>
            </div>
        </section>
    );
};

export default React.memo(DevelopersCarousel);

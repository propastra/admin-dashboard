import React, { useState, useEffect, useRef } from 'react';
import { IndianRupee, FileText, Home, Maximize } from 'lucide-react';
import './StatsCounter.css';

// Custom hook to animate numbers counting up
const useCountUp = (end, duration = 2000, startAnimating = false) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!startAnimating) return;

        let startTime = null;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // easeOutQuad
            const easeOut = progress * (2 - progress);
            
            setCount(Math.floor(easeOut * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [end, duration, startAnimating]);

    return count;
};

const StatCard = ({ icon: Icon, number, suffix, text, delay, startAnimating }) => {
    const count = useCountUp(number, 2000, startAnimating);

    return (
        <div className={`stat-card ${startAnimating ? 'animate-in' : ''}`} style={{ animationDelay: `${delay}s` }}>
            <div className="stat-icon-wrap">
                <Icon size={28} className="stat-icon" />
            </div>
            <div className="stat-number-wrap">
                <span className="stat-number">{count}{suffix}</span>
            </div>
            <p className="stat-text">{text}</p>
        </div>
    );
};

const StatsCounter = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            { threshold: 0.2 } // Trigger when 20% visible
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const statsData = [
        {
            icon: IndianRupee,
            number: 1350,
            suffix: '',
            text: 'Crores',
            subText: 'VALUE GENERATED',
            delay: 0.1
        },
        {
            icon: FileText,
            number: 25,
            suffix: '+',
            text: 'Mandates',
            delay: 0.3
        },
        {
            icon: Home,
            number: 2200,
            suffix: '',
            text: 'Units',
            subText: 'SOLD',
            delay: 0.5
        },
        {
            icon: Maximize,
            number: 4,
            suffix: '',
            text: 'Million Sq Ft.',
            subText: 'SOLD',
            delay: 0.7
        }
    ];

    return (
        <section className="stats-section" ref={sectionRef}>
            <div className="stats-container">
                <div className="stats-grid">
                    {statsData.map((stat, index) => (
                        <div 
                            key={index} 
                            className={`stat-card ${isVisible ? 'animate-in' : ''}`} 
                            style={{ animationDelay: `${stat.delay}s` }}
                        >
                            <div className="stat-icon-wrap">
                                <stat.icon size={36} strokeWidth={1.5} />
                            </div>
                            <div className="stat-number-wrap">
                                {/* Use custom hook specifically mapped per card */}
                                <AnimatedNumber 
                                    end={stat.number} 
                                    suffix={stat.suffix} 
                                    start={isVisible} 
                                />
                            </div>
                            <h3 className="stat-main-text">{stat.text}</h3>
                            {stat.subText && <p className="stat-subtext">{stat.subText}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Extracted to manage state properly per card
const AnimatedNumber = ({ end, suffix, start }) => {
    const count = useCountUp(end, 2500, start);
    return <span className="stat-number">{count}{suffix}</span>
};

export default React.memo(StatsCounter);

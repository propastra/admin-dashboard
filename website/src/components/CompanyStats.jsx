import React, { useState, useEffect, useRef } from 'react';
import { IndianRupee, FileCheck, Building2, Maximize } from 'lucide-react';
import './CompanyStats.css';

const statsData = [
    {
        id: 1,
        icon: <IndianRupee size={40} strokeWidth={1.2} />,
        value: 1350,
        suffix: "",
        subtitle: "Crores",
        description: "VALUE GENERATED"
    },
    {
        id: 2,
        icon: <FileCheck size={40} strokeWidth={1.2} />,
        value: 25,
        suffix: "+",
        subtitle: "Mandates",
        description: "SUCCESSFULLY"
    },
    {
        id: 3,
        icon: <Building2 size={40} strokeWidth={1.2} />,
        value: 2200,
        suffix: "",
        subtitle: "Units",
        description: "SOLD"
    },
    {
        id: 4,
        icon: <Maximize size={40} strokeWidth={1.2} />,
        value: 4,
        suffix: " Million",
        subtitle: "Sq Ft.",
        description: "SOLD"
    }
];

// Easing function for smoother counting
const easeOutQuart = (t) => 1 - (--t) * t * t * t;

const Counter = ({ end, duration, startCounting }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!startCounting) return;
        
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Apply easing
            const easeProgress = easeOutQuart(progress);
            
            setCount(Math.floor(easeProgress * end));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration, startCounting]);

    return <span>{count}</span>;
};

const CompanyStats = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section className="company-stats-section" ref={sectionRef}>
            <div className="stats-container">
                <div className="stats-grid">
                    {statsData.map((stat, index) => (
                        <div 
                            key={stat.id} 
                            className={`stat-card ${isVisible ? 'fade-in-up' : ''}`}
                            style={{ animationDelay: `${index * 0.15}s` }}
                        >
                            <div className="stat-icon-wrapper">
                                {stat.icon}
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">
                                    <Counter end={stat.value} duration={2500} startCounting={isVisible} />
                                    {stat.suffix}
                                </h3>
                                <h4 className="stat-subtitle">{stat.subtitle}</h4>
                                <p className="stat-description">{stat.description}</p>
                            </div>
                            {/* Interactive glowing border box effect */}
                            <div className="stat-card-border"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CompanyStats;

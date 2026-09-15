import React, { useState, useEffect, useCallback } from 'react';
import './HeroSlideshow.css';

// Realistic Bangalore luxury real estate images (apartments & villas)
const HERO_IMAGES = [
  {
    src: "/images/hero-bangalore-apartment.jpg",
    alt: "Luxury high-rise apartment towers in Bangalore",
  },
  {
    src: "/images/hero-bangalore-villa.jpg",
    alt: "Modern luxury villa with private pool in Bangalore",
  },
  {
    src: "/images/hero-bangalore-residence.jpg",
    alt: "Bangalore skyline residence with rooftop garden",
  },
];

const SLIDE_DURATION = 5000;

const HeroSlideshow = () => {
    const [current, setCurrent] = useState(0);
    const [loaded, setLoaded] = useState([true, true, true]);

    const advance = useCallback(() => {
        setCurrent(prev => {
            const next = (prev + 1) % HERO_IMAGES.length;
            setLoaded(l => { const n = [...l]; n[next] = true; return n; });
            return next;
        });
    }, []);

    useEffect(() => {
        const timer = setInterval(advance, SLIDE_DURATION);
        return () => clearInterval(timer);
    }, [advance]);

    return (
        <div className="hero-slideshow-container" aria-hidden="true">
            {HERO_IMAGES.map((img, i) => (
                <div
                    key={i}
                    className={`hero-slide${i === current ? ' hero-slide--active' : ''}`}
                >
                    {loaded[i] && (
                        <img
                            src={img.src}
                            alt={img.alt}
                            className="hero-slide-img"
                            /* First image eager, rest lazy */
                            loading={i === 0 ? 'eager' : 'lazy'}
                            fetchpriority={i === 0 ? 'high' : 'low'}
                            decoding={i === 0 ? 'sync' : 'async'}
                            width="1280"
                            height="720"
                        />
                    )}
                    <div className="hero-slide-overlay" />
                </div>
            ))}
        </div>
    );
};

export default HeroSlideshow;

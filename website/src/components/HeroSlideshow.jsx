import React, { useState, useEffect, useCallback } from 'react';
import './HeroSlideshow.css';

// Optimised: mobile-sized images on small screens, desktop on large
const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=75&w=1280",
    srcSet: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=70&w=640 640w, https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=75&w=1280 1280w",
    alt: "Modern luxury house",
  },
  {
    src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=75&w=1280",
    srcSet: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=70&w=640 640w, https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=75&w=1280 1280w",
    alt: "High-end apartment",
  },
  {
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=75&w=1280",
    srcSet: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=70&w=640 640w, https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=75&w=1280 1280w",
    alt: "Luxury villa",
  },
];

const SLIDE_DURATION = 5000;

const HeroSlideshow = () => {
    const [current, setCurrent] = useState(0);
    const [loaded, setLoaded] = useState([true, false, false]); // only preload first

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
                            srcSet={img.srcSet}
                            sizes="100vw"
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

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import './HeroSlideshow.css';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1920", // Modern House
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1920", // High-end Apartment
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1920", // Luxury Villa
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920", // Modern Architecture
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1920"  // Contemporary Interior
];

const HeroSlideshow = () => {
    return (
        <div className="hero-slideshow-container">
            <Swiper
                effect={'fade'}
                fadeEffect={{ crossFade: true }}
                loop={true}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                modules={[EffectFade, Autoplay]}
                className="hero-swiper"
            >
                {HERO_IMAGES.map((image, index) => (
                    <SwiperSlide key={index}>
                        <div 
                            className="hero-slide-bg" 
                            style={{ backgroundImage: `url(${image})` }}
                        >
                            <div className="hero-slide-overlay"></div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default HeroSlideshow;

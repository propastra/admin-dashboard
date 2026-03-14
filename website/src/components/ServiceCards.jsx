import React, { useState } from 'react';
import { Building2, KeyRound, Coins, ArrowRight } from 'lucide-react';
import './ServiceCards.css';

const ServiceCards = ({ setActiveCategory, setBuyListingType, investSubmitted, handleInvestSubmit, user, ensureIdentified }) => {
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const services = [
    {
      id: 'buy',
      title: 'Own Your Dream Home',
      description: 'Find new launches, resale homes, and verified projects handpicked to match your needs.',
      icon: <Building2 size={32} />,
      btnText: 'Explore Homes',
      color: 'blue',
      options: [
        { label: 'Developer Listing', type: 'Developer' },
        { label: 'Owner Listing', type: 'Owner' }
      ]
    },
    {
      id: 'rent',
      title: 'Explore Rental Options',
      description: 'Choose from fully verified rental homes that fit your budget and lifestyle.',
      icon: <KeyRound size={32} />,
      btnText: 'Find Rentals',
      color: 'purple',
      isComingSoon: true
    },
    {
      id: 'invest',
      title: 'Smart Property Investments',
      description: 'Looking for high-yield real estate investments? Talk to our experts to find the best opportunities.',
      icon: <Coins size={32} />,
      btnText: 'Invest Now',
      color: 'orange'
    }
  ];

  const handleMainCtaClick = (service) => {
    if (service.options || service.isComingSoon || service.id === 'invest') {
      setActiveSubMenu(activeSubMenu === service.id ? null : service.id);
    }
  };

  const handleOptionClick = (serviceId, type) => {
    if (serviceId === 'buy') {
      setActiveCategory('Buy');
      setBuyListingType(type);
      setActiveSubMenu(null);
      
      // Smooth scroll to results
      setTimeout(() => {
        const element = document.querySelector('.home-body');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <section className="service-cards-section">
      <div className="container">
        <div className="section-header-centered">
          <h2>See How We Can Help You Find the <span className="highlight-text">Right Property</span></h2>
          <p>Your one-stop destination for buying, renting, and selling real estate with confidence.</p>
        </div>

        <div className="service-cards-grid">
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`service-card ${service.color} ${activeSubMenu === service.id ? 'expanded' : ''}`}
            >
              <div className="card-inner">
                <div className="card-main-content">
                  <div className="card-icon-wrapper">
                    {service.icon}
                  </div>
                  <div className="card-content">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <button 
                      className="card-cta-btn" 
                      onClick={() => handleMainCtaClick(service)}
                    >
                      {service.btnText}
                      <ArrowRight size={18} className={activeSubMenu === service.id ? 'rotate-90' : ''} />
                    </button>
                  </div>
                </div>

                {activeSubMenu === service.id && (
                  <div className="card-options-overlay">
                    <div className="options-container">
                      {service.id === 'invest' ? (
                        <div className="card-invest-form">
                          {investSubmitted ? (
                            <div className="invest-success">
                              <h3>Thank you</h3>
                              <p>We will reach out soon....</p>
                            </div>
                          ) : (
                            <div className="invest-form-content">
                              <h3>Talk To Our Expert</h3>
                              <p>Fill in to know more</p>
                              <button 
                                className="sub-option-btn invest-submit"
                                onClick={() => {
                                  if (user) handleInvestSubmit();
                                  else ensureIdentified(handleInvestSubmit, 'To speak to our experts, please verify your details');
                                }}
                              >
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      ) : service.isComingSoon ? (
                        <div className="coming-soon-msg">
                          <h3>Coming Soon</h3>
                          <p>We're working hard to bring this service to you!</p>
                        </div>
                      ) : (
                        service.options?.map((opt, i) => (
                          <button 
                            key={i} 
                            className="sub-option-btn"
                            onClick={() => handleOptionClick(service.id, opt.type)}
                          >
                            {opt.label}
                          </button>
                        ))
                      )}
                      <button 
                        className="back-btn" 
                        onClick={() => setActiveSubMenu(null)}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="card-bg-decoration"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ServiceCards);

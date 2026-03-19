import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Coins, ArrowRight } from 'lucide-react';
import { submitInquiry } from '../services/api';
import './ServiceCards.css';

const ServiceCards = ({ setActiveCategory, setBuyListingType, investSubmitted, handleInvestSubmit, user, ensureIdentified, onCompareClick }) => {
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState(null); // 'buy' | 'rental' | 'invest' | null
  const [investLoading, setInvestLoading] = useState(false);
  const [investSuccess, setInvestSuccess] = useState(investSubmitted || false);

  const services = [
    {
      id: 'buy',
      title: 'Own Your Dream Home',
      description: 'Find new launches, resale homes, and verified projects handpicked to match your needs.',
      icon: <Building2 size={28} />,
      btnText: 'Explore Homes',
      color: 'blue'
    },
    {
      id: 'rental',
      title: 'Explore Rental Options',
      description: 'Choose from fully verified rental homes that fit your budget and lifestyle.',
      icon: <KeyRound size={28} />,
      btnText: 'Find Rentals',
      color: 'purple'
    },
    {
      id: 'invest',
      title: 'Smart Property Investments',
      description: 'Looking for high-yield real estate investments? Talk to our experts to find the best opportunities.',
      icon: <Coins size={28} />,
      btnText: 'Invest Now',
      color: 'orange'
    }
  ];


  const handleResidentialClick = () => {
    setExpandedCard(null);
    navigate('/search?category=Residential');
  };

  const handleResaleClick = () => {
    setExpandedCard('buy-resale-soon');
  };

  const handleInvestSubmitLocal = async () => {
    setInvestLoading(true);
    try {
      await submitInquiry({
        name: user?.name || 'Investment Lead',
        phone: user?.phone || '0000000000',
        email: user?.email || null,
        message: 'Investment inquiry'
      });
      setInvestSuccess(true);
      localStorage.setItem('invest_submitted', 'true');
      if (typeof handleInvestSubmit === 'function') handleInvestSubmit();
    } catch (err) {
      console.error('Failed to submit investment inquiry', err);
      setInvestSuccess(true);
      localStorage.setItem('invest_submitted', 'true');
    } finally {
      setInvestLoading(false);
    }
  };

  const handleCardBtnClick = (service) => {
    if (service.id === 'buy') {
      setExpandedCard(expandedCard === 'buy' ? null : 'buy');
    } else if (service.id === 'rental') {
      setExpandedCard(expandedCard === 'rental' ? null : 'rental');
    } else if (service.id === 'invest') {
      if (user) {
        setExpandedCard(expandedCard === 'invest' ? null : 'invest');
      } else {
        ensureIdentified(() => {
          setExpandedCard('invest');
        }, 'To speak to our experts, please verify your details');
      }
    }
  };

  return (
    <section className="service-cards-section">
      <div className="service-cards-container">
        <div className="section-header-centered">
          <h2>See How We Can Help You Find the <span className="highlight-text">Right Property</span></h2>
          <p>Your one-stop destination for buying, renting, and selling real estate with confidence.</p>
        </div>

        <div className="service-cards-grid">
          {services.map((service, index) => (
            <div key={index} className={`service-card ${service.color} ${expandedCard === service.id ? 'sc-expanded' : ''}`}>

              {/* Main card content */}
              <div className="card-main-content">
                <div className="card-icon-wrapper">
                  {service.icon}
                </div>
                <h3 className="card-title">{service.title}</h3>
                <p className="card-description">{service.description}</p>
                <button
                  className="card-cta-btn"
                  onClick={() => handleCardBtnClick(service)}
                >
                  {service.btnText} <ArrowRight size={16} />
                </button>
              </div>

              {/* Overlay for "buy" card — choice buttons */}
              {service.id === 'buy' && expandedCard === 'buy' && (
                <div className="card-overlay">
                  <div className="overlay-inner">
                    <button className="sub-listing-btn residential" onClick={handleResidentialClick}>
                      Residential
                    </button>
                    <button className="sub-listing-btn resale" onClick={handleResaleClick}>
                      Resale
                    </button>
                    <button className="overlay-back-btn" onClick={() => setExpandedCard(null)}>
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay for "buy" card — Resale coming soon */}
              {service.id === 'buy' && expandedCard === 'buy-resale-soon' && (
                <div className="card-overlay coming-soon-overlay">
                  <div className="overlay-inner">
                    <h3 className="coming-soon-title">COMING SOON</h3>
                    <p className="coming-soon-text">We're working hard to bring this service to you!</p>
                    <button className="overlay-back-btn" onClick={() => setExpandedCard(null)}>
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay for "rental" card — Coming Soon */}
              {service.id === 'rental' && expandedCard === 'rental' && (
                <div className="card-overlay coming-soon-overlay">
                  <div className="overlay-inner">
                    <h3 className="coming-soon-title">COMING SOON</h3>
                    <p className="coming-soon-text">We're working hard to bring this service to you!</p>
                    <button className="overlay-back-btn" onClick={() => setExpandedCard(null)}>
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay for "invest" card */}
              {service.id === 'invest' && expandedCard === 'invest' && (
                <div className="card-overlay invest-overlay">
                  <div className="overlay-inner">
                    {investSuccess ? (
                      <div className="invest-thank-you">
                        <h3>Thank you</h3>
                        <p>We will reach out soon....</p>
                      </div>
                    ) : (
                      <>
                        <div className="invest-form-header">
                          <h3>Talk To Our Expert</h3>
                          <p>Fill in to know more</p>
                        </div>
                        <button
                          className="sub-listing-btn invest-submit-btn"
                          onClick={handleInvestSubmitLocal}
                          disabled={investLoading}
                        >
                          {investLoading ? 'Submitting...' : 'SUBMIT'}
                        </button>
                      </>
                    )}
                    <button className="overlay-back-btn" onClick={() => setExpandedCard(null)}>
                      Back
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ServiceCards);

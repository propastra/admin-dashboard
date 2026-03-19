import React from 'react';
import { Home, Repeat, Scale } from 'lucide-react';
import './PropertyTypeBar.css';

const PropertyTypeBar = ({ onResidentialClick, onResaleClick, onCompareClick }) => {
  return (
    <div className="property-type-bar-container anim-fade-up">
      <div className="property-type-bar">
        <button className="type-btn" onClick={onResidentialClick}>
          <div className="icon-wrap blue">
            <Home size={20} />
          </div>
          <div className="text-wrap">
            <span className="type-label">Residential</span>
            <span className="type-sub">New Launches</span>
          </div>
        </button>

        <div className="divider"></div>

        <button className="type-btn" onClick={onResaleClick}>
          <div className="icon-wrap purple">
            <Repeat size={20} />
          </div>
          <div className="text-wrap">
            <span className="type-label">Resale</span>
            <span className="type-sub">Pre-owned Homes</span>
          </div>
        </button>

        <div className="divider"></div>

        <button className="type-btn" onClick={onCompareClick}>
          <div className="icon-wrap orange">
            <Scale size={20} />
          </div>
          <div className="text-wrap">
            <span className="type-label">Compare</span>
            <span className="type-sub">Best Deals</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default PropertyTypeBar;

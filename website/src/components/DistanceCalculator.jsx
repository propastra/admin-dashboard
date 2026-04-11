import React, { useState } from 'react';
import { Search, MapPin, Route } from 'lucide-react';
import { getCoordinates, calculateRoute } from '../utils/mapUtils';

const DistanceCalculator = ({ property, getDisplayTitle }) => {
    const [calcDestination, setCalcDestination] = useState('');
    const [calcResult, setCalcResult] = useState(null);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcError, setCalcError] = useState('');

    const handleCalculateDistance = async (e, forcedDest = null) => {
        if (e) e.preventDefault();
        const destToUse = forcedDest || calcDestination;
        if (!destToUse.trim()) return;

        setCalcLoading(true);
        setCalcError('');
        setCalcResult(null);

        try {
            let propCoords = null;
            if (property.latitude && property.longitude) {
                propCoords = { lat: parseFloat(property.latitude), lon: parseFloat(property.longitude) };
            } else {
                const area = property.location ? property.location.split(',')[0].trim() : '';
                const projName = property.projectName || property.propertyName.split('-')[0].trim();
                const city = property.location ? property.location.split(',').pop().trim().replace(/\.$/, '') : 'Bengaluru';
                propCoords = await getCoordinates(`${projName}, ${area}`, city);
                if (!propCoords && area) {
                    propCoords = await getCoordinates(area, city);
                }
            }

            if (!propCoords) {
                setCalcError('Could not find property location. Please try again later.');
                setCalcLoading(false);
                return;
            }

            const city = property.location ? property.location.split(',').pop().trim().replace(/\.$/, '') : 'Bengaluru';
            const destCoords = await getCoordinates(destToUse, city);

            if (!destCoords) {
                setCalcError('Could not find the destination on the map.');
                setCalcLoading(false);
                return;
            }

            const routeData = await calculateRoute(propCoords, destCoords);
            if (routeData) {
                setCalcResult(routeData);
            } else {
                setCalcError('Could not calculate a driving route.');
            }
        } catch (err) {
            console.error('Location Calculation Error:', err);
            setCalcError('An error occurred while calculating distance.');
        } finally {
            setCalcLoading(false);
        }
    };

    return (
        <div className="detail-section">
            <div className="calculator-header">
                <h3 className="calculator-title">Nearby Destinations</h3>
                <p className="calculator-subtitle">Enter any destination to check driving distance from {getDisplayTitle(property)}</p>
            </div>
            <form onSubmit={handleCalculateDistance} className="distance-calc-form">
                <div className="calc-input-wrapper">
                    <Search size={18} className="calc-search-icon" />
                    <input
                        type="text"
                        placeholder="e.g. Kempegowda Airport, Manyata Tech Park"
                        value={calcDestination}
                        onChange={(e) => setCalcDestination(e.target.value)}
                        className="calc-input"
                    />
                    <button type="submit" className="calc-btn" disabled={calcLoading || !calcDestination.trim()}>
                        {calcLoading ? 'Calculating...' : 'Calculate'}
                    </button>
                </div>
            </form>

            {calcError && <div className="calc-error-msg">{calcError}</div>}

            {calcResult && (
                <div className="calc-result-box">
                    <div className="calc-result-item">
                        <Route size={20} className="result-icon-accent" />
                        <div className="result-text-group">
                            <span className="result-label">Distance</span>
                            <span className="result-value">{calcResult.distanceKm} km</span>
                        </div>
                    </div>
                    <div className="calc-result-item">
                        <div className="nearby-icon-wrap" style={{ backgroundColor: 'var(--accent-light, #e0e7ff)', color: 'var(--accent, #4f46e5)', width: '36px', height: '36px', padding: '8px' }}><MapPin size={20} /></div>
                        <div className="result-text-group">
                            <span className="result-label">Est. Driving Time</span>
                            <span className="result-value">{calcResult.durationMin} mins</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="nearby-grid" style={{ marginTop: '24px' }}>
                <div className="nearby-item" onClick={() => { 
                    const dest = 'Kempegowda International Airport, Bengaluru';
                    setCalcDestination(dest); 
                    handleCalculateDistance(null, dest);
                }} style={{ cursor: 'pointer' }}>
                    <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                    <div className="nearby-info">
                        <span className="nearby-title">International Airport</span>
                        <span className="nearby-dist">Click to calculate</span>
                    </div>
                </div>
                <div className="nearby-item" onClick={() => { 
                    const dest = 'Manyata Tech Park, Bengaluru';
                    setCalcDestination(dest); 
                    handleCalculateDistance(null, dest);
                }} style={{ cursor: 'pointer' }}>
                    <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                    <div className="nearby-info">
                        <span className="nearby-title">Primary Tech Parks</span>
                        <span className="nearby-dist">Click to calculate</span>
                    </div>
                </div>
                <div className="nearby-item">
                    <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                    <div className="nearby-info">
                        <span className="nearby-title">Hospitals & Schools</span>
                        <span className="nearby-dist">Within 5-10 km</span>
                    </div>
                </div>
                <div className="nearby-item">
                    <div className="nearby-icon-wrap"><MapPin size={18} /></div>
                    <div className="nearby-info">
                        <span className="nearby-title">Malls & Markets</span>
                        <span className="nearby-dist">2-5 km away</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistanceCalculator;

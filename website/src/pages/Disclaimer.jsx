import React, { useEffect } from 'react';
import './Disclaimer.css';

const Disclaimer = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="disclaimer-page fade-in">
            <div className="disclaimer-header hero-gradient">
                <div className="container">
                    <h1>Disclaimer</h1>
                    <p className="subtitle">Prop Astra Global</p>
                </div>
            </div>
            
            <div className="disclaimer-content container">
                <div className="disclaimer-card glass-dark-mode">
                    <section className="disclaimer-section">
                        <h2>General Disclaimer</h2>
                        <p>The information on this platform, including property listings, project details, and pricing, is for general informational purposes only. While we strive for accuracy, we make no warranties about the completeness or reliability of any content. Users should independently verify all information before making any purchasing or investment decisions. This platform does not constitute an offer or recommendation to buy or sell property. We disclaim any liability for loss or damage arising from use of or reliance on this information. All trademarks, logos, and images belong to their respective owners and are used for identification purposes only.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Disclaimer;

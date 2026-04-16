import React, { useEffect } from 'react';
import './TermsConditions.css';

const TermsConditions = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="terms-page fade-in">
            <div className="terms-header hero-gradient">
                <div className="container">
                    <h1>Terms & Conditions</h1>
                    <p className="subtitle">Prop Astra Global</p>
                </div>
            </div>
            
            <div className="terms-content container">
                <div className="terms-card glass-dark-mode">
                    
                    <section className="terms-section">
                        <h2>1. Introduction</h2>
                        <p>Welcome to Prop Astra Global (“Company”, “we”, “our”, “us”).</p>
                        <p>These Terms & Conditions govern your access and use of our website, services, and platforms (collectively referred to as the “Platform”). By accessing or using our Platform, you agree to be legally bound by these Terms.</p>
                    </section>
                    
                    <section className="terms-section">
                        <h2>2. Nature of Services</h2>
                        <p>Prop Astra Global operates as a real estate advisory and investment facilitation platform, offering:</p>
                        <ul>
                            <li>Premium property listings (residential & commercial)</li>
                            <li>Investor advisory and strategic consultation</li>
                            <li>Land acquisition and development opportunities</li>
                            <li>Channel partner services and project marketing</li>
                            <li>Lead generation and property matchmaking</li>
                        </ul>
                        <p>We do not act as the legal owner or developer unless explicitly stated.</p>
                    </section>

                    <section className="terms-section">
                        <h2>3. User Eligibility</h2>
                        <p>By using the Platform, you confirm that:</p>
                        <ul>
                            <li>You are at least 18 years of age</li>
                            <li>You have the legal capacity to enter into binding agreements</li>
                            <li>All information provided is accurate and up to date</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>4. User Responsibilities</h2>
                        <p>You agree to:</p>
                        <ul>
                            <li>Provide truthful and complete information</li>
                            <li>Use the platform only for lawful purposes</li>
                            <li>Conduct independent verification before property transactions</li>
                        </ul>
                        <p>You agree NOT to:</p>
                        <ul>
                            <li>Post false, misleading, or duplicate listings</li>
                            <li>Misrepresent ownership or authority</li>
                            <li>Engage in fraudulent or speculative activities</li>
                            <li>Use bots, scraping tools, or unauthorized automation</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>5. Property Listings & Advisory Disclaimer</h2>
                        <ul>
                            <li>All listings, pricing, and project details are indicative and subject to change</li>
                            <li>Prop Astra Global does not guarantee accuracy, legality, or availability</li>
                        </ul>
                        <p>We strongly recommend:</p>
                        <ul>
                            <li>Legal due diligence</li>
                            <li>Title verification</li>
                            <li>RERA registration checks</li>
                        </ul>
                        <p>We act as an advisory intermediary, not a party to transactions.</p>
                    </section>

                    <section className="terms-section">
                        <h2>6. RERA & Regulatory Compliance</h2>
                        <ul>
                            <li>Properties listed may be governed under the Real Estate (Regulation and Development) Act, 2016 (RERA)</li>
                            <li>Users are advised to verify project registration on respective state RERA websites</li>
                        </ul>
                        <p>Prop Astra Global shall not be held liable for:</p>
                        <ul>
                            <li>Non-compliance by developers</li>
                            <li>Project delays or disputes</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>7. Payments & Commercial Terms</h2>
                        <p>Certain services may be chargeable (consultation, premium listings, marketing services)</p>
                        <p>All payments:</p>
                        <ul>
                            <li>Are non-refundable unless agreed in writing</li>
                            <li>Must be made through approved payment channels</li>
                        </ul>
                        <p>We do not handle property transaction funds unless explicitly stated.</p>
                    </section>

                    <section className="terms-section">
                        <h2>8. Third-Party Associations</h2>
                        <p>We may connect users with:</p>
                        <ul>
                            <li>Builders and developers</li>
                            <li>Channel partners and brokers</li>
                            <li>Financial institutions (loans, advisory)</li>
                        </ul>
                        <p>Prop Astra Global is not responsible for agreements, disputes, or outcomes between users and third parties.</p>
                    </section>

                    <section className="terms-section">
                        <h2>9. Intellectual Property Rights</h2>
                        <p>All content including:</p>
                        <ul>
                            <li>Branding</li>
                            <li>Website design</li>
                            <li>Marketing materials</li>
                            <li>Data and technology</li>
                        </ul>
                        <p>are the exclusive property of Prop Astra Global.</p>
                        <p>Unauthorized use, reproduction, or distribution is strictly prohibited.</p>
                    </section>

                    <section className="terms-section">
                        <h2>10. Limitation of Liability</h2>
                        <p>Prop Astra Global shall not be liable for:</p>
                        <ul>
                            <li>Financial losses arising from transactions</li>
                            <li>Incorrect or outdated property information</li>
                            <li>Developer defaults, project delays, or legal disputes</li>
                            <li>Decisions made based on advisory inputs</li>
                        </ul>
                        <p>Use of the platform is at your sole risk and discretion.</p>
                    </section>

                    <section className="terms-section">
                        <h2>11. Communication Consent</h2>
                        <p>By using our Platform, you consent to receive:</p>
                        <ul>
                            <li>Calls, SMS, WhatsApp messages</li>
                            <li>Email communications</li>
                            <li>Marketing and promotional updates</li>
                        </ul>
                        <p>You may opt-out at any time.</p>
                    </section>

                    <section className="terms-section">
                        <h2>12. Termination of Access</h2>
                        <p>We reserve the right to:</p>
                        <ul>
                            <li>Suspend or terminate user accounts</li>
                            <li>Restrict access without prior notice</li>
                            <li>Take legal action in case of misuse</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>13. Amendments</h2>
                        <p>These Terms may be updated periodically. Continued usage implies acceptance of revised Terms.</p>
                    </section>

                    <section className="terms-section">
                        <h2>14. Governing Law & Jurisdiction</h2>
                        <p>These Terms shall be governed by the laws of India.</p>
                        <p><strong>Jurisdiction:</strong> Bangalore, Karnataka</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;

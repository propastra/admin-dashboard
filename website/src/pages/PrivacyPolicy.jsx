import React, { useEffect } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="privacy-page fade-in">
            <div className="privacy-header hero-gradient">
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p className="subtitle">Prop Astra Global</p>
                </div>
            </div>
            
            <div className="privacy-content container">
                <div className="policy-card glass-dark-mode">
                    
                    <section className="policy-section">
                        <h2>1. Introduction</h2>
                        <p>This Privacy Policy (“Policy”) describes how Prop Astra Global (“Company”, “we”, “our”, “us”) collects, uses, stores, processes, and protects your personal information when you access our website, mobile platforms, or services (“Platform”).</p>
                        <p>By using our Platform, you consent to the collection and use of your information in accordance with this Policy. This Policy forms an integral part of our Terms & Conditions.</p>
                    </section>
                    
                    <section className="policy-section">
                        <h2>2. Information We Collect</h2>
                        <p>We collect information in the following ways:</p>
                        
                        <h3>A. Information Provided by You</h3>
                        <p>When you interact with our Platform, you may provide:</p>
                        <ul>
                            <li>Full name</li>
                            <li>Contact details (phone number, email address)</li>
                            <li>Location and address</li>
                            <li>Property preferences and investment interests</li>
                            <li>Financial preferences (budget, investment size)</li>
                            <li>Any information shared via forms, calls, WhatsApp, or consultations</li>
                        </ul>
                        <p>This aligns with industry practices where platforms collect user-provided data during registration and service usage.</p>
                        
                        <h3>B. Information Collected Automatically</h3>
                        <p>When you use our Platform, we may automatically collect:</p>
                        <ul>
                            <li>IP address</li>
                            <li>Device type and browser information</li>
                            <li>Operating system</li>
                            <li>Pages visited and interaction behavior</li>
                            <li>Location data</li>
                        </ul>
                        <p>We may use cookies, tracking pixels, and analytics tools to enhance user experience and improve services.</p>

                        <h3>C. Information from Third Parties</h3>
                        <p>We may receive your information from:</p>
                        <ul>
                            <li>Channel partners, brokers, or developers</li>
                            <li>Marketing campaigns or lead generation platforms</li>
                            <li>Social media integrations (if you sign in via third-party accounts)</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>3. Purpose of Data Collection</h2>
                        <p>Your information is used to:</p>
                        <ul>
                            <li>Provide personalized property recommendations</li>
                            <li>Offer investment advisory and consultation</li>
                            <li>Connect you with developers, agents, and partners</li>
                            <li>Improve platform functionality and user experience</li>
                            <li>Conduct analytics and performance tracking</li>
                            <li>Send updates, offers, and promotional communication</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>4. Sharing of Information</h2>
                        <p>We may share your data with:</p>
                        <ul>
                            <li>Real estate developers and builders</li>
                            <li>Channel partners and brokers</li>
                            <li>Financial institutions (loan or advisory support)</li>
                            <li>Marketing and analytics service providers</li>
                        </ul>
                        <p>We may also share information:</p>
                        <ul>
                            <li>To comply with legal obligations</li>
                            <li>To protect rights, safety, or prevent fraud</li>
                            <li>Within our internal teams and affiliated entities</li>
                        </ul>
                        <p>Such sharing is aligned with common industry practices for service delivery and business operations.</p>
                    </section>

                    <section className="policy-section">
                        <h2>5. Cookies & Tracking Technologies</h2>
                        <p>We use cookies and similar technologies to:</p>
                        <ul>
                            <li>Enhance user experience</li>
                            <li>Understand user behavior</li>
                            <li>Deliver personalized advertisements</li>
                            <li>Analyze website traffic</li>
                        </ul>
                        <p>Users can disable cookies through browser settings; however, some features may not function properly.</p>
                    </section>

                    <section className="policy-section">
                        <h2>6. Data Security</h2>
                        <p>We implement reasonable security measures including:</p>
                        <ul>
                            <li>Secure servers and firewalls</li>
                            <li>Encryption protocols</li>
                            <li>Restricted access to sensitive data</li>
                        </ul>
                        <p>However, no system is completely secure, and we cannot guarantee absolute protection of information transmitted over the internet.</p>
                    </section>

                    <section className="policy-section">
                        <h2>7. Data Retention</h2>
                        <p>We retain your personal data:</p>
                        <ul>
                            <li>As long as necessary for service delivery</li>
                            <li>To comply with legal and regulatory obligations</li>
                            <li>For internal analytics and business purposes</li>
                        </ul>
                        <p>Even after deletion requests, residual data may remain in backup systems for a limited period.</p>
                    </section>

                    <section className="policy-section">
                        <h2>8. User Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Request correction or updates</li>
                            <li>Request deletion (subject to legal and business obligations)</li>
                        </ul>
                        <p>We may require identity verification before processing such requests.</p>
                    </section>

                    <section className="policy-section">
                        <h2>9. Communication & Consent</h2>
                        <p>By using our Platform, you consent to receive:</p>
                        <ul>
                            <li>Calls, SMS, and WhatsApp messages</li>
                            <li>Email notifications</li>
                            <li>Marketing and promotional content</li>
                        </ul>
                        <p>You may opt out of promotional communication at any time.</p>
                    </section>

                    <section className="policy-section">
                        <h2>10. Third-Party Links</h2>
                        <p>Our Platform may contain links to third-party websites.</p>
                        <p>We are not responsible for the privacy practices or content of such external platforms.</p>
                    </section>

                    <section className="policy-section">
                        <h2>11. Updates to this Policy</h2>
                        <p>We may update this Privacy Policy periodically to reflect:</p>
                        <ul>
                            <li>Changes in legal requirements</li>
                            <li>Technology updates</li>
                            <li>Business operations</li>
                        </ul>
                        <p>Updates will be posted on this page, and continued use of the Platform constitutes acceptance.</p>
                    </section>

                    <section className="policy-section">
                        <h2>12. Grievance Redressal</h2>
                        <p>For any concerns regarding this Privacy Policy:</p>
                        <div className="contact-details">
                            <p><strong>Company:</strong> Prop Astra Global</p>
                            <p><strong>Email:</strong> <a href="mailto:info@propastraglobal.com">info@propastraglobal.com</a></p>
                            <p><strong>Location:</strong> Bangalore, Karnataka, India</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

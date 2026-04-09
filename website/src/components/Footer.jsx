import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-col brand-col">
                        <div className="footer-logo">
                            <h2 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 800 }}>Propastra<span style={{color: 'var(--accent)'}}>.</span></h2>
                        </div>
                        <p className="footer-description">
                            Propastra is India's premium real estate platform, helping you discover your dream home with confidence and transparency.
                        </p>
                        <div className="social-links">
                            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h3>Quick Links</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/search">Properties</Link></li>
                            <li><Link to="/map">Map View</Link></li>
                            <li><Link to="/profile">My Profile</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="footer-col">
                        <h3>Legal</h3>
                        <ul className="footer-links">
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                            <li><a href="#">Disclaimer</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-col contact-col">
                        <h3>Contact Us</h3>
                        <ul className="contact-info">
                            <li>
                                <Phone size={18} className="contact-icon" />
                                <span>+91 81470 69579</span>
                            </li>
                            <li>
                                <Mail size={18} className="contact-icon" />
                                <span>support@propastra.com</span>
                            </li>
                            <li>
                                <MapPin size={18} className="contact-icon" />
                                <span>Bangalore, Karnataka, India</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Propastra. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default React.memo(Footer);

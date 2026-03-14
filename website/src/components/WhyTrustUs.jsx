import React from 'react';
import { ShieldCheck, UserCheck, Tags, Zap } from 'lucide-react';
import './WhyTrustUs.css';

const WhyTrustUs = () => {
    const features = [
        {
            icon: <ShieldCheck size={32} />,
            title: "Authentic Property Listings",
            description: "Every property listed on Prop Astra is carefully verified for legal approvals, RERA status, and accurate project details to ensure buyers get only genuine and reliable listings.",
            color: "#3b82f6", // Blue
            bgColor: "#eff6ff"
        },
        {
            icon: <UserCheck size={32} />,
            title: "Expert Real Estate Guidance",
            description: "Our experienced property advisors provide personalized guidance, helping you choose the right property based on your budget, location, and lifestyle needs.",
            color: "#10b981", // Green
            bgColor: "#ecfdf5"
        },
        {
            icon: <Tags size={32} />,
            title: "Clear & Honest Pricing",
            description: "At Prop Astra, we maintain complete transparency in pricing. Buyers receive clear cost breakdowns, builder offers, and the best available deals with no hidden charges.",
            color: "#8b5cf6", // Purple
            bgColor: "#f5f3ff"
        },
        {
            icon: <Zap size={32} />,
            title: "Seamless Home Buying",
            description: "From property discovery and site visits to documentation and final booking, Prop Astra makes the entire home buying journey smooth, simple, and stress-free.",
            color: "#f59e0b", // Orange
            bgColor: "#fff7ed"
        }
    ];

    return (
        <section className="why-trust-us">
            <h2 className="why-trust-title">Why Choose <span className="highlight-text">Prop Astra</span></h2>
            <div className="trust-features-grid">
                {features.map((feature, index) => (
                    <div key={index} className="trust-feature-card">
                        <div
                            className="trust-icon-box"
                            style={{ backgroundColor: feature.bgColor, color: feature.color }}
                        >
                            {feature.icon}
                        </div>
                        <h3 className="trust-feature-title">{feature.title}</h3>
                        <p className="trust-feature-description">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default React.memo(WhyTrustUs);

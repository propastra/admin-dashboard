import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { getFavorites, getProperties } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import './Favorites.css';

const Favorites = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadFavorites();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadFavorites = async () => {
        try {
            const [favsRes, propsRes] = await Promise.all([
                getFavorites(),
                getProperties({ limit: 1000 })
            ]);

            const rawFavs = favsRes.data || [];
            const rawProps = propsRes.data?.properties || [];

            // Build a set of project names that have at least one active configuration
            const activeProjects = new Set();
            rawProps.forEach(p => {
                if (p.status !== 'Sold') {
                    const projNameRaw = p.projectName || p.propertyName.split(' - ')[0].trim();
                    const projName = projNameRaw.split('  ')[0].trim().toLowerCase();
                    activeProjects.add(projName);
                }
            });

            // Map favorite items to reflect aggregated project status
            const mappedFavs = rawFavs.map(fav => {
                if (fav.Property) {
                    const projNameRaw = fav.Property.projectName || fav.Property.propertyName.split(' - ')[0].trim();
                    const projName = projNameRaw.split('  ')[0].trim().toLowerCase();

                    // If the overall project has active configurations, it is not Sold Out
                    if (activeProjects.has(projName)) {
                        return {
                            ...fav,
                            Property: {
                                ...fav.Property,
                                status: 'Available'
                            }
                        };
                    }
                }
                return fav;
            });

            setFavorites(mappedFavs);
        } catch (err) {
            console.error('Failed to load favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteToggle = (propertyId) => {
        setFavorites(favorites.filter(f => f.Property?.id !== propertyId));
    };

    if (!user) {
        return (
            <div className="favorites-page">
                <div className="favorites-empty">
                    <Heart size={64} color="var(--gray-300)" />
                    <h2>Save your favorite properties</h2>
                    <p>Sign in to save and view your favorite properties</p>
                    <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                        Sign In
                    </button>
                </div>
                <div style={{ height: '80px' }} />
            </div>
        );
    }

    return (
        <div className="favorites-page">
            <div className="favorites-header">
                <button className="search-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1>My Shortlisted Properties</h1>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner"></div></div>
            ) : favorites.length > 0 ? (
                <div className="favorites-grid">
                    {favorites.map((fav) => (
                        fav.Property && (
                            <PropertyCard
                                key={fav.id}
                                property={fav.Property}
                                isFavorited={true}
                                onFavoriteToggle={handleFavoriteToggle}
                            />
                        )
                    ))}
                </div>
            ) : (
                <div className="favorites-empty">
                    <Heart size={64} color="var(--gray-300)" />
                    <h2>No shortlisted properties yet</h2>
                    <p>Start exploring and save properties you love</p>
                    <button className="btn btn-primary" onClick={() => navigate('/search')}>
                        Explore Properties
                    </button>
                </div>
            )}

            <div style={{ height: '80px' }} />
        </div>
    );
};

export default Favorites;

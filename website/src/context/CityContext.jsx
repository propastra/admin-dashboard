import React, { createContext, useContext, useState, useEffect } from 'react';

const CityContext = createContext(null);

export const CityProvider = ({ children }) => {
    const [selectedCity, setSelectedCity] = useState(
        localStorage.getItem('selectedCity') || ''
    );

    useEffect(() => {
        if (selectedCity) {
            localStorage.setItem('selectedCity', selectedCity);
        }
    }, [selectedCity]);

    return (
        <CityContext.Provider value={{ selectedCity, setSelectedCity }}>
            {children}
        </CityContext.Provider>
    );
};

export const useCity = () => {
    const context = useContext(CityContext);
    if (!context) throw new Error('useCity must be used within CityProvider');
    return context;
};

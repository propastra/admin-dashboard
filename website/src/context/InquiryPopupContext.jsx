import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const InquiryPopupContext = createContext(null);

const FIRST_VISIT_KEY = 'inquiry_first_visit_shown';

export const InquiryPopupProvider = ({ children }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [contextMessage, setContextMessage] = useState(''); // e.g. "About: Property Name"
    const [propertyId, setPropertyId] = useState(null);
    const pendingActionRef = useRef(null);

    const openPopup = useCallback((options = {}) => {
        const { afterSubmit, message = '', propertyId: pid = null } = options;
        pendingActionRef.current = afterSubmit || null;
        setPropertyId(pid || null);
        setContextMessage(message);
        setShowPopup(true);
    }, []);

    const closePopup = useCallback(() => {
        pendingActionRef.current = null;
        setPropertyId(null);
        setContextMessage('');
        setShowPopup(false);
    }, []);

    const runPendingAndClose = useCallback(() => {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        setPropertyId(null);
        setContextMessage('');
        setShowPopup(false);
        if (typeof action === 'function') {
            action();
        }
    }, []);

    const showFirstVisitPopup = useCallback((userOrIndicator) => {
        if (userOrIndicator) return; // Skip if already logged in (or has a pending token)

        // Use localStorage so the popup never re-shows on return visits after submitting
        const shown = localStorage.getItem(FIRST_VISIT_KEY);
        if (!shown) {
            localStorage.setItem(FIRST_VISIT_KEY, '1');
            openPopup({ message: 'Welcome! We\'d love to know you better' });
        }
    }, [openPopup]);

    const ensureIdentified = useCallback((onIdentify, message = 'We\'d love to know you better') => {
        // Checking localStorage is okay as a sync first-pass, 
        // but checking the user state from useAuth (which we'll pass in or access) is better.
        const token = localStorage.getItem('website_token');
        if (token) {
            if (typeof onIdentify === 'function') onIdentify();
            return true;
        }

        // Otherwise open the popup and queue the action
        openPopup({
            message,
            afterSubmit: onIdentify
        });
        return false;
    }, [openPopup]);

    return (
        <InquiryPopupContext.Provider
            value={{
                showPopup,
                setShowPopup,
                openPopup,
                closePopup,
                runPendingAndClose,
                contextMessage,
                propertyId,
                showFirstVisitPopup,
                ensureIdentified,
            }}
        >
            {children}
        </InquiryPopupContext.Provider>
    );
};

export const useInquiryPopup = () => {
    const ctx = useContext(InquiryPopupContext);
    if (!ctx) throw new Error('useInquiryPopup must be used within InquiryPopupProvider');
    return ctx;
};

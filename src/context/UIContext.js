import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');

    const showLoader = (text = '') => {
        setLoadingText(text);
        setIsLoading(true);
    };

    const hideLoader = () => {
        setIsLoading(false);
        setLoadingText('');
    };

    return (
        <UIContext.Provider value={{ isLoading, loadingText, showLoader, hideLoader }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

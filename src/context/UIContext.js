import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [appInitializing, setAppInitializing] = useState(true); // New state

    const showLoader = (text = '') => {
        // Don't show UIContext loader during app initialization
        if (appInitializing) return;

        setLoadingText(text);
        setIsLoading(true);
    };

    const hideLoader = () => {
        setIsLoading(false);
        setLoadingText('');
    };

    const setAppInitialized = () => {
        setAppInitializing(false);
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    return (
        <UIContext.Provider value={{
            isLoading,
            loadingText,
            showLoader,
            hideLoader,
            isSidebarCollapsed,
            toggleSidebar,
            setAppInitialized
        }}>
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

import React, { useContext, useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import WebSidebar from '../components/WebSidebar';
import AiAssistantBot from '../components/AiAssistantBot';
import { ThemeContext } from '../context/ThemeContext';
import { useRoute } from '@react-navigation/native';
import { useUI } from '../context/UIContext';

const AdminLayout = ({ children, activeRoute: propActiveRoute }) => {
    // Inject global CSS to hide scrollbars on web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `
                * {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                *::-webkit-scrollbar {
                    display: none;
                }
            `;
            document.head.appendChild(style);
            return () => {
                document.head.removeChild(style);
            };
        }
    }, []);

    const { theme, isDarkMode } = useContext(ThemeContext);
    const route = useRoute();
    const activeRoute = propActiveRoute || route.name;
    const { width } = useWindowDimensions();
    const { isSidebarCollapsed, toggleSidebar } = useUI();

    // Responsive breakpoints
    const isDesktop = Platform.OS === 'web' && width >= 1280;
    const isLargeDesktop = Platform.OS === 'web' && width >= 1920;

    // If not desktop, return mobile layout without sidebar
    if (!isDesktop) {
        return (
            <View style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
                {children}
                <AiAssistantBot />
            </View>
        );
    }

    // Desktop background color based on theme
    const desktopBg = isDarkMode ? '#0F1117' : '#F3F4F6';

    return (
        <View style={[styles.container, { backgroundColor: desktopBg }]}>
            {/* Desktop Sidebar with smooth transitions */}
            <WebSidebar
                activeRoute={activeRoute}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
            />

            {/* Desktop Content Area with responsive padding */}
            <View style={[
                styles.content,
                {
                    paddingLeft: isLargeDesktop ? 20 : 16,
                    paddingRight: isLargeDesktop ? 20 : 16,
                    paddingTop: 16,
                }
            ]}>
                {children}
            </View>

            {/* AI Assistant Bot */}
            <AiAssistantBot />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        height: Platform.OS === 'web' ? '100vh' : '100%',
        width: '100%',
        overflow: 'hidden',
    },
    mobileContainer: {
        flex: 1,
        width: '100%',
    },
    content: {
        flex: 1,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        // Smooth transitions when sidebar collapses/expands
        ...(Platform.OS === 'web' && {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }),
    }
});

export default AdminLayout;

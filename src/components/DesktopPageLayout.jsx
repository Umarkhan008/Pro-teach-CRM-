import React, { useContext } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

/**
 * DesktopPageLayout - A proper desktop page layout component
 * Provides consistent structure for all desktop screens with header, toolbar, and content areas
 */
const DesktopPageLayout = ({
    title,
    subtitle,
    toolbar,
    stats,
    children,
    sidebar,
    sidebarWidth = 320,
}) => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { width } = useWindowDimensions();
    const showSidebar = width >= 1440 && sidebar;

    return (
        <View style={styles.container}>
            {/* Page Header */}
            <View style={[styles.pageHeader, { borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
                    )}
                </View>
                {toolbar && <View style={styles.headerRight}>{toolbar}</View>}
            </View>

            {/* Stats Row */}
            {stats && (
                <View style={styles.statsRow}>
                    {stats}
                </View>
            )}

            {/* Main Content Area */}
            <View style={styles.contentWrapper}>
                <View style={[styles.mainContent, showSidebar && { marginRight: 24 }]}>
                    {children}
                </View>

                {showSidebar && (
                    <View style={[styles.sidebarContent, { width: sidebarWidth }]}>
                        {sidebar}
                    </View>
                )}
            </View>
        </View>
    );
};

/**
 * StatCard - Desktop-optimized stat card for KPIs
 */
export const DesktopStatCard = ({ label, value, icon, iconColor, trend, trendUp, onClick }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);

    return (
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: `${iconColor}15` }]}>
                    {icon}
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trendUp ? '#10B98115' : '#EF444415' }]}>
                        <Text style={[styles.trendText, { color: trendUp ? '#10B981' : '#EF4444' }]}>
                            {trend}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
};

/**
 * ActionButton - Desktop action button with consistent styling
 */
export const DesktopActionButton = ({ icon, label, variant = 'primary', onPress, disabled }) => {
    const { theme } = useContext(ThemeContext);

    const getButtonStyles = () => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: theme.primary, borderColor: theme.primary };
            case 'secondary':
                return { backgroundColor: 'transparent', borderColor: theme.border };
            case 'danger':
                return { backgroundColor: '#EF4444', borderColor: '#EF4444' };
            default:
                return { backgroundColor: theme.primary, borderColor: theme.primary };
        }
    };

    const getTextColor = () => {
        return variant === 'secondary' ? theme.text : '#FFFFFF';
    };

    return (
        <View style={[styles.actionButton, getButtonStyles(), disabled && styles.buttonDisabled]}>
            {icon}
            <Text style={[styles.actionButtonText, { color: getTextColor() }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
    },
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 20,
        marginBottom: 24,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 15,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
    },
    mainContent: {
        flex: 1,
    },
    sidebarContent: {
        flexShrink: 0,
    },
    // Stat Card
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }),
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -1,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
    },
    // Action Button
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        }),
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default DesktopPageLayout;

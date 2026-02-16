/**
 * Pro Teach - Refined Design System
 * Polished version with improved consistency, spacing, and visual harmony
 * Preserves the original coral red identity while enhancing professionalism
 */

export const COLORS = {
    // Primary Brand Colors - Refined Coral Red
    primary: '#FF6B6B',           // Main coral red (slightly softer)
    primaryLight: '#FF8F8F',      // Lighter tint for hover states
    primaryDark: '#E64545',       // Darker shade for active states
    primaryAlpha: 'rgba(255, 107, 107, 0.1)', // Subtle backgrounds

    // Secondary & Accent
    secondary: '#C77DD1',         // Refined purple (slightly less saturated)
    secondaryLight: '#DFA8E8',    // Lighter variant
    accent: '#27AE60',            // Professional green

    // Semantic Colors - Refined for better contrast
    success: '#27AE60',           // Green for positive actions
    warning: '#F2994A',           // Orange for warnings
    error: '#EB5757',             // Red for errors
    info: '#5865F2',              // Blue for informational

    // Neutral Palette - Improved hierarchy
    white: '#FFFFFF',
    black: '#0D0D0D',             // Softer than pure black

    // Backgrounds - Subtle and clean
    background: '#FAFAFA',        // Very light gray
    surface: '#FFFFFF',           // White for cards
    surfaceHover: '#F8F8F8',      // Subtle hover state

    // Text Hierarchy - Better readability
    text: '#2D3436',              // Dark gray for primary text
    textSecondary: '#636E72',     // Medium gray for secondary text
    textTertiary: '#95A5A6',      // Light gray for tertiary text
    textPlaceholder: '#B2BEC3',   // Very light for placeholders

    // Borders & Dividers
    border: '#E8ECEF',            // Subtle border
    borderLight: '#F0F3F5',       // Very subtle divider
    divider: '#DFE6E9',           // Visible divider

    // Shadows (for shadow color property)
    shadowColor: '#000000',
    shadowLight: '#000000',

    // Professional Dark Mode Palette
    dark: {
        // Backgrounds - Avoid pure black
        background: '#0F1419',     // Very dark blue-gray
        surface: '#1A1F26',        // Card surface
        surfaceLight: '#21272E',   // Elevated surface
        surfaceHover: '#252C34',   // Hover state

        // Text - Improved contrast
        text: '#E8EAED',           // Almost white primary text
        textSecondary: '#9AA5B1',  // Medium gray secondary
        textTertiary: '#6B7684',   // Subtle tertiary
        textPlaceholder: '#4A525D', // Very subtle placeholder

        // Borders & Dividers
        border: '#2D333B',         // Subtle border
        borderLight: '#252C34',    // Very subtle
        divider: '#363D47',        // Visible divider

        // Brand colors - Adjusted for dark backgrounds
        primary: '#FF8585',        // Slightly lighter coral
        primaryAlpha: 'rgba(255, 133, 133, 0.15)',
        secondary: '#D499DD',      // Lighter purple
        accent: '#3FB950',         // Brighter green

        // Semantic colors - Dark mode optimized
        success: '#3FB950',
        warning: '#F09541',
        error: '#F85149',
        info: '#6E7FF1',

        // Shadows
        shadowColor: '#000000',
        elevation: 'rgba(0, 0, 0, 0.4)',
    }
};

export const SPACING = {
    // Following 4px base grid system
    xxs: 4,      // Minimal spacing
    xs: 8,       // Extra small
    sm: 12,      // Small
    md: 16,      // Medium (most common)
    lg: 20,      // Large
    xl: 24,      // Extra large
    xxl: 32,     // Section spacing
    xxxl: 48,    // Large section gaps
};

export const SIZES = {
    // Base measurements
    base: 8,
    padding: SPACING.md,

    // Border Radius - Consistent curves
    radiusXs: 4,      // Tiny elements
    radiusSm: 8,      // Small elements, inputs
    radiusMd: 12,     // Cards, buttons
    radiusLg: 16,     // Large cards
    radiusXl: 20,     // Hero elements
    radiusFull: 9999, // Circular/pill shaped

    // Default radius
    radius: 12,

    // Font Sizes - Refined hierarchy
    fontSize: {
        xs: 11,       // Tiny labels
        sm: 13,       // Secondary text
        md: 15,       // Body text (improved readability)
        lg: 17,       // Emphasized body
        xl: 20,       // Section titles
        xxl: 24,      // Screen titles
        xxxl: 32,     // Hero text
    },

    // Legacy font sizes (for compatibility)
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 17,
    body1: 15,
    body2: 14,
    body3: 13,
    body4: 12,
    small: 11,

    // Icon Sizes
    iconXs: 16,
    iconSm: 20,
    iconMd: 24,
    iconLg: 32,
    iconXl: 48,
};

export const TYPOGRAPHY = {
    // Font weights
    weight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Line heights - Improved readability
    lineHeight: {
        tight: 1.2,    // Headers
        normal: 1.5,   // Body text
        relaxed: 1.75, // Large text blocks
    },

    // Predefined text styles
    h1: {
        fontSize: SIZES.fontSize.xxxl,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: SIZES.fontSize.xxl,
        fontWeight: '700',
        lineHeight: 32,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: SIZES.fontSize.xl,
        fontWeight: '600',
        lineHeight: 28,
    },
    h4: {
        fontSize: SIZES.fontSize.lg,
        fontWeight: '600',
        lineHeight: 24,
    },
    body: {
        fontSize: SIZES.fontSize.md,
        fontWeight: '400',
        lineHeight: 22,
    },
    bodyBold: {
        fontSize: SIZES.fontSize.md,
        fontWeight: '600',
        lineHeight: 22,
    },
    caption: {
        fontSize: SIZES.fontSize.sm,
        fontWeight: '400',
        lineHeight: 18,
    },
    captionBold: {
        fontSize: SIZES.fontSize.sm,
        fontWeight: '600',
        lineHeight: 18,
    },
    small: {
        fontSize: SIZES.fontSize.xs,
        fontWeight: '400',
        lineHeight: 16,
    },
};

export const SHADOWS = {
    // Consistent shadow system
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    xs: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sm: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
};

// Dark mode shadows (lighter for visibility)
export const SHADOWS_DARK = {
    none: SHADOWS.none,
    xs: {
        ...SHADOWS.xs,
        shadowOpacity: 0.3,
    },
    sm: {
        ...SHADOWS.sm,
        shadowOpacity: 0.35,
    },
    md: {
        ...SHADOWS.md,
        shadowOpacity: 0.4,
    },
    lg: {
        ...SHADOWS.lg,
        shadowOpacity: 0.45,
    },
    xl: {
        ...SHADOWS.xl,
        shadowOpacity: 0.5,
    },
};

export const ANIMATION = {
    // Animation durations
    duration: {
        fastest: 150,
        fast: 200,
        normal: 300,
        slow: 400,
        slowest: 500,
    },

    // Easing functions (for reference)
    easing: {
        // Use with Animated.timing easing property
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
};

// Legacy FONTS export for compatibility
export const FONTS = {
    h1: { ...TYPOGRAPHY.h1, fontFamily: 'System' },
    h2: { ...TYPOGRAPHY.h2, fontFamily: 'System' },
    h3: { ...TYPOGRAPHY.h3, fontFamily: 'System' },
    h4: { ...TYPOGRAPHY.h4, fontFamily: 'System' },
    body1: { ...TYPOGRAPHY.body, fontFamily: 'System' },
    body2: { ...TYPOGRAPHY.caption, fontFamily: 'System' },
    body3: { ...TYPOGRAPHY.caption, fontFamily: 'System' },
    body4: { ...TYPOGRAPHY.small, fontFamily: 'System' },
    small: { ...TYPOGRAPHY.small, fontFamily: 'System' },
};

// Helper function to get theme-aware shadows
export const getShadow = (size, isDark = false) => {
    return isDark ? SHADOWS_DARK[size] : SHADOWS[size];
};

// Helper function to get theme-aware colors
export const getThemeColors = (isDark = false) => {
    if (isDark) {
        return { ...COLORS, ...COLORS.dark };
    }
    return COLORS;
};

const appTheme = {
    COLORS,
    SIZES,
    SPACING,
    TYPOGRAPHY,
    SHADOWS,
    SHADOWS_DARK,
    ANIMATION,
    FONTS, // Legacy support
    getShadow,
    getThemeColors,
};

export default appTheme;

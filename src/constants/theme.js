export const COLORS = {
    primary: '#4F46E5', // Indigo 600
    primaryLight: '#818CF8', // Indigo 400
    primaryDark: '#3730A3', // Indigo 800
    white: '#FFFFFF',
    black: '#000000',

    secondary: '#10B981', // Emerald 500
    secondaryLight: '#34D399', // Emerald 400

    accent: '#F59E0B', // Amber 500
    danger: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    success: '#10B981', // Emerald 500
    info: '#3B82F6', // Blue 500

    background: '#F9FAFB', // Gray 50
    surface: '#FFFFFF',

    text: '#1F2937', // Gray 800
    textSecondary: '#6B7280', // Gray 500
    textLight: '#9CA3AF', // Gray 400

    border: '#E5E7EB', // Gray 200

    // Dark mode colors
    dark: {
        background: '#111827', // Gray 900
        surface: '#1F2937', // Gray 800
        text: '#F9FAFB', // Gray 50
        textSecondary: '#D1D5DB', // Gray 300
        border: '#374151', // Gray 700
    }
};

export const SIZES = {
    // Global sizes
    base: 8,
    font: 14,
    radius: 12,
    padding: 24,

    // Font sizes
    h1: 30,
    h2: 22,
    h3: 16,
    h4: 14,
    body1: 30,
    body2: 22,
    body3: 16,
    body4: 14,
    small: 12,

    // App dimensions
    width: null, // Set at runtime
    height: null // Set at runtime
};

export const FONTS = {
    h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
    h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
    h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 22, fontWeight: 'bold' },
    h4: { fontFamily: 'System', fontSize: SIZES.h4, lineHeight: 22, fontWeight: 'bold' },
    body1: { fontFamily: 'System', fontSize: SIZES.body1, lineHeight: 36 },
    body2: { fontFamily: 'System', fontSize: SIZES.body2, lineHeight: 30 },
    body3: { fontFamily: 'System', fontSize: SIZES.body3, lineHeight: 22 },
    body4: { fontFamily: 'System', fontSize: SIZES.body4, lineHeight: 22 },
    small: { fontFamily: 'System', fontSize: SIZES.small, lineHeight: 18 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;

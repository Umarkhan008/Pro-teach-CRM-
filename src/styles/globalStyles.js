import { StyleSheet, Platform } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SIZES.padding * 0.75,
        marginBottom: SIZES.base * 2,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    title: {
        ...FONTS.h2,
        color: COLORS.text,
        marginBottom: SIZES.base,
    },
    subtitle: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
    },
    input: {
        height: 50,
        backgroundColor: COLORS.background, // Or surface depending on section
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        marginBottom: SIZES.base * 2,
        color: COLORS.text,
        ...FONTS.body3,
    },
    button: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonText: {
        ...FONTS.h3,
        color: COLORS.surface,
    },
    screenPadding: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.padding * 2,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    }
});

export default globalStyles;

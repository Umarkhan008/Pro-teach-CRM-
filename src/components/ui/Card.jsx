/**
 * Standardized Card Component
 * Consistent card styling across the application
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SIZES, getShadow, getThemeColors } from '../../constants/theme';

export const Card = ({
    children,
    onPress,
    variant = 'elevated',  // elevated, flat, outlined
    padding = 'medium',     // none, small, medium, large
    isDarkMode = false,
    style,
}) => {
    const colors = getThemeColors(isDarkMode);
    const shadow = getShadow('md', isDarkMode);

    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: colors.surface,
                    ...shadow,
                };
            case 'flat':
                return {
                    backgroundColor: colors.surface,
                };
            case 'outlined':
                return {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            default:
                return {
                    backgroundColor: colors.surface,
                    ...shadow,
                };
        }
    };

    const getPaddingStyles = () => {
        switch (padding) {
            case 'none':
                return {};
            case 'small':
                return { padding: SPACING.sm };
            case 'large':
                return { padding: SPACING.xl };
            default: // medium
                return { padding: SPACING.md };
        }
    };

    const cardStyles = [
        styles.base,
        getVariantStyles(),
        getPaddingStyles(),
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={cardStyles}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    base: {
        borderRadius: SIZES.radiusMd,
        overflow: 'hidden',
    },
});

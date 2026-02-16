/**
 * Standardized Button Component
 * Consistent styling across the application
 */
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS, SPACING, SIZES, TYPOGRAPHY, getShadow, getThemeColors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const Button = ({
    title,
    onPress,
    variant = 'primary',  // primary, secondary, outline, ghost, danger
    size = 'medium',       // small, medium, large
    icon = null,           // Ionicons name
    iconPosition = 'left', // left, right
    loading = false,
    disabled = false,
    fullWidth = false,
    isDarkMode = false,
    style,
    textStyle,
}) => {
    const colors = getThemeColors(isDarkMode);
    const shadow = getShadow('sm', isDarkMode);

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    container: {
                        backgroundColor: colors.primary,
                        ...shadow,
                    },
                    text: { color: colors.white },
                };
            case 'secondary':
                return {
                    container: {
                        backgroundColor: colors.secondary,
                        ...shadow,
                    },
                    text: { color: colors.white },
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                    },
                    text: { color: colors.primary },
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: { color: colors.primary },
                };
            case 'danger':
                return {
                    container: {
                        backgroundColor: colors.error,
                        ...shadow,
                    },
                    text: { color: colors.white },
                };
            default:
                return {
                    container: { backgroundColor: colors.primary },
                    text: { color: colors.white },
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: {
                        paddingVertical: SPACING.xs,
                        paddingHorizontal: SPACING.md,
                    },
                    text: { fontSize: SIZES.fontSize.sm },
                    icon: SIZES.iconXs,
                };
            case 'large':
                return {
                    container: {
                        paddingVertical: SPACING.lg,
                        paddingHorizontal: SPACING.xxl,
                    },
                    text: { fontSize: SIZES.fontSize.lg },
                    icon: SIZES.iconMd,
                };
            default: // medium
                return {
                    container: {
                        paddingVertical: SPACING.md,
                        paddingHorizontal: SPACING.xl,
                    },
                    text: { fontSize: SIZES.fontSize.md },
                    icon: SIZES.iconSm,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.base,
                variantStyles.container,
                sizeStyles.container,
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={variantStyles.text.color} />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={sizeStyles.icon}
                            color={variantStyles.text.color}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            variantStyles.text,
                            sizeStyles.text,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={sizeStyles.icon}
                            color={variantStyles.text.color}
                            style={styles.iconRight}
                        />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        ...TYPOGRAPHY.bodyBold,
    },
    iconLeft: {
        marginRight: SPACING.xs,
    },
    iconRight: {
        marginLeft: SPACING.xs,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
});

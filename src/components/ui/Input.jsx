/**
 * Standardized Input Component
 * Consistent input field styling across the application
 */
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SIZES, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    secureTextEntry = false,
    multiline = false,
    numberOfLines = 1,
    editable = true,
    isDarkMode = false,
    style,
    inputStyle,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const colors = getThemeColors(isDarkMode);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={[styles.label, { color: colors.text }]}>
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error
                            ? colors.error
                            : isFocused
                                ? colors.primary
                                : colors.border,
                        borderWidth: isFocused ? 1.5 : 1,
                    },
                    !editable && styles.disabled,
                ]}
            >
                {icon && iconPosition === 'left' && (
                    <Ionicons
                        name={icon}
                        size={SIZES.iconSm}
                        color={colors.textSecondary}
                        style={styles.iconLeft}
                    />
                )}

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textPlaceholder}
                    secureTextEntry={secureTextEntry && !showPassword}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                        },
                        multiline && styles.multiline,
                        inputStyle,
                    ]}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.iconRight}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={SIZES.iconSm}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}

                {icon && iconPosition === 'right' && !secureTextEntry && (
                    <Ionicons
                        name={icon}
                        size={SIZES.iconSm}
                        color={colors.textSecondary}
                        style={styles.iconRight}
                    />
                )}
            </View>

            {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                </Text>
            )}

            {helperText && !error && (
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    {helperText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.captionBold,
        marginBottom: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: SIZES.radiusSm,
        paddingHorizontal: SPACING.md,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.body,
        paddingVertical: SPACING.sm,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: SPACING.sm,
    },
    iconLeft: {
        marginRight: SPACING.xs,
    },
    iconRight: {
        marginLeft: SPACING.xs,
    },
    errorText: {
        ...TYPOGRAPHY.small,
        marginTop: SPACING.xs,
    },
    helperText: {
        ...TYPOGRAPHY.small,
        marginTop: SPACING.xs,
    },
    disabled: {
        opacity: 0.6,
    },
});

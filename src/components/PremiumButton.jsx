import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PremiumButton = ({
    title,
    onPress,
    loading = false,
    type = 'primary', // primary, outline, ghost
    icon,
    style,
    color, // Custom bg color override
    textColor, // Custom text color override
    textStyle,
    disabled = false
}) => {
    // Default colors can be adjusted or passed from theme
    const primaryColor = color || '#1E1E1E'; // Default black/dark
    const onPrimaryColor = textColor || '#FFFFFF';

    // Ghost/Outline props
    const outlineBorderColor = color || '#E5E7EB';
    const outlineTextColor = textColor || '#1F2937';

    const isDisabled = loading || disabled;

    if (type === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                style={[
                    styles.base,
                    styles.outline,
                    { borderColor: outlineBorderColor, opacity: isDisabled ? 0.6 : 1 },
                    style
                ]}
                activeOpacity={0.7}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={outlineTextColor} />
                ) : (
                    <View style={styles.content}>
                        {icon && <Ionicons name={icon} size={18} color={outlineTextColor} style={styles.icon} />}
                        <Text style={[styles.text, { color: outlineTextColor }, textStyle]}>{title}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    if (type === 'ghost') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                style={[
                    styles.base,
                    styles.ghost,
                    { opacity: isDisabled ? 0.6 : 1 },
                    style
                ]}
                activeOpacity={0.7}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={textColor || '#1F2937'} />
                ) : (
                    <View style={styles.content}>
                        {icon && <Ionicons name={icon} size={18} color={textColor || '#1F2937'} style={styles.icon} />}
                        <Text style={[styles.text, { color: textColor || '#1F2937' }, textStyle]}>{title}</Text>
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            style={[
                styles.base,
                { backgroundColor: primaryColor, opacity: isDisabled ? 0.7 : 1 },
                style
            ]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator size="small" color={onPrimaryColor} />
            ) : (
                <View style={styles.content}>
                    {icon && <Ionicons name={icon} size={18} color={onPrimaryColor} style={styles.icon} />}
                    <Text style={[styles.text, { color: onPrimaryColor }, textStyle]}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        height: 50, // Slightly smaller height (was 56)
        borderRadius: 12, // Softer radius
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    outline: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.2, // Tights typographic feel
    },
    icon: {
        marginRight: 0, // Handled by gap
    }
});

export default PremiumButton;

import React, { useContext } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const PremiumInput = ({
    label,
    icon,
    error,
    containerStyle,
    style, // input style override
    ...props
}) => {
    const { theme, isDarkMode } = useContext(ThemeContext);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {label}
                </Text>
            )}
            <View style={[
                styles.inputWrapper,
                {
                    backgroundColor: isDarkMode ? '#2D2D2D' : '#FFFFFF',
                    borderColor: error ? '#EF4444' : (isDarkMode ? '#444' : '#E5E7EB')
                }
            ]}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={theme.textSecondary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[styles.input, { color: theme.text }, style]}
                    placeholderTextColor={theme.textLight}
                    selectionColor={theme.primary}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginLeft: 2,
        letterSpacing: 0.1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52, // Slightly more compact (was 56)
        borderRadius: 12, // Consistent with buttons
        borderWidth: 1, // Cleaner thinner border
        paddingHorizontal: 14,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '400',
        height: '100%',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 2,
        fontWeight: '500',
    }
});

export default PremiumInput;

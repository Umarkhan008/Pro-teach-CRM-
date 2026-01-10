import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';

const Header = ({ title, subtitle, showBack, onBack, rightIcon, onRightPress }) => {
    const { theme } = useContext(ThemeContext);

    return (
        <View style={[styles.container, globalStyles.shadow, { backgroundColor: theme.surface }]}>
            <View style={styles.headerTop}>
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                        {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
                    </View>
                </View>

                {rightIcon && (
                    <TouchableOpacity onPress={onRightPress} style={[styles.rightButton, { backgroundColor: theme.background }]}>
                        <Ionicons name={rightIcon} size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.padding * 0.5,
        paddingBottom: SIZES.padding,
        borderBottomLeftRadius: SIZES.radius * 2,
        borderBottomRightRadius: SIZES.radius * 2,
        marginBottom: SIZES.base * 2,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SIZES.base,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: SIZES.base,
        padding: 4,
    },
    title: {
        ...FONTS.h2,
    },
    subtitle: {
        ...FONTS.body4,
        marginTop: 2,
    },
    rightButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Header;

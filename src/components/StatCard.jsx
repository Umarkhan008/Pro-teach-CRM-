import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
    const { theme } = useContext(ThemeContext);

    return (
        <View style={[globalStyles.card, globalStyles.shadow, styles.container, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
                <Text style={[styles.value, { color: theme.text }]}>{value}</Text>

                {trend && (
                    <View style={styles.trendContainer}>
                        <Ionicons
                            name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
                            size={12}
                            color={trend === 'up' ? COLORS.success : COLORS.danger}
                        />
                        <Text style={[
                            styles.trendText,
                            { color: trend === 'up' ? COLORS.success : COLORS.danger }
                        ]}>
                            {trendValue}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding * 0.75,
        marginBottom: SIZES.base * 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 2,
    },
    content: {
        flex: 1,
    },
    title: {
        ...FONTS.body4,
        marginBottom: 4,
    },
    value: {
        ...FONTS.h2,
        marginBottom: 4,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        ...FONTS.small,
        marginLeft: 4,
        fontWeight: '600',
    }
});

export default StatCard;

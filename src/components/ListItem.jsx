import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';

const ListItem = ({ title, subtitle, image, icon, rightElement, onPress, onLongPress, color }) => {
    const { theme } = useContext(ThemeContext);

    return (
        <TouchableOpacity
            style={[globalStyles.card, globalStyles.shadow, styles.container, { backgroundColor: theme.surface }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={[styles.avatarContainer, { backgroundColor: color ? color + '20' : COLORS.primary + '20' }]}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.avatar} />
                ) : (
                    <Ionicons name={icon || "person"} size={22} color={color || COLORS.primary} />
                )}
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
            </View>

            {rightElement || (
                <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding * 0.5,
        marginBottom: SIZES.base,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 1.5,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        marginRight: SIZES.base,
    },
    title: {
        ...FONTS.body3,
        fontWeight: '600',
        marginBottom: 2,
    },
    subtitle: {
        ...FONTS.body4,
    },
});

export default ListItem;

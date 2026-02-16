import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemeContext } from '../../context/ThemeContext';
import { SchoolContext } from '../../context/SchoolContext';
import { AuthContext } from '../../context/AuthContext';
import { getThemeColors } from '../../constants/theme';

const { width } = Dimensions.get('window');

const LeaderboardScreen = ({ navigation }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const { students, attendance } = useContext(SchoolContext);
    const { userInfo } = useContext(AuthContext);
    const colors = getThemeColors(isDarkMode);

    const [filter, setFilter] = useState('all');

    const isWithinLastDays = (dateStr, days) => {
        if (!dateStr) return false;
        let date;
        if (dateStr.includes('.')) {
            const [d, m, y] = dateStr.split('.');
            date = new Date(`${y}-${m}-${d}`);
        } else {
            date = new Date(dateStr);
        }
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    };

    const calculateScore = (studentId, period) => {
        let total = 0;
        if (!attendance || attendance.length === 0) return 0;

        attendance.forEach(record => {
            if (period === 'week' && !isWithinLastDays(record.date, 7)) return;
            if (period === 'month' && !isWithinLastDays(record.date, 30)) return;

            const studentRecord = record.students && record.students[studentId];
            if (studentRecord) {
                if (studentRecord.status === 'Keldi' || studentRecord.status === 'Present') total += 5;
                if (studentRecord.homework) {
                    const hw = parseInt(studentRecord.homework, 10);
                    if (!isNaN(hw)) total += hw;
                }
            }
        });
        return total;
    };

    const enrichedStudents = useMemo(() => {
        return students.map(s => ({
            ...s,
            weeklyPoints: calculateScore(s.id, 'week'),
            monthlyPoints: calculateScore(s.id, 'month'),
            points: calculateScore(s.id, 'all')
        }));
    }, [students, attendance]);

    const rankedStudents = useMemo(() => {
        let sorted = [...enrichedStudents];
        const key = filter === 'week' ? 'weeklyPoints' : (filter === 'month' ? 'monthlyPoints' : 'points');
        sorted.sort((a, b) => b[key] - a[key]);
        return sorted.map((student, index) => ({
            ...student,
            rank: index + 1,
            displayPoints: student[key]
        }));
    }, [enrichedStudents, filter]);

    const topThree = rankedStudents.slice(0, 3);
    const restList = rankedStudents.slice(3);

    const podiumColors = [
        { start: '#FFD700', end: '#FFA500', text: '#6B4E00' }, // Gold
        { start: '#E8E8E8', end: '#A8A8A8', text: '#4A4A4A' }, // Silver
        { start: '#FFB366', end: '#FF8C42', text: '#663300' }, // Bronze
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5' }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Animated Background Circles */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => navigation?.goBack?.()}
                    >
                        <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#fff' : '#000'} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                            Leaderboard
                        </Text>
                        <LinearGradient
                            colors={['#FF6B6B', '#4ECDC4', '#FFE66D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.headerUnderline}
                        />
                    </View>

                    <TouchableOpacity style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name="filter" size={20} color={isDarkMode ? '#fff' : '#000'} />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <View style={styles.chipsRow}>
                    {[
                        { key: 'week', label: 'Haftalik', gradient: ['#667eea', '#764ba2'] },
                        { key: 'month', label: 'Oylik', gradient: ['#f093fb', '#f5576c'] },
                        { key: 'all', label: 'Umumiy', gradient: ['#4facfe', '#00f2fe'] }
                    ].map(({ key, label, gradient }) => (
                        <TouchableOpacity
                            key={key}
                            style={styles.chip}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setFilter(key);
                            }}
                        >
                            {filter === key ? (
                                <LinearGradient colors={gradient} style={styles.chipGradient}>
                                    <Text style={styles.chipTextActive}>{label}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={[styles.chipInactive, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Text style={[styles.chipTextInactive, { color: isDarkMode ? '#999' : '#666' }]}>{label}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Podium */}
                <View style={styles.podiumContainer}>
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <View style={[styles.podiumColumn, { marginTop: 40 }]}>
                            <View style={styles.avatarWrapper}>
                                <LinearGradient
                                    colors={[podiumColors[1].start, podiumColors[1].end]}
                                    style={styles.avatarGradientRing}
                                >
                                    <View style={[styles.avatarInner, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
                                        <Image
                                            source={{ uri: topThree[1].avatar || `https://ui-avatars.com/api/?name=${topThree[1].name}` }}
                                            style={styles.avatar}
                                        />
                                    </View>
                                </LinearGradient>
                                <View style={[styles.medalBadge, { backgroundColor: podiumColors[1].start }]}>
                                    <Text style={styles.medalText}>2</Text>
                                </View>
                            </View>
                            <Text style={[styles.podiumName, { color: isDarkMode ? '#fff' : '#000' }]} numberOfLines={1}>
                                {topThree[1].name.split(' ')[0]}
                            </Text>
                            <View style={[styles.pointsContainer, { backgroundColor: podiumColors[1].start + '20' }]}>
                                <Text style={[styles.pointsValue, { color: podiumColors[1].text }]}>
                                    {topThree[1].displayPoints}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <View style={styles.podiumColumn}>
                            <View style={styles.crownContainer}>
                                <Text style={styles.crownIcon}>👑</Text>
                            </View>
                            <View style={styles.avatarWrapper}>
                                <LinearGradient
                                    colors={[podiumColors[0].start, podiumColors[0].end]}
                                    style={[styles.avatarGradientRing, styles.avatarGradientRingLarge]}
                                >
                                    <View style={[styles.avatarInner, styles.avatarInnerLarge, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
                                        <Image
                                            source={{ uri: topThree[0].avatar || `https://ui-avatars.com/api/?name=${topThree[0].name}` }}
                                            style={styles.avatarLarge}
                                        />
                                    </View>
                                </LinearGradient>
                                <View style={[styles.medalBadge, styles.medalBadgeLarge, { backgroundColor: podiumColors[0].start }]}>
                                    <Text style={[styles.medalText, { fontSize: 18 }]}>1</Text>
                                </View>
                            </View>
                            <Text style={[styles.podiumName, styles.podiumNameFirst, { color: isDarkMode ? '#fff' : '#000' }]} numberOfLines={1}>
                                {topThree[0].name.split(' ')[0]}
                            </Text>
                            <View style={[styles.pointsContainer, styles.pointsContainerFirst, { backgroundColor: podiumColors[0].start + '20' }]}>
                                <Ionicons name="flash" size={16} color={podiumColors[0].text} />
                                <Text style={[styles.pointsValue, styles.pointsValueFirst, { color: podiumColors[0].text }]}>
                                    {topThree[0].displayPoints}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <View style={[styles.podiumColumn, { marginTop: 60 }]}>
                            <View style={styles.avatarWrapper}>
                                <LinearGradient
                                    colors={[podiumColors[2].start, podiumColors[2].end]}
                                    style={styles.avatarGradientRing}
                                >
                                    <View style={[styles.avatarInner, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
                                        <Image
                                            source={{ uri: topThree[2].avatar || `https://ui-avatars.com/api/?name=${topThree[2].name}` }}
                                            style={styles.avatar}
                                        />
                                    </View>
                                </LinearGradient>
                                <View style={[styles.medalBadge, { backgroundColor: podiumColors[2].start }]}>
                                    <Text style={styles.medalText}>3</Text>
                                </View>
                            </View>
                            <Text style={[styles.podiumName, { color: isDarkMode ? '#fff' : '#000' }]} numberOfLines={1}>
                                {topThree[2].name.split(' ')[0]}
                            </Text>
                            <View style={[styles.pointsContainer, { backgroundColor: podiumColors[2].start + '20' }]}>
                                <Text style={[styles.pointsValue, { color: podiumColors[2].text }]}>
                                    {topThree[2].displayPoints}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* List */}
                <FlatList
                    data={restList}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isMe = item.id === userInfo?.id;
                        return (
                            <View style={[
                                styles.listCard,
                                { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' },
                                isMe && styles.listCardMe
                            ]}>
                                <Text style={[styles.rankNumber, { color: isDarkMode ? '#666' : '#999' }]}>
                                    #{item.rank}
                                </Text>
                                <Image
                                    source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.name}` }}
                                    style={styles.listAvatar}
                                />
                                <View style={styles.listMain}>
                                    <Text style={[styles.listName, { color: isDarkMode ? '#fff' : '#000' }]}>
                                        {item.name}
                                    </Text>
                                    {isMe && (
                                        <LinearGradient
                                            colors={['#FF6B6B', '#FFE66D']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.youBadge}
                                        >
                                            <Text style={styles.youText}>SІIZ</Text>
                                        </LinearGradient>
                                    )}
                                </View>
                                <LinearGradient
                                    colors={['#4facfe', '#00f2fe']}
                                    style={styles.pointsBadge}
                                >
                                    <Ionicons name="star" size={12} color="#fff" />
                                    <Text style={styles.pointsTextBadge}>{item.displayPoints}</Text>
                                </LinearGradient>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>🏆</Text>
                            <Text style={[styles.emptyText, { color: isDarkMode ? '#666' : '#999' }]}>
                                Ma'lumot topilmadi
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#FF6B6B',
        opacity: 0.1,
        top: -150,
        right: -100,
    },
    bgCircle2: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#4ECDC4',
        opacity: 0.1,
        bottom: -100,
        left: -80,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    headerUnderline: {
        width: 40,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    },
    chipsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 10,
    },
    chip: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    chipGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 20,
    },
    chipInactive: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 20,
    },
    chipTextActive: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    chipTextInactive: {
        fontSize: 13,
        fontWeight: '600',
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    podiumColumn: {
        alignItems: 'center',
        marginHorizontal: 8,
        flex: 1,
    },
    crownContainer: {
        marginBottom: -10,
    },
    crownIcon: {
        fontSize: 32,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarGradientRing: {
        width: 76,
        height: 76,
        borderRadius: 38,
        padding: 3,
    },
    avatarGradientRingLarge: {
        width: 96,
        height: 96,
        borderRadius: 48,
        padding: 4,
    },
    avatarInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInnerLarge: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarLarge: {
        width: 82,
        height: 82,
        borderRadius: 41,
    },
    medalBadge: {
        position: 'absolute',
        bottom: -8,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    medalBadgeLarge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        bottom: -10,
        right: -6,
    },
    medalText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
    },
    podiumName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    podiumNameFirst: {
        fontSize: 16,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    pointsContainerFirst: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    pointsValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    pointsValueFirst: {
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    listCardMe: {
        borderWidth: 2,
        borderColor: '#FF6B6B',
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '800',
        width: 36,
    },
    listAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    listMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listName: {
        fontSize: 16,
        fontWeight: '600',
    },
    youBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    youText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 4,
    },
    pointsTextBadge: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LeaderboardScreen;

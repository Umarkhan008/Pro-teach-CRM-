import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import StatCard from '../components/StatCard';
import Chart from '../components/Chart';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
// import { mockData } from '../data/mockData'; // Removed mockData import
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { getDashboardStats, recentActivities, revenueData, schedule } = useContext(SchoolContext);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState([]);

    useEffect(() => {
        setStats(getDashboardStats());
    }, [getDashboardStats]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Simulate data fetching (or refetch from context if needed)
        setStats(getDashboardStats());
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, [getDashboardStats]);

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                <Header
                    title={t.dashboard}
                    subtitle="Welcome back, Administrator"
                    rightIcon="person-add"
                    onRightPress={() => navigation.navigate('Leads', { openAddModal: true })}
                />

                <View style={globalStyles.screenPadding}>
                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        {stats.map((stat) => (
                            <View key={stat.id} style={styles.statWrapper}>
                                <StatCard
                                    title={stat.title}
                                    value={stat.value}
                                    icon={stat.icon}
                                    color={stat.color}
                                    trend={stat.trend}
                                    trendValue={stat.trendValue}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Revenue Chart */}
                    <View style={styles.sectionContainer}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={[globalStyles.title, { color: theme.text }]}>{t.revenueOverview || "Revenue Overview"}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Finance')}>
                                <Text style={[styles.linkText, { color: COLORS.primary }]}>{t.viewAll || "View All"}</Text>
                            </TouchableOpacity>
                        </View>
                        <Chart
                            title={t.revenueLast6Months || "Revenue (Last 6 Months)"}
                            data={revenueData}
                            type="line"
                        />
                    </View>

                    {/* Recent Activity */}
                    <View style={styles.sectionContainer}>
                        <Text style={[globalStyles.title, { color: theme.text }]}>{t.recentActivity || "Recent Activity"}</Text>

                        {recentActivities.map((item) => (
                            <View key={item.id} style={[globalStyles.card, globalStyles.shadow, styles.activityCard, { backgroundColor: theme.surface }]}>
                                <View style={[styles.avatarContainer, { backgroundColor: item.avatar ? 'transparent' : COLORS.primary + '20' }]}>
                                    {item.avatar ? (
                                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                    ) : (
                                        <Ionicons name={item.icon || "person"} size={20} color={COLORS.primary} />
                                    )}
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityTitle, { color: theme.text }]}>
                                        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text> {item.action} <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{item.target}</Text>
                                    </Text>
                                    <Text style={[styles.activityTime, { color: theme.textLight }]}>{item.time}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Upcoming Classes */}
                    <View style={styles.sectionContainer}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={[globalStyles.title, { color: theme.text }]}>{t.upcomingClasses || "Upcoming Classes"}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                                <Text style={[styles.linkText, { color: COLORS.primary }]}>{t.seeAll || "See All"}</Text>
                            </TouchableOpacity>
                        </View>

                        {schedule.slice(0, 3).map((item) => (
                            <View key={item.id} style={[globalStyles.card, globalStyles.shadow, styles.classCard, { backgroundColor: theme.surface }]}>
                                <View style={[styles.classTimeContainer, { borderColor: theme.border }]}>
                                    <Text style={[styles.classTime, { color: theme.text }]}>{item.time}</Text>
                                </View>
                                <View style={styles.classInfo}>
                                    <Text style={[styles.classTitle, { color: theme.text }]}>{item.title}</Text>
                                    <Text style={[styles.classTeacher, { color: theme.textSecondary }]}>{item.teacher} • {item.room}</Text>
                                </View>
                                <View style={styles.classAction}>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
                                </View>
                            </View>
                        ))}
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statWrapper: {
        width: '48%',
    },
    sectionContainer: {
        marginTop: SIZES.base * 2,
    },
    linkText: {
        ...FONTS.body4,
        marginBottom: SIZES.base,
        fontWeight: '600',
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding * 0.5,
        marginBottom: SIZES.base,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 1.5,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        ...FONTS.body4,
        color: COLORS.text,
        lineHeight: 20,
    },
    activityTime: {
        ...FONTS.small,
        color: COLORS.textLight,
        marginTop: 2,
    },
    classCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.base,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    classTimeContainer: {
        paddingRight: SIZES.base * 1.5,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    classTime: {
        ...FONTS.small,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    classInfo: {
        flex: 1,
        paddingLeft: SIZES.base * 1.5,
    },
    classTitle: {
        ...FONTS.body4,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    classTeacher: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        marginTop: 2,
    }
});

export default DashboardScreen;

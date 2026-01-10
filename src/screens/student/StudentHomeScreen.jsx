import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import { AuthContext } from '../../context/AuthContext';
import { SchoolContext } from '../../context/SchoolContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';

import { useNavigation } from '@react-navigation/native';

const StudentHomeScreen = () => {
    const { userInfo } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, students } = useContext(SchoolContext);
    const navigation = useNavigation();

    // Logic to find "Next Class"
    const currentStudent = students.find(s => s.name === userInfo?.name) || students[0];
    let nextClass = null;

    if (currentStudent?.assignedCourseId) {
        const course = courses.find(c => c.id === currentStudent.assignedCourseId);
        if (course) {
            nextClass = course;
        }
    }

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Section */}
                <View style={[styles.header, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{t.hello}</Text>
                        <Text style={[styles.name, { color: theme.text }]}>{userInfo?.name || 'Student'}</Text>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: userInfo?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                            style={styles.avatar}
                        />
                    </View>
                </View>

                <View style={globalStyles.screenPadding}>
                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <StatCard
                                title={t.attendance}
                                value="92%"
                                icon="checkmark-circle"
                                color={COLORS.success}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <StatCard
                                title={t.avgGrade}
                                value="4.8"
                                icon="star"
                                color={COLORS.warning}
                            />
                        </View>
                    </View>

                    {/* Next Class Card - Only show if enrolled */}
                    {nextClass ? (
                        <>
                            <Text style={[globalStyles.title, { color: theme.text }]}>{t.nextClass}</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('CourseDetail', {
                                    course: nextClass,
                                    isEnrolled: true
                                })}
                                activeOpacity={0.8}
                            >
                                <View style={[globalStyles.card, globalStyles.shadow, styles.nextClassCard, { backgroundColor: nextClass.color || COLORS.primary }]}>
                                    <View style={[styles.classTimeBox, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                                        <Text style={styles.classTime}>{nextClass.time || '14:00'}</Text>
                                        <Text style={styles.classDuration}>{nextClass.days || 'DCHJ'}</Text>
                                    </View>
                                    <View style={styles.classDetails}>
                                        <Text style={styles.className}>{nextClass.title}</Text>
                                        <Text style={styles.classTeacher}>{nextClass.instructor || 'Instructor'}</Text>
                                        <View style={styles.locationContainer}>
                                            <Ionicons name="location" size={14} color={COLORS.surface} opacity={0.8} />
                                            <Text style={styles.classLocation}>Lab Room 1</Text>
                                        </View>
                                    </View>
                                    <View style={styles.classIcon}>
                                        <Ionicons name={nextClass.icon || "code-slash"} size={24} color={COLORS.surface} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={[globalStyles.card, { padding: 20, alignItems: 'center' }]}>
                            <Text style={{ color: theme.textSecondary }}>No upcoming classes found.</Text>
                        </View>
                    )}

                    {/* Announcements */}
                    <Text style={[globalStyles.title, { color: theme.text }]}>{t.announcements}</Text>
                    <View style={[globalStyles.card, globalStyles.shadow, styles.announcementCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.announcementHeader}>
                            <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                            <Text style={[styles.announcementTitle, { color: theme.text }]}>Exam Schedule Update</Text>
                        </View>
                        <Text style={[styles.announcementText, { color: theme.textSecondary }]}>
                            The midterm exams for React Native course have been rescheduled to next Monday, Jan 29th.
                        </Text>
                        <Text style={[styles.announcementDate, { color: theme.textLight }]}>2 hours ago</Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: SIZES.base * 2,
    },
    greeting: {
        ...FONTS.body3,
    },
    name: {
        ...FONTS.h2,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: SIZES.base,
    },
    nextClassCard: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        padding: 0,
        overflow: 'hidden',
    },
    classTimeBox: {
        padding: SIZES.padding,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    classTime: {
        ...FONTS.h3,
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    classDuration: {
        ...FONTS.small,
        color: COLORS.surface,
        opacity: 0.8,
    },
    classDetails: {
        flex: 1,
        padding: SIZES.padding,
        justifyContent: 'center',
    },
    className: {
        ...FONTS.h4,
        color: COLORS.surface,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    classTeacher: {
        ...FONTS.body4,
        color: COLORS.surface,
        opacity: 0.9,
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    classLocation: {
        ...FONTS.small,
        color: COLORS.surface,
        opacity: 0.8,
        marginLeft: 4,
    },
    classIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    announcementCard: {
        padding: SIZES.padding,
    },
    announcementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    announcementTitle: {
        ...FONTS.h4,
        marginLeft: 8,
        fontWeight: '600',
    },
    announcementText: {
        ...FONTS.body4,
        lineHeight: 20,
        marginBottom: 8,
    },
    announcementDate: {
        ...FONTS.small,
    }
});

export default StudentHomeScreen;

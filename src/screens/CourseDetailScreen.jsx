import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import Header from '../components/Header';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';

const CourseDetailScreen = ({ route, navigation }) => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { course, isEnrolled } = route.params || { course: { title: 'Course Name', instructor: 'Instructor', students: 0, price: '$0', color: COLORS.primary }, isEnrolled: false };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header title={t.courseDetails || "Group Details"} />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[styles.headerCard, { backgroundColor: course.color }]}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{course.title}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="person" size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{course.instructor}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="people" size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{course.students || 25} {t.students}</Text>
                            </View>
                        </View>
                    </View>

                    {isEnrolled ? (
                        <View style={styles.progressBadge}>
                            <Text style={styles.progressText}>{t.inProgress || "In Progress"}</Text>
                        </View>
                    ) : (
                        <View style={styles.priceTag}>
                            <Text style={styles.priceText}>{course.price || '$99'}</Text>
                            <Text style={styles.perMonth}>/month</Text>
                        </View>
                    )}
                </View>

                <View style={globalStyles.screenPadding}>

                    <View style={styles.statsRow}>
                        <View style={[styles.statItem, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.statValue, { color: theme.text }]}>24</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.lessons || "Lessons"}</Text>
                        </View>
                        <View style={[styles.statItem, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.statValue, { color: theme.text, fontSize: 16 }]}>{course.days || 'DCHJ'}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{course.time || '14:00'}</Text>
                        </View>
                        <View style={[styles.statItem, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.statValue, { color: theme.text }]}>4.8</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.rating || "Rating"}</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.syllabus || "Syllabus"}</Text>
                    <View style={[globalStyles.card, globalStyles.shadow, styles.syllabusCard, { backgroundColor: theme.surface }]}>
                        {[1, 2, 3, 4, 5].map((item, index) => (
                            <TouchableOpacity key={index} style={[styles.lessonItem, { borderColor: theme.border }]}>
                                <View style={[styles.lessonNumber, { backgroundColor: theme.background }, isEnrolled && index < 3 && { backgroundColor: COLORS.success, borderColor: COLORS.success }]}>
                                    {isEnrolled && index < 3 ? (
                                        <Ionicons name="checkmark" size={16} color={COLORS.surface} />
                                    ) : (
                                        <Text style={[styles.lessonNumberText, { color: theme.textSecondary }]}>{index + 1}</Text>
                                    )}
                                </View>
                                <View style={styles.lessonContent}>
                                    <Text style={[styles.lessonTitle, { color: theme.text }]}>Introduction to Chapter {index + 1}</Text>
                                    <Text style={[styles.lessonDuration, { color: theme.textLight }]}>45 mins</Text>
                                </View>
                                <Ionicons
                                    name={isEnrolled ? "play-circle" : "lock-closed"}
                                    size={24}
                                    color={isEnrolled ? COLORS.primary : theme.textLight}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Only show settings for Admins, not students */}
                    {!isEnrolled && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.settings || "Settings"}</Text>
                            <View style={[globalStyles.card, globalStyles.shadow, styles.settingsCard, { backgroundColor: theme.surface }]}>
                                <View style={styles.settingItem}>
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Accepting New Students</Text>
                                    <Switch value={true} trackColor={{ true: COLORS.primaryLight }} thumbColor={COLORS.primary} />
                                </View>
                                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                <View style={styles.settingItem}>
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Visible in Catalog</Text>
                                    <Switch value={true} trackColor={{ true: COLORS.primaryLight }} thumbColor={COLORS.primary} />
                                </View>
                            </View>
                        </>
                    )}

                </View>
            </ScrollView>

            <View style={styles.fabContainer}>
                {isEnrolled ? (
                    <TouchableOpacity style={[styles.editButton, { backgroundColor: COLORS.success }]}>
                        <Ionicons name="play" size={24} color={COLORS.surface} />
                        <Text style={styles.editButtonText}>{t.continueLearning || "Continue Learning"}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.editButton}>
                        <Ionicons name="create-outline" size={24} color={COLORS.surface} />
                        <Text style={styles.editButtonText}>Edit Course</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    headerCard: {
        padding: SIZES.padding * 1.5,
        paddingTop: SIZES.padding * 2,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: SIZES.base * 2,
    },
    title: {
        ...FONTS.h1,
        color: COLORS.surface,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: SIZES.padding,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        ...FONTS.body4,
        color: COLORS.surface,
        marginLeft: 4,
        opacity: 0.9,
    },
    priceTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    progressBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    progressText: {
        ...FONTS.h4,
        fontWeight: 'bold',
        color: COLORS.surface,
    },
    priceText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.surface,
    },
    perMonth: {
        ...FONTS.small,
        color: COLORS.surface,
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SIZES.padding,
    },
    statItem: {
        flex: 1,
        padding: 16,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    statValue: {
        ...FONTS.h3,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        ...FONTS.small,
    },
    sectionTitle: {
        ...FONTS.h4,
        marginBottom: SIZES.base,
        marginLeft: 4,
        marginTop: SIZES.base,
    },
    syllabusCard: {
        padding: SIZES.padding,
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    lessonNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    lessonNumberText: {
        ...FONTS.small,
        fontWeight: 'bold',
    },
    lessonContent: {
        flex: 1,
    },
    lessonTitle: {
        ...FONTS.body4,
        fontWeight: '500',
    },
    lessonDuration: {
        ...FONTS.small,
    },
    settingsCard: {
        padding: SIZES.padding,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingLabel: {
        ...FONTS.body3,
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    editButtonText: {
        ...FONTS.h4,
        color: COLORS.surface,
        fontWeight: '600',
        marginLeft: 8,
    }
});

export default CourseDetailScreen;

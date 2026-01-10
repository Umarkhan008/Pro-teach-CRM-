import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import Header from '../components/Header';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';

const TeacherDetailScreen = ({ route, navigation }) => {
    const { teacher } = route.params || { teacher: null };
    const { theme } = useContext(ThemeContext);
    const { courses } = useContext(SchoolContext);
    const [showPassword, setShowPassword] = React.useState(false);

    // Get assigned courses
    const assignedCourses = courses.filter(course =>
        teacher?.assignedCourses?.includes(course.id)
    );

    // Generate schedule from assigned courses (Mocking time for now as it's not in course object)
    const scheduleItems = assignedCourses.map((course, index) => ({
        id: course.id,
        day: index % 2 === 0 ? 'Mon/Wed' : 'Tue/Thu',
        time: index % 2 === 0 ? '09:00 - 11:00' : '14:00 - 16:00',
        title: course.title
    }));

    if (!teacher) {
        return (
            <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]}>
                <Header title="Teacher Profile" />
                <View style={styles.center}>
                    <Text style={{ color: theme.text }}>Teacher not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleCall = () => {
        if (teacher.phone) {
            Linking.openURL(`tel:${teacher.phone}`);
        } else {
            Alert.alert("Info", "No phone number available for this teacher.");
        }
    };

    const handleEmail = () => {
        if (teacher.email) {
            Linking.openURL(`mailto:${teacher.email}`);
        } else {
            Alert.alert("Info", "No email address available for this teacher.");
        }
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header
                title="Teacher Profile"
                rightIcon="create-outline"
                onRightPress={() => navigation.navigate('Teachers', { editTeacher: teacher })}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Profile Header Card */}
                <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: teacher.avatar || teacher.image || 'https://ui-avatars.com/api/?name=' + teacher.name + '&background=random' }}
                            style={styles.avatar}
                        />
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={12} color={COLORS.white} />
                        </View>
                    </View>

                    <Text style={[styles.name, { color: theme.text }]}>{teacher.name}</Text>
                    <Text style={[styles.subject, { color: theme.textSecondary }]}>{teacher.subject} Instructor</Text>

                    <View style={[styles.headerCredentials, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8, paddingTop: 8, width: '90%' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => {
                                    Clipboard.setStringAsync(teacher.login || '');
                                    Alert.alert("Nusxalandi", "Login nusxalandi");
                                }}
                            >
                                <Ionicons name="person-outline" size={14} color={COLORS.primary} />
                                <Text style={[styles.headerCredentialText, { color: theme.textSecondary, marginLeft: 4 }]}>
                                    {teacher.login || 'no login'}
                                </Text>
                                <Ionicons name="copy-outline" size={12} color={theme.textLight} style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} style={{ marginLeft: 15 }} />
                                <TouchableOpacity
                                    onPress={() => {
                                        Clipboard.setStringAsync(teacher.password || '');
                                        Alert.alert("Nusxalandi", "Parol nusxalandi");
                                    }}
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <Text style={[styles.headerCredentialText, { color: theme.textSecondary, marginLeft: 4 }]}>
                                        {showPassword ? (teacher.password || '••••••••') : '••••••••'}
                                    </Text>
                                    <Ionicons name="copy-outline" size={12} color={theme.textLight} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 8 }}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{teacher.students || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textLight }]}>Students</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>4.9</Text>
                            <Text style={[styles.statLabel, { color: theme.textLight }]}>Rating</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>5</Text>
                            <Text style={[styles.statLabel, { color: theme.textLight }]}>Years Exp.</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handleCall}>
                            <Ionicons name="call" size={20} color={COLORS.white} />
                            <Text style={styles.primaryBtnText}>Call Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={handleEmail}>
                            <Ionicons name="mail" size={20} color={theme.text} />
                            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Email</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={globalStyles.screenPadding}>

                    {/* About Section */}
                    <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
                        <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
                            {teacher.bio || `Experienced instructor specializing in ${teacher.subject}. Passionate about helping students achieve their academic and professional goals through personalized guidance and structured learning paths.`}
                        </Text>
                    </View>

                    {/* Contact Info */}
                    <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>

                        <View style={styles.contactItem}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.primary + '15' }]}>
                                <Ionicons name="mail" size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={[styles.contactLabel, { color: theme.textLight }]}>Email</Text>
                                <Text style={[styles.contactValue, { color: theme.text }]}>{teacher.email || "Not provided"}</Text>
                            </View>
                        </View>

                        <View style={styles.contactItem}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.secondary + '15' }]}>
                                <Ionicons name="call" size={18} color={COLORS.secondary} />
                            </View>
                            <View>
                                <Text style={[styles.contactLabel, { color: theme.textLight }]}>Phone</Text>
                                <Text style={[styles.contactValue, { color: theme.text }]}>{teacher.phone || "Not provided"}</Text>
                            </View>
                        </View>

                    </View>

                    {/* Assigned Courses */}
                    <View style={globalStyles.screenPadding}>
                        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Assigned Groups</Text>
                        {assignedCourses.length > 0 ? (
                            assignedCourses.map((item, index) => (
                                <View key={index} style={[globalStyles.card, globalStyles.shadow, styles.courseCard, { backgroundColor: theme.surface }]}>
                                    <View style={[styles.courseIcon, { backgroundColor: index % 2 === 0 ? COLORS.primary + '20' : COLORS.secondary + '20' }]}>
                                        <Ionicons name="book" size={24} color={index % 2 === 0 ? COLORS.primary : COLORS.secondary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.courseTitle, { color: theme.text }]}>{item.title}</Text>
                                        <Text style={[styles.courseMeta, { color: theme.textLight }]}>{item.level || 'General'} • 24 Lessons</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: theme.textLight, fontStyle: 'italic', marginBottom: 20 }}>No groups assigned yet.</Text>
                        )}
                    </View>

                    {/* Schedule */}
                    <View style={globalStyles.screenPadding}>
                        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Weekly Schedule</Text>
                        {scheduleItems.length > 0 ? (
                            <View style={[globalStyles.card, globalStyles.shadow, styles.scheduleCard, { backgroundColor: theme.surface }]}>
                                {scheduleItems.map((item, index) => (
                                    <View key={index} style={styles.scheduleItem}>
                                        <Text style={[styles.dayText, { color: theme.text }]}>{item.day}</Text>
                                        <View style={[styles.timeSlot, { backgroundColor: theme.background }]}>
                                            <Text style={[styles.timeText, { color: theme.textSecondary }]}>{item.time}</Text>
                                        </View>
                                        <Text style={{ marginLeft: 10, color: theme.text, fontSize: 12 }}>{item.title}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: theme.textLight, fontStyle: 'italic' }}>No schedule available.</Text>
                        )}
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: SIZES.padding * 1.5,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...globalStyles.shadow,
        marginBottom: SIZES.padding,
    },
    imageContainer: {
        marginBottom: SIZES.base,
        position: 'relative',
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: COLORS.surface, // Matches background nicely usually
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: COLORS.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    name: {
        ...FONTS.h2,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subject: {
        ...FONTS.body3,
        marginBottom: SIZES.padding,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 20,
        marginBottom: SIZES.padding,
        width: '90%',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        ...FONTS.h3,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    divider: {
        width: 1,
        height: 30,
    },
    actionRow: {
        flexDirection: 'row',
        width: '90%',
        justifyContent: 'space-between',
        marginTop: SIZES.base,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 15,
        flex: 0.48,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    secondaryBtn: {
        borderWidth: 1,
    },
    primaryBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: 8,
        ...FONTS.body3,
    },
    secondaryBtnText: {
        fontWeight: 'bold',
        marginLeft: 8,
        ...FONTS.body3,
    },
    sectionHeader: {
        ...FONTS.h4,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        marginLeft: 4,
    },
    sectionContainer: {
        padding: SIZES.padding,
        borderRadius: 20,
        marginBottom: SIZES.padding,
        // Optional shadow for sections if desired, clean flat look is also good
    },
    sectionTitle: {
        ...FONTS.h4,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    aboutText: {
        ...FONTS.body4,
        lineHeight: 22,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    contactLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    contactValue: {
        ...FONTS.body3,
        fontWeight: '500',
    },
    scheduleCard: {
        padding: SIZES.padding,
        borderRadius: 20,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dayText: {
        width: 40,
        ...FONTS.body3,
        fontWeight: '600',
    },
    timeSlot: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 8,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '500',
    },
    headerCredentials: {
        width: '100%',
    },
    headerCredentialText: {
        fontSize: 12,
        fontWeight: '500',
    }
});

export default TeacherDetailScreen;

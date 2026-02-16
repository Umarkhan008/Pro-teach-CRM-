import React, { useContext, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    useWindowDimensions,
    Image,
    TextInput,
    Platform,
    LayoutAnimation,
    UIManager,
    Alert,
    Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';

// Enable LayoutAnimation for Android


const CourseDetailScreen = ({ route, navigation }) => {
    const { width } = useWindowDimensions();
    const { courses, students, attendance, deleteCourse, updateCourse, appSettings } = useContext(SchoolContext);
    const { t } = useContext(LanguageContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { showLoader, hideLoader } = useUI();
    const isDesktop = Platform.OS === 'web' && width >= 1280;

    const { id } = route.params || {};
    let { course } = route.params || {};

    // Get group from context if only ID is provided
    if (!course && id) {
        course = courses.find(c => c.id.toString() === id.toString());
    }

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // All, Active, Paused, Left
    const [settingsCollapsed, setSettingsCollapsed] = useState(true);

    const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

    // Check if today's attendance is already taken
    const isAttendanceTaken = useMemo(() => {
        if (!course || !attendance) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        return attendance.some(a => String(a.courseId) === String(course.id) && a.date === todayStr);
    }, [attendance, course]);

    // Group-specific student data
    const groupStudents = useMemo(() => {
        if (!course) return [];
        return students.filter(s => s.assignedCourseId === course.id || s.course === course.title);
    }, [course, students]);

    const filteredStudents = useMemo(() => {
        return groupStudents.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [groupStudents, searchQuery, filterStatus]);

    // System Status Logic
    const getSystemStatus = () => {
        if (!course) return 'UPCOMING';
        const now = new Date();
        const start = course.startDate ? new Date(course.startDate) : new Date(2020, 0, 1);
        const end = course.endDate ? new Date(course.endDate) : new Date(2030, 0, 1);

        if (now < start) return 'UPCOMING';
        if (now > end) return 'COMPLETED';
        return 'LIVE'; // Defaulting to "LIVE" for active period, though Dashboard has more granular time-based check
    };

    const isDayActive = (checkDayIdx) => { // 0-6 (Mon-Sun)
        if (!course || !course.days) return false;

        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const targetDayName = dayNames[checkDayIdx];

        const aliasesForDays = {
            'Monday': ['Mon', 'Du', 'Dushanba', 'D'],
            'Tuesday': ['Tue', 'Se', 'Seshanba', 'S'],
            'Wednesday': ['Wed', 'Chor', 'Chorshanba', 'Ch', 'Cho'],
            'Thursday': ['Thu', 'Pay', 'Payshanba', 'P', 'Pa'],
            'Friday': ['Fri', 'Jum', 'Juma', 'J', 'Ju'],
            'Saturday': ['Sat', 'Shan', 'Shanba', 'Sh', 'Sha'],
            'Sunday': ['Sun', 'Yak', 'Yakshanba', 'Y', 'Ya']
        };

        const targetAliases = (aliasesForDays[targetDayName] || []).map(a => a.toLowerCase());
        const courseDaysRaw = Array.isArray(course.days) ? course.days : (course.days || '').toString().split(/[,\s-/]+/);
        const courseDays = courseDaysRaw.map(d => d.trim().toLowerCase());

        return courseDays.some(d =>
            d.includes('daily') ||
            d.includes('har kuni') ||
            targetAliases.some(alias => d === alias || d.includes(alias))
        );
    };

    const isTodayLesson = (() => {
        const todayIdx = (new Date().getDay() + 6) % 7; // ISO Mon-Sun
        return isDayActive(todayIdx);
    })();

    const toggleSettings = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSettingsCollapsed(!settingsCollapsed);
    };

    const handleArchiveCourse = async () => {
        Alert.alert(
            t.archiveGroup || 'Guruhni Arxivlash',
            'Ushbu guruhni arxivlashni xohlaysizmi? Arxivlangan guruhlarni keyinchalik tiklash mumkin.',
            [
                { text: t.cancel || 'Bekor qilish', style: 'cancel' },
                {
                    text: t.archive || 'Arxivlash',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateCourse(course.id, { ...course, status: 'Archived' });
                            Alert.alert(t.success || 'Muvaffaqiyatli', 'Guruh arxivlandi');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t.error || 'Xatolik', 'Arxivlashda xatolik yuz berdi');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteCourse = async () => {
        Alert.alert(
            'Guruhni O\'chirish',
            'Ushbu guruhni butunlay o\'chirmoqchimisiz? Bu amalni bekor qilib bo\'lmaydi!',
            [
                { text: t.cancel || 'Bekor qilish', style: 'cancel' },
                {
                    text: 'O\'chirish',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCourse(course.id);
                            Alert.alert(t.success || 'Muvaffaqiyatli', 'Guruh o\'chirildi');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t.error || 'Xatolik', 'O\'chirishda xatolik yuz berdi');
                        }
                    }
                }
            ]
        );
    };

    const handleAttendancePress = async () => {
        showLoader();
        setTimeout(() => {
            navigation.navigate('Attendance', { course: course });
        }, 50);
    };

    if (!course) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Text style={{ color: theme.text }}>Guruh topilmadi</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={{ color: theme.primary }}>Orqaga</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const status = getSystemStatus();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Minimal Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.headerTitle}>{course.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status === 'LIVE' ? (isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#E8F5E9') : (isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#FFF3E0') }]}>
                            <Text style={[styles.statusText, { color: status === 'LIVE' ? (isDarkMode ? '#3FB950' : '#4CAF50') : (isDarkMode ? '#F59E0B' : '#FF9800') }]}>
                                {status === 'LIVE' ? t.active_status.toUpperCase() : status === 'UPCOMING' ? t.upcoming.toUpperCase() : t.completed_status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.headerSub}>
                        {course.instructor || course.teacher} • {course.room || t.roomError} • {course.time}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        const sheetUrl = appSettings?.googleSheetsViewUrl;
                        if (sheetUrl) {
                            Linking.openURL(sheetUrl).catch(err => {
                                Alert.alert('Xatolik', 'Havolani ochib bo\'lmadi: ' + err.message);
                            });
                        } else {
                            Alert.alert(
                                'Sozlanmagan',
                                'Jadvalni ko\'rish uchun Google Sheets havolasi (View Link) kiritilmagan.\n\nIltimos, "Sozlamalar" > "Google Sheets" bo\'limiga o\'tib, pastdagi "Google Sheet Link" maydonini to\'ldiring.',
                                [
                                    { text: 'Bekor qilish', style: 'cancel' },
                                    { text: 'Sozlash', onPress: () => navigation.navigate('Settings', { openSheetSettings: true }) }
                                ]
                            );
                        }
                    }}
                    style={styles.sheetBtn}
                >
                    <MaterialCommunityIcons name="google-spreadsheet" size={24} color="#27AE60" />
                </TouchableOpacity>
            </View>

            {/* Desktop Multi-Column Layout */}
            {isDesktop ? (
                <View style={styles.desktopWrapper}>
                    {/* Desktop Header */}
                    <View style={styles.desktopHeader}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.desktopBackBtn}>
                            <Ionicons name="arrow-back" size={20} color={theme.primary} />
                            <Text style={styles.desktopBackText}>Orqaga</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <View style={styles.desktopHeaderActions}>
                            <TouchableOpacity
                                style={styles.desktopSheetBtn}
                                onPress={() => {
                                    const sheetUrl = appSettings?.googleSheetsViewUrl;
                                    if (sheetUrl) {
                                        Linking.openURL(sheetUrl).catch(err => {
                                            Alert.alert('Xatolik', "Havolani ochib bo'lmadi: " + err.message);
                                        });
                                    } else {
                                        Alert.alert('Sozlanmagan', 'Google Sheets havolasi kiritilmagan');
                                    }
                                }}
                            >
                                <MaterialCommunityIcons name="google-spreadsheet" size={18} color="#27AE60" />
                                <Text style={{ color: '#27AE60', fontWeight: '600', fontSize: 13 }}>Jadval</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.desktopAttendanceHeaderBtn, isAttendanceTaken && { backgroundColor: '#10B98110' }]}
                                onPress={handleAttendancePress}
                            >
                                <Ionicons name={isAttendanceTaken ? "checkmark-done-circle" : "checkmark-circle-outline"} size={18} color={isAttendanceTaken ? '#10B981' : theme.primary} />
                                <Text style={{ color: isAttendanceTaken ? '#10B981' : theme.primary, fontWeight: '600', fontSize: 13 }}>
                                    {isAttendanceTaken ? 'Davomat olingan' : 'Davomat olish'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.desktopScrollContent}>
                        {/* Course Header Card */}
                        <View style={styles.desktopCourseHeader}>
                            <View style={[styles.desktopCourseIconLarge, { backgroundColor: (course.color || theme.primary) + '15' }]}>
                                <Ionicons name="book" size={40} color={course.color || theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Text style={styles.desktopCourseTitle}>{course.title}</Text>
                                    <View style={[styles.desktopStatusBadge, { backgroundColor: status === 'LIVE' ? '#10B98115' : '#F59E0B15' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: status === 'LIVE' ? '#10B981' : '#F59E0B' }]} />
                                        <Text style={{ color: status === 'LIVE' ? '#10B981' : '#F59E0B', fontWeight: '600', fontSize: 12 }}>
                                            {status === 'LIVE' ? 'Faol' : status === 'UPCOMING' ? 'Kutilmoqda' : 'Yakunlangan'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.desktopCourseSub}>
                                    {course.instructor || course.teacher} • {course.room || t.roomError} • {course.time}
                                </Text>
                            </View>
                            <View style={styles.desktopMetricsRow}>
                                <View style={styles.desktopMetricBox}>
                                    <Feather name="users" size={16} color="#5865F2" />
                                    <Text style={styles.desktopMetricValue}>{groupStudents.length}</Text>
                                    <Text style={styles.desktopMetricLabel}>{t.student}</Text>
                                </View>
                                <View style={styles.desktopMetricBox}>
                                    <Feather name="dollar-sign" size={16} color="#27AE60" />
                                    <Text style={styles.desktopMetricValue}>12.4M</Text>
                                    <Text style={styles.desktopMetricLabel}>{t.metricsDaromad}</Text>
                                </View>
                                <View style={styles.desktopMetricBox}>
                                    <Feather name="bar-chart-2" size={16} color="#F2994A" />
                                    <Text style={styles.desktopMetricValue}>92%</Text>
                                    <Text style={styles.desktopMetricLabel}>{t.metricsDavomat}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Two Column Layout */}
                        <View style={styles.desktopContentRow}>
                            {/* Left Column - Schedule & Settings */}
                            <View style={styles.desktopLeftColumn}>
                                {/* Schedule Card */}
                                <View style={styles.desktopCard}>
                                    <Text style={styles.desktopCardTitle}>{t.groupSchedule}</Text>
                                    <View style={styles.desktopDaysGrid}>
                                        {['Du', 'Se', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'].map((day, idx) => {
                                            const todayIdx = (new Date().getDay() + 6) % 7;
                                            const isToday = idx === todayIdx;
                                            const isActive = isDayActive(idx);
                                            return (
                                                <View key={day} style={[styles.desktopDayChip, isActive && styles.desktopDayActive, isToday && styles.desktopDayToday]}>
                                                    <Text style={[styles.desktopDayText, isActive && { color: theme.primary }, isToday && { fontWeight: '700' }]}>{day}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                    <View style={styles.desktopTimeInfo}>
                                        <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{course.time} (1.5 soat)</Text>
                                    </View>
                                </View>

                                {/* Settings Card */}
                                <View style={styles.desktopCard}>
                                    <Text style={styles.desktopCardTitle}>{t.groupSettings}</Text>
                                    <View style={styles.desktopSettingRow}>
                                        <Text style={{ color: theme.text }}>{t.acceptNewStudents}</Text>
                                        <Switch value={true} trackColor={{ true: theme.primary + '80' }} />
                                    </View>
                                    <View style={styles.desktopSettingRow}>
                                        <Text style={{ color: theme.text }}>{t.visibleInCatalog}</Text>
                                        <Switch value={true} trackColor={{ true: theme.primary + '80' }} />
                                    </View>
                                    <View style={[styles.desktopDivider, { backgroundColor: theme.border }]} />
                                    <TouchableOpacity style={styles.desktopDangerBtn} onPress={handleArchiveCourse}>
                                        <Feather name="archive" size={18} color="#F59E0B" />
                                        <Text style={{ color: '#F59E0B', fontWeight: '600' }}>{t.archiveGroup}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.desktopDangerBtn} onPress={handleDeleteCourse}>
                                        <Feather name="trash-2" size={18} color="#EF4444" />
                                        <Text style={{ color: '#EF4444', fontWeight: '600' }}>Guruhni O'chirish</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Right Column - Students */}
                            <View style={styles.desktopRightColumn}>
                                <View style={styles.desktopCard}>
                                    <View style={styles.desktopStudentsHeader}>
                                        <Text style={styles.desktopCardTitle}>{t.students} ({groupStudents.length})</Text>
                                        <View style={styles.desktopStudentFilters}>
                                            {['All', 'Active', 'Paused'].map(f => (
                                                <TouchableOpacity
                                                    key={f}
                                                    style={[styles.desktopFilterChip, filterStatus === f && styles.desktopFilterActive]}
                                                    onPress={() => setFilterStatus(f)}
                                                >
                                                    <Text style={[styles.desktopFilterText, filterStatus === f && { color: '#fff' }]}>
                                                        {f === 'All' ? t.all : f === 'Active' ? t.active_status : 'To\'xtatilgan'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Search */}
                                    <View style={styles.desktopSearchBar}>
                                        <Ionicons name="search" size={18} color={theme.textLight} />
                                        <TextInput
                                            placeholder={`${t.search}...`}
                                            placeholderTextColor={theme.textLight}
                                            style={styles.desktopSearchInput}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                    </View>

                                    {/* Students Grid */}
                                    <View style={styles.desktopStudentsGrid}>
                                        {filteredStudents.map((s, idx) => (
                                            <TouchableOpacity
                                                key={s.id}
                                                style={styles.desktopStudentCard}
                                                onPress={() => navigation.navigate('StudentDetail', { student: s })}
                                            >
                                                <View style={[styles.desktopStudentAvatar, { backgroundColor: theme.primary + '20' }]}>
                                                    <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>
                                                        {(() => {
                                                            if (!s.name) return '?';
                                                            const parts = s.name.trim().split(/\s+/);
                                                            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                                                            return parts[0][0].toUpperCase();
                                                        })()}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.desktopStudentName}>{s.name}</Text>
                                                    <View style={[styles.desktopStudentBadge, { backgroundColor: s.status === 'Active' ? '#10B98115' : '#EF444415' }]}>
                                                        <Text style={{ color: s.status === 'Active' ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: '600' }}>
                                                            {s.status === 'Active' ? t.active_status : t.pending}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
                                            </TouchableOpacity>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <View style={styles.desktopEmptyStudents}>
                                                <Ionicons name="people-outline" size={48} color={theme.border} />
                                                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>{t.noResults}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                /* Mobile Layout */
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Key Metrics */}
                        <View style={styles.metricsRow}>
                            <View style={styles.metricCard}>
                                <Feather name="users" size={16} color="#5865F2" />
                                <Text style={styles.metricValue}>{groupStudents.length}</Text>
                                <Text style={styles.metricLabel}>{t.student}</Text>
                            </View>
                            <View style={styles.metricCard}>
                                <Feather name="dollar-sign" size={16} color="#27AE60" />
                                <Text style={styles.metricValue}>12.4M</Text>
                                <Text style={styles.metricLabel}>{t.metricsDaromad}</Text>
                            </View>
                            <View style={styles.metricCard}>
                                <Feather name="bar-chart-2" size={16} color="#F2994A" />
                                <Text style={styles.metricValue}>92%</Text>
                                <Text style={styles.metricLabel}>{t.metricsDavomat}</Text>
                            </View>
                            <View style={styles.metricCard}>
                                <Feather name="star" size={16} color="#9B51E0" />
                                <Text style={styles.metricValue}>4.9</Text>
                                <Text style={styles.metricLabel}>{t.metricsReyting}</Text>
                            </View>
                        </View>

                        {/* Schedule Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t.groupSchedule}</Text>
                            <View style={styles.daysRow}>
                                {['Du', 'Se', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'].map((day, idx) => {
                                    const todayIdx = (new Date().getDay() + 6) % 7; // ISO week
                                    const isToday = idx === todayIdx;
                                    const isActive = isDayActive(idx);

                                    return (
                                        <View key={day} style={styles.dayCol}>
                                            <View style={[
                                                styles.dayChip,
                                                isActive && styles.dayChipActive,
                                                isToday && styles.dayChipToday
                                            ]}>
                                                <Text style={[
                                                    styles.dayText,
                                                    isActive && styles.dayTextActive,
                                                    isToday && { color: COLORS.primary }
                                                ]}>{day}</Text>
                                            </View>
                                            {isToday && <View style={styles.todayDot} />}
                                        </View>
                                    );
                                })}
                            </View>
                            <View style={styles.timeInfo}>
                                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                                <Text style={styles.timeText}>{course.time} (1.5 soat)</Text>
                            </View>
                        </View>

                        {/* Students Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t.students} ({groupStudents.length})</Text>
                                <TouchableOpacity>
                                    <Text style={styles.viewAllBtn}>{t.all}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Search Bar */}
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={18} color={theme.textLight} />
                                <TextInput
                                    placeholder={`${t.search}...`}
                                    placeholderTextColor={theme.textLight}
                                    style={styles.searchInput}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            {/* Filter Chips */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                                {['All', 'Active', 'Paused', 'Left'].map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
                                        onPress={() => setFilterStatus(f)}
                                    >
                                        <Text style={[styles.filterText, filterStatus === f && styles.filterTextActive]}>
                                            {f === 'All' ? t.all : f === 'Active' ? t.active_status : f === 'Paused' ? 'Toʻxtatilgan' : 'Ketgan'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Student List */}
                            <View style={styles.studentList}>
                                {filteredStudents.map((s, idx) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.studentRow, idx === filteredStudents.length - 1 && { borderBottomWidth: 0 }]}
                                        onPress={() => navigation.navigate('StudentDetail', { student: s })}
                                    >
                                        <View style={[styles.studentAvatar, {
                                            backgroundColor: theme.primary + '20',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }]}>
                                            <Text style={{
                                                color: theme.primary,
                                                fontSize: 16,
                                                fontWeight: 'bold'
                                            }}>
                                                {(() => {
                                                    if (!s.name) return '?';
                                                    const parts = s.name.trim().split(/\s+/);
                                                    if (parts.length >= 2) {
                                                        return (parts[0][0] + parts[1][0]).toUpperCase();
                                                    }
                                                    return parts[0][0].toUpperCase();
                                                })()}
                                            </Text>
                                        </View>
                                        <View style={styles.studentDetails}>
                                            <Text style={styles.studentName}>{s.name}</Text>
                                            <View style={styles.studentMeta}>
                                                <View style={[styles.miniBadge, { backgroundColor: s.status === 'Active' ? (isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#E8F5E9') : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FFEBEE') }]}>
                                                    <Text style={[styles.miniBadgeText, { color: s.status === 'Active' ? (isDarkMode ? '#3FB950' : '#4CAF50') : (isDarkMode ? '#FF8F75' : '#D32F2F') }]}>
                                                        {s.status === 'Active' ? t.active_status : t.pending}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity style={styles.rowAction}>
                                            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <View style={styles.emptyList}>
                                        <Text style={styles.emptyText}>{t.noResults}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Group Settings */}
                        <View style={styles.settingsSection}>
                            <TouchableOpacity style={styles.settingsHeader} onPress={toggleSettings}>
                                <View style={styles.settingsHeaderTitle}>
                                    <Feather name="settings" size={18} color={theme.textSecondary} />
                                    <Text style={styles.settingsTitle}>{t.groupSettings}</Text>
                                </View>
                                <Ionicons name={settingsCollapsed ? "chevron-down" : "chevron-up"} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {!settingsCollapsed && (
                                <View style={styles.settingsContent}>
                                    <View style={styles.settingRow}>
                                        <Text style={styles.settingLabel}>{t.acceptNewStudents}</Text>
                                        <Switch
                                            value={true}
                                            trackColor={{ true: theme.primary + '80' }}
                                            thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
                                        />
                                    </View>
                                    <View style={styles.settingRow}>
                                        <Text style={styles.settingLabel}>{t.visibleInCatalog}</Text>
                                        <Switch value={true} trackColor={{ true: theme.primary + '80' }} />
                                    </View>
                                    <View style={styles.divider} />
                                    <TouchableOpacity style={styles.dangerBtn} onPress={handleArchiveCourse}>
                                        <Feather name="archive" size={18} color="#FF9800" />
                                        <Text style={[styles.dangerText, { color: '#FF9800' }]}>{t.archiveGroup}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteCourse}>
                                        <Feather name="trash-2" size={18} color="#D32F2F" />
                                        <Text style={[styles.dangerText, { color: '#D32F2F' }]}>Guruhni O'chirish</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                    </ScrollView>

                    {/* Sticky Bottom Attendance Button */}
                    <View style={styles.bottomBar}>
                        {
                            isAttendanceTaken ? (
                                <TouchableOpacity
                                    style={[styles.attendanceBtn, { backgroundColor: (isDarkMode ? '#059669' : '#4CAF50') }]}
                                    onPress={handleAttendancePress}
                                >
                                    <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
                                    <Text style={styles.attendanceBtnText}>Davomat olingan (Tahrirlash)</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.attendanceBtn, !isTodayLesson && styles.attendanceBtnDisabled]}
                                    onPress={handleAttendancePress}
                                    disabled={!isTodayLesson}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                                    <Text style={styles.attendanceBtnText}>{t.takeDailyAttendance}</Text>
                                </TouchableOpacity>
                            )}
                        {
                            !isTodayLesson && !isAttendanceTaken && (
                                <Text style={styles.attendanceHint}>{t.noAttendanceOnNonStudyDays}</Text>
                            )
                        }
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        marginLeft: 10,
        flex: 1
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    headerSub: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2
    },
    scrollContent: {
        paddingBottom: 120
    },
    metricsRow: {
        flexDirection: 'row',
        padding: 15,
        gap: 10
    },
    metricCard: {
        flex: 1,
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginVertical: 4
    },
    metricLabel: {
        fontSize: 10,
        color: theme.textSecondary,
        fontWeight: '500'
    },
    section: {
        backgroundColor: theme.surface,
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 20,
        padding: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 12
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    viewAllBtn: {
        fontSize: 13,
        color: theme.primary,
        fontWeight: '600'
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    dayCol: {
        alignItems: 'center'
    },
    dayChip: {
        width: 40,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    dayChipActive: {
        backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#EEF0FF',
        borderColor: isDarkMode ? 'rgba(79, 70, 229, 0.4)' : '#C2C9FF'
    },
    dayChipToday: {
        borderColor: theme.primary,
        borderWidth: 2
    },
    dayText: {
        fontSize: 12,
        color: theme.textLight,
        fontWeight: '600'
    },
    dayTextActive: {
        color: theme.primary
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.primary,
        marginTop: 4
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    timeText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '500'
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 15
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: theme.text
    },
    filterRow: {
        gap: 8,
        marginBottom: 15
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: theme.background
    },
    filterChipActive: {
        backgroundColor: theme.primary
    },
    filterText: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600'
    },
    filterTextActive: {
        color: '#FFF'
    },
    studentList: {
        marginTop: 5
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    studentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12
    },
    studentDetails: {
        flex: 1
    },
    studentName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.text
    },
    studentMeta: {
        flexDirection: 'row',
        marginTop: 4
    },
    miniBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    miniBadgeText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    rowAction: {
        padding: 5
    },
    emptyList: {
        padding: 20,
        alignItems: 'center'
    },
    emptyText: {
        color: theme.textLight,
        fontSize: 13
    },
    settingsSection: {
        marginHorizontal: 15,
        marginBottom: 15,
        backgroundColor: theme.surface,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15
    },
    settingsHeaderTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    settingsTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.text
    },
    settingsContent: {
        padding: 15,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: theme.border
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10
    },
    settingLabel: {
        fontSize: 14,
        color: theme.text
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 10
    },
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12
    },
    dangerText: {
        fontSize: 14,
        fontWeight: '600'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.surface,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    attendanceBtn: {
        backgroundColor: theme.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10
    },
    attendanceBtnDisabled: {
        backgroundColor: theme.border
    },
    attendanceBtnText: {
        color: theme.surface,
        fontSize: 16,
        fontWeight: 'bold'
    },
    attendanceHint: {
        textAlign: 'center',
        fontSize: 11,
        color: theme.textLight,
        marginTop: 8
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background
    },
    sheetBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surface,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: theme.border
    },
    // Desktop Styles
    desktopWrapper: { flex: 1 },
    desktopHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    desktopBackBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.primary + '10', gap: 8 },
    desktopBackText: { fontSize: 14, fontWeight: '600', color: theme.primary },
    desktopHeaderActions: { flexDirection: 'row', gap: 12 },
    desktopSheetBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#27AE6010', gap: 8 },
    desktopAttendanceHeaderBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.primary + '10', gap: 8 },
    desktopScrollContent: { padding: 32 },
    desktopCourseHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: theme.border, gap: 20 },
    desktopCourseIconLarge: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    desktopCourseTitle: { fontSize: 24, fontWeight: '700', color: theme.text },
    desktopStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    desktopCourseSub: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
    desktopMetricsRow: { flexDirection: 'row', gap: 16 },
    desktopMetricBox: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: theme.background, borderRadius: 12 },
    desktopMetricValue: { fontSize: 18, fontWeight: '700', color: theme.text, marginVertical: 4 },
    desktopMetricLabel: { fontSize: 11, color: theme.textSecondary },
    desktopContentRow: { flexDirection: 'row', gap: 24 },
    desktopLeftColumn: { width: 340, gap: 20 },
    desktopRightColumn: { flex: 1, gap: 20 },
    desktopCard: { backgroundColor: theme.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    desktopCardTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 },
    desktopDaysGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    desktopDayChip: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.background },
    desktopDayActive: { backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#EEF0FF' },
    desktopDayToday: { borderWidth: 2, borderColor: theme.primary },
    desktopDayText: { fontSize: 13, color: theme.textLight, fontWeight: '600' },
    desktopTimeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    desktopSettingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    desktopDivider: { height: 1, marginVertical: 12 },
    desktopDangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    desktopStudentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    desktopStudentFilters: { flexDirection: 'row', gap: 8 },
    desktopFilterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.background },
    desktopFilterActive: { backgroundColor: theme.primary },
    desktopFilterText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    desktopSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16, gap: 10 },
    desktopSearchInput: { flex: 1, fontSize: 14, color: theme.text },
    desktopStudentsGrid: { gap: 8 },
    desktopStudentCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.background, borderRadius: 12, gap: 12 },
    desktopStudentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    desktopStudentName: { fontSize: 14, fontWeight: '600', color: theme.text },
    desktopStudentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
    desktopEmptyStudents: { alignItems: 'center', paddingVertical: 40 }
});

export default CourseDetailScreen;

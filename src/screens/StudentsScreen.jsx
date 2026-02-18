import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    Text,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Animated,
    Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import ScreenHeader from '../components/ScreenHeader';
import PremiumModal from '../components/PremiumModal';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import DesktopDataTable from '../components/DesktopDataTable';

const getStudentStatuses = (isDarkMode) => ({
    'Active': { label: 'Faol', color: '#27AE60', bg: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE' },
    'Waiting': { label: 'Kutilmoqda', color: '#F2994A', bg: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8' },
    'Completed': { label: 'Bitirgan', color: '#5865F2', bg: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' },
    'Inactive': { label: 'Tark etgan', color: isDarkMode ? '#9CA3AF' : '#828282', bg: isDarkMode ? 'rgba(156, 163, 175, 0.15)' : '#F2F2F2' },
});

const StudentsScreen = ({ navigation, route, isDarkMode }) => {
    const { width } = useWindowDimensions();
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { students, courses, addStudent, updateStudent, deleteStudent } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const isDesktop = width >= 1280;

    const STUDENT_STATUSES = useMemo(() => getStudentStatuses(isDarkMode), [isDarkMode]);

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // All, Active, Waiting, Completed, Debtors

    useEffect(() => {
        if (route.params?.quickPay) {
            setActiveFilter('Debtors');
            // Clear the param
            navigation.setParams({ quickPay: undefined });
        }
    }, [route.params?.quickPay]);

    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [paymentPlan, setPaymentPlan] = useState('Monthly');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const studentName = student.name || '';
            const studentCourseName = student.course || '';
            const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase()) ||
                studentCourseName.toLowerCase().includes(search.toLowerCase());

            let matchesFilter = true;
            if (activeFilter === 'Debtors') {
                matchesFilter = (student.balance || 0) < 0;
            } else if (activeFilter !== 'All') {
                matchesFilter = student.status === activeFilter;
            }

            return matchesSearch && matchesFilter;
        }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [students, search, activeFilter]);

    const handleSaveStudent = async () => {
        if (!name.trim()) {
            Alert.alert('Xatolik', 'Iltimos, ismni kiriting');
            return;
        }

        const courseObj = courses.find(c => c.id === selectedCourseId);
        const studentData = {
            name,
            phone,
            assignedCourseId: selectedCourseId,
            course: courseObj ? courseObj.title : 'Guruhsiz',
            status: selectedCourseId ? 'Active' : 'Waiting',
            paymentPlan,
            balance: isEditing ? (students.find(s => s.id === editingId)?.balance || 0) : 0,
            attendanceRate: isEditing ? (students.find(s => s.id === editingId)?.attendanceRate || 0) : 100,
            createdAt: isEditing ? (students.find(s => s.id === editingId)?.createdAt) : new Date().toISOString()
        };

        showLoader('Saqlanmoqda...');
        try {
            if (isEditing) {
                await updateStudent(editingId, studentData);
            } else {
                await addStudent(studentData);
            }
            closeModal();
        } finally {
            hideLoader();
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setEditingId(null);
        setName('');
        setPhone('');
        setSelectedCourseId(null);
        setPaymentPlan('Monthly');
    };

    const handleEdit = (student) => {
        setIsEditing(true);
        setEditingId(student.id);
        setName(student.name);
        setPhone(student.phone || '');
        setSelectedCourseId(student.assignedCourseId);
        setPaymentPlan(student.paymentPlan || 'Monthly');
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        const confirmAnddelete = async () => {
            try {
                showLoader('O\'chirilmoqda...');
                await deleteStudent(id);
            } catch (error) {
                // Error is handled in context
            } finally {
                hideLoader();
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Haqiqatdan ham bu o'quvchini o'chirmoqchimisiz?")) {
                confirmAnddelete();
            }
        } else {
            Alert.alert(
                'O\'chirish',
                'Haqiqatdan ham bu o\'quvchini o\'chirmoqchimisiz?',
                [
                    { text: 'Yo\'q' },
                    {
                        text: 'Ha', style: 'destructive', onPress: confirmAnddelete
                    }
                ]
            );
        }
    };

    // Format balance for display
    const formatBalance = (amount) => {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1000000) {
            return `${(absAmount / 1000000).toFixed(1)}M`;
        } else if (absAmount >= 1000) {
            return `${Math.round(absAmount / 1000)}K`;
        }
        return absAmount.toString();
    };

    // Desktop stats calculation
    const stats = useMemo(() => {
        const total = students.length;
        const active = students.filter(s => s.status === 'Active').length;
        const waiting = students.filter(s => s.status === 'Waiting').length;
        const debtors = students.filter(s => (s.balance || 0) < 0).length;
        const totalDebt = students.reduce((sum, s) => sum + Math.min(0, s.balance || 0), 0);
        return { total, active, waiting, debtors, totalDebt };
    }, [students]);

    // Desktop Data Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: 'name',
            title: 'O\'quvchi',
            flex: 2,
            render: (value, item) => (
                <View style={styles.tableStudentCell}>
                    <View style={[styles.tableAvatar, { backgroundColor: `${theme.primary}15` }]}>
                        <Text style={[styles.tableAvatarText, { color: theme.primary }]}>
                            {(item.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </Text>
                    </View>
                    <View>
                        <Text style={[styles.tableStudentName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.tableStudentPhone, { color: theme.textSecondary }]}>{item.phone || '-'}</Text>
                    </View>
                </View>
            )
        },
        {
            key: 'course',
            title: 'Guruh',
            flex: 1.5,
            render: (value) => (
                <View style={[styles.groupBadge, { backgroundColor: `${theme.primary}10` }]}>
                    <Text style={[styles.groupBadgeText, { color: theme.primary }]}>{value || 'Guruhsiz'}</Text>
                </View>
            )
        },
        {
            key: 'status',
            title: 'Holat',
            flex: 1,
            render: (value) => {
                const status = STUDENT_STATUSES[value] || STUDENT_STATUSES['Active'];
                return (
                    <View style={[styles.statusBadgeTable, { backgroundColor: status.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusTextTable, { color: status.color }]}>{status.label}</Text>
                    </View>
                );
            }
        },
        {
            key: 'balance',
            title: 'Balans',
            flex: 1,
            align: 'right',
            render: (value) => {
                const balance = value || 0;
                const isDebtor = balance < 0;
                return (
                    <Text style={[
                        styles.balanceText,
                        { color: isDebtor ? '#EF4444' : '#10B981' }
                    ]}>
                        {isDebtor ? '−' : '+'}{formatBalance(balance)} so'm
                    </Text>
                );
            }
        },
        {
            key: 'attendanceRate',
            title: 'Davomat',
            flex: 0.8,
            align: 'center',
            render: (value) => (
                <Text style={{ color: theme.text, fontWeight: '600' }}>{value || 100}%</Text>
            )
        },
    ], [theme, STUDENT_STATUSES, isDarkMode]);

    // Mobile student card component
    const StudentRow = ({ item }) => {
        const initials = (item.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const status = STUDENT_STATUSES[item.status] || STUDENT_STATUSES['Active'];
        const balance = item.balance || 0;
        const isDebtor = balance < 0;

        const getBadgeStyles = (type) => {
            if (type === 'debtor') {
                return {
                    bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                    text: isDarkMode ? '#FF8F75' : '#DC2626'
                };
            }
            return {
                bg: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#DCFCE7',
                text: isDarkMode ? '#3FB950' : '#16A34A'
            };
        };

        const badgeStyle = getBadgeStyles(isDebtor ? 'debtor' : 'paid');

        return (
            <TouchableOpacity
                style={[styles.studentCard, { backgroundColor: theme.surface }]}
                onPress={() => navigation.navigate('StudentDetail', { student: item })}
                activeOpacity={0.7}
            >
                <View style={[styles.studentAvatar, { backgroundColor: badgeStyle.bg }]}>
                    <Text style={[styles.studentAvatarText, { color: badgeStyle.text }]}>{initials}</Text>
                </View>
                <View style={styles.studentDetails}>
                    <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.studentSubRow}>
                        <Ionicons name="school-outline" size={12} color={theme.textLight} />
                        <Text style={[styles.studentCourse, { color: theme.textSecondary }]} numberOfLines={1}>
                            {item.course || 'Guruhsiz'}
                        </Text>
                    </View>
                </View>
                <View style={styles.debtSection}>
                    {isDebtor ? (
                        <>
                            <View style={[styles.debtorBadge, { backgroundColor: badgeStyle.bg }]}>
                                <Ionicons name="alert-circle" size={12} color={badgeStyle.text} />
                                <Text style={[styles.debtorBadgeText, { color: badgeStyle.text }]}>Qarzdor</Text>
                            </View>
                            <Text style={[styles.debtAmount, { color: badgeStyle.text }]}>−{formatBalance(balance)} so'm</Text>
                        </>
                    ) : (
                        <>
                            <View style={[styles.paidBadge, { backgroundColor: badgeStyle.bg }]}>
                                <Ionicons name="checkmark-circle" size={12} color={badgeStyle.text} />
                                <Text style={[styles.paidBadgeText, { color: badgeStyle.text }]}>To'langan</Text>
                            </View>
                            {balance > 0 && (
                                <Text style={[styles.balanceAmount, { color: badgeStyle.text }]}>+{formatBalance(balance)} so'm</Text>
                            )}
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Row actions for desktop table
    const renderRowActions = (item) => (
        <>
            <TouchableOpacity
                style={[styles.tableActionBtn, { backgroundColor: `${theme.primary}10` }]}
                onPress={() => handleEdit(item)}
            >
                <Feather name="edit-2" size={14} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tableActionBtn, { backgroundColor: '#EF444410' }]}
                onPress={() => handleDelete(item.id)}
            >
                <Feather name="trash-2" size={14} color="#EF4444" />
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <View style={styles.container}>
                {/* Premium Header with safe area */}
                <ScreenHeader
                    title="O'quvchilar"
                    subtitle="Talabalarni boshqarish markazi"
                    rightAction={
                        isDesktop ? (
                            <TouchableOpacity
                                style={styles.desktopAddButton}
                                onPress={() => { closeModal(); setModalVisible(true); }}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.desktopAddButtonGradient}
                                >
                                    <Ionicons name="add" size={22} color="#fff" />
                                    <Text style={styles.desktopAddButtonText}>Yangi Talaba</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.headerIconBtn, { backgroundColor: theme.surface }]}
                                onPress={() => {/* options logic */ }}
                            >
                                <Ionicons name="options-outline" size={22} color={theme.text} />
                            </TouchableOpacity>
                        )
                    }
                />

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="search" size={20} color={theme.textLight} />
                        <TextInput
                            placeholder="Ism yoki guruh bo'yicha qidirish..."
                            placeholderTextColor={theme.textLight}
                            style={[styles.searchInput, { color: theme.text }]}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Status Segmented Controls */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {['All', 'Active', 'Waiting', 'Completed', 'Debtors'].map((filt) => (
                            <TouchableOpacity
                                key={filt}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: theme.surface, borderColor: theme.border },
                                    activeFilter === filt && [styles.activeFilterChip, { backgroundColor: theme.text, borderColor: theme.text }]
                                ]}
                                onPress={() => setActiveFilter(filt)}
                            >
                                <Text style={[styles.filterText, { color: theme.textSecondary }, activeFilter === filt && { color: theme.surface }]}>
                                    {filt === 'All' ? 'Barchasi' : (filt === 'Debtors' ? 'Qarzdorlar' : STUDENT_STATUSES[filt]?.label || filt)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Students List - Desktop vs Mobile */}
                {isDesktop ? (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 24 }}>
                        {/* Desktop Stats Cards */}
                        <View style={styles.desktopStatsRow}>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#667eea15' }]}>
                                    <Ionicons name="people" size={24} color="#667eea" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Jami o'quvchilar</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#10B98115' }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.active}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Faol</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#F59E0B15' }]}>
                                    <Ionicons name="time" size={24} color="#F59E0B" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.waiting}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Kutilmoqda</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#EF444415' }]}>
                                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.debtors}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Qarzdorlar</Text>
                                </View>
                            </View>
                        </View>

                        {/* Desktop Data Table */}
                        <DesktopDataTable
                            columns={tableColumns}
                            data={filteredStudents}
                            onRowPress={(item) => navigation.navigate('StudentDetail', { student: item })}
                            rowActions={renderRowActions}
                            emptyMessage="O'quvchilar topilmadi"
                        />
                    </ScrollView>
                ) : (
                    <FlatList
                        data={filteredStudents}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <StudentRow item={item} />}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1, minHeight: 0 }}
                        showsVerticalScrollIndicator={true}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={64} color={theme.border} />
                                <Text style={[styles.emptyText, { color: theme.textLight }]}>Talabalar topilmadi</Text>
                            </View>
                        }
                    />
                )}

                {/* FAB */}
                {!isDesktop && (
                    <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={() => { closeModal(); setModalVisible(true); }}>
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                )}

                {/* Modals */}
                <PremiumModal
                    visible={modalVisible}
                    onClose={closeModal}
                    title={isEditing ? 'Talabani Tahrirlash' : 'Yangi Talaba Qo\'shish'}
                    subtitle={isEditing ? "O'quvchi ma'lumotlarini yangilang" : "Yangi o'quvchi ma'lumotlarini kiriting"}
                    headerGradient={['#667eea', '#764ba2']}
                    footer={
                        <>
                            <PremiumButton
                                title="Bekor qilish"
                                type="outline"
                                onPress={closeModal}
                                style={{ flex: 1 }}
                            />
                            <PremiumButton
                                title="Saqlash"
                                onPress={handleSaveStudent}
                                style={{ flex: 1 }}
                                gradient={['#667eea', '#764ba2']}
                            />
                        </>
                    }
                >
                    <PremiumInput
                        label="F.I.SH *"
                        placeholder="Masalan: Alisher Navoiy"
                        value={name}
                        onChangeText={setName}
                        icon="person-outline"
                    />

                    <PremiumInput
                        label="Telefon raqami"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        icon="call-outline"
                    />

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Guruhga biriktirish</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {courses.map(course => (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[
                                        styles.courseChip,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        selectedCourseId === course.id && [styles.activeCourseChip, { backgroundColor: theme.primary, borderColor: theme.primary }]
                                    ]}
                                    onPress={() => setSelectedCourseId(course.id)}
                                >
                                    <Text style={[styles.courseChipText, { color: theme.textSecondary }, selectedCourseId === course.id && styles.activeCourseChipText]}>
                                        {course.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>To'lov rejasi</Text>
                        <View style={styles.planRow}>
                            {['Monthly', 'Full', 'Individual'].map(plan => (
                                <TouchableOpacity
                                    key={plan}
                                    style={[
                                        styles.planChip,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        paymentPlan === plan && [styles.activePlanChip, { backgroundColor: theme.text, borderColor: theme.text }]
                                    ]}
                                    onPress={() => setPaymentPlan(plan)}
                                >
                                    <Text style={[styles.planText, { color: theme.textSecondary }, paymentPlan === plan && { color: theme.surface }]}>
                                        {plan === 'Monthly' ? 'Oylik' : (plan === 'Full' ? 'To\'liq' : 'Individual')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </PremiumModal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2022' },
    subtitle: { fontSize: 14, color: '#828282', marginTop: 4 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1F2022' },
    filterSection: { marginBottom: 15 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    activeFilterChip: { backgroundColor: '#1F2022', borderColor: '#1F2022' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#828282' },
    activeFilterText: { color: 'white' },
    listContent: { paddingHorizontal: 20, paddingBottom: 130 },

    // New Student Card Styles
    studentCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8
    },
    studentAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    studentAvatarText: {
        fontSize: 18,
        fontWeight: '700'
    },
    studentDetails: {
        flex: 1,
        marginLeft: 14
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4
    },
    studentSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    studentCourse: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1
    },
    debtSection: {
        alignItems: 'flex-end',
        gap: 4,
        minWidth: 90
    },
    debtorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10
    },
    debtorBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626'
    },
    debtAmount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626'
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10
    },
    paidBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A'
    },
    balanceAmount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16A34A'
    },
    fab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6
    },
    emptyState: { alignItems: 'center', marginTop: 100, gap: 10 },
    emptyText: { fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    chipScroll: { marginBottom: 10 },
    courseChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1 },
    activeCourseChip: {},
    courseChipText: { fontWeight: 'bold' },
    activeCourseChipText: { color: 'white' },
    planRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    planChip: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    activePlanChip: {},
    planText: { fontWeight: '700' },
    activePlanText: {},
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    // Desktop Modal Styles
    modalOverlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalDesktopContainer: {
        width: '100%',
        maxWidth: 700,
    },
    modalContentDesktop: {
        borderRadius: 24,
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeaderGradient: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBodyDesktop: {
        padding: 24,
    },
    desktopRow: {
        flexDirection: 'row',
        gap: 20,
    },
    desktopFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    footerButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cancelButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    desktopAddButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    desktopAddButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 44,
        gap: 8,
    },
    desktopAddButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    // Desktop Data Table Styles
    desktopStatsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    desktopStatCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }),
    },
    statIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 13,
        marginTop: 2,
    },
    // Table cell styles
    tableStudentCell: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tableAvatar: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tableAvatarText: {
        fontSize: 14,
        fontWeight: '700',
    },
    tableStudentName: {
        fontSize: 14,
        fontWeight: '600',
    },
    tableStudentPhone: {
        fontSize: 12,
        marginTop: 2,
    },
    groupBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    groupBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadgeTable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusTextTable: {
        fontSize: 12,
        fontWeight: '600',
    },
    balanceText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tableActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.15s ease',
        }),
    },
});

const StudentsScreenWithTheme = (props) => {
    const { isDarkMode } = useContext(ThemeContext);
    return <StudentsScreen {...props} isDarkMode={isDarkMode} />;
};

export default StudentsScreen;

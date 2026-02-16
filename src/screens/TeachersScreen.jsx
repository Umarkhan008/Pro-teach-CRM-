import React, { useState, useContext, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Text,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import ScreenHeader from '../components/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumModal from '../components/PremiumModal';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import DesktopDataTable from '../components/DesktopDataTable';

const TEACHER_STATUSES = {
    'Active': { label: 'Faol', color: '#27AE60', bg: '#E8F7EE' },
    'On Leave': { label: 'Ta’til', color: '#F2994A', bg: '#FFF4E8' },
    'Inactive': { label: 'Faol emas', color: '#EB5757', bg: '#FFF0F0' },
    'No Groups': { label: 'Guruhsiz', color: '#828282', bg: '#F2F2F2' }
};

const TeachersScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { teachers, courses, addTeacher, updateTeacher, deleteTeacher } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const isDesktop = width >= 1280;

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // All, Active, NoGroups, OnLeave, Inactive
    const [modalVisible, setModalVisible] = useState(false);

    // Step-based Add Flow State
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [phone, setPhone] = useState('');
    const [salaryType, setSalaryType] = useState('Fixed'); // Fixed, Percentage
    const [hoursPerWeek, setHoursPerWeek] = useState('20');

    const filteredTeachers = useMemo(() => {
        return teachers.filter(teacher => {
            const matchesSearch = teacher.name.toLowerCase().includes(search.toLowerCase()) ||
                (teacher.subject || '').toLowerCase().includes(search.toLowerCase());

            let matchesFilter = true;
            if (activeFilter === 'NoGroups') {
                matchesFilter = !(teacher.assignedCourses && teacher.assignedCourses.length > 0);
            } else if (activeFilter !== 'All') {
                // Map filter to status keys
                const filterMap = { 'Active': 'Active', 'OnLeave': 'On Leave', 'Inactive': 'Inactive' };
                matchesFilter = teacher.status === filterMap[activeFilter];
            }
            return matchesSearch && matchesFilter;
        });
    }, [teachers, search, activeFilter]);

    const handleAddTeacher = async () => {
        if (!name || !specialty) {
            Alert.alert('Xatolik', 'Iltimos, ism va mutaxassislikni kiriting');
            return;
        }

        const teacherData = {
            name,
            subject: specialty,
            phone,
            salaryType,
            weeklyHours: parseInt(hoursPerWeek),
            status: 'Active',
            assignedCourses: [],
            students: 0,
            createdAt: new Date().toISOString()
        };

        showLoader('Qo‘shilmoqda...');
        await addTeacher(teacherData);
        hideLoader();
        closeModal();
    };

    const closeModal = () => {
        setModalVisible(false);
        setStep(1);
        setName('');
        setSpecialty('');
        setPhone('');
        setSalaryType('Fixed');
        setHoursPerWeek('20');
    };

    // Desktop stats calculation
    const stats = useMemo(() => {
        const total = teachers.length;
        const active = teachers.filter(t => t.status === 'Active').length;
        const noGroups = teachers.filter(t => !t.assignedCourses?.length).length;
        const totalStudents = teachers.reduce((sum, t) => sum + (t.students || 0), 0);
        return { total, active, noGroups, totalStudents };
    }, [teachers]);

    // Desktop Data Table columns
    const tableColumns = useMemo(() => [
        {
            key: 'name',
            title: "O'qituvchi",
            flex: 2,
            render: (value, item) => (
                <View style={styles.tableTeacherCell}>
                    <View style={[styles.tableAvatar, { backgroundColor: `${COLORS.primary}15` }]}>
                        {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={styles.tableAvatarImg} />
                        ) : (
                            <Text style={[styles.tableAvatarText, { color: COLORS.primary }]}>
                                {(item.name || 'T').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </Text>
                        )}
                    </View>
                    <View>
                        <Text style={[styles.tableTeacherName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.tableTeacherSpec, { color: theme.textSecondary }]}>{item.subject || 'Instruktor'}</Text>
                    </View>
                </View>
            )
        },
        {
            key: 'phone',
            title: 'Telefon',
            flex: 1.2,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{value || '-'}</Text>
            )
        },
        {
            key: 'status',
            title: 'Holat',
            flex: 0.9,
            render: (value) => {
                const status = TEACHER_STATUSES[value] || TEACHER_STATUSES['Active'];
                return (
                    <View style={[styles.statusBadgeTable, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusTextTable, { color: status.color }]}>{status.label}</Text>
                    </View>
                );
            }
        },
        {
            key: 'assignedCourses',
            title: 'Guruhlar',
            flex: 0.7,
            align: 'center',
            render: (value) => (
                <View style={[styles.countBadge, { backgroundColor: `${theme.primary}10` }]}>
                    <Feather name="layers" size={12} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 12 }}>{value?.length || 0}</Text>
                </View>
            )
        },
        {
            key: 'students',
            title: "O'quvchilar",
            flex: 0.8,
            align: 'center',
            render: (value) => (
                <Text style={{ color: theme.text, fontWeight: '600' }}>{value || 0}</Text>
            )
        },
        {
            key: 'weeklyHours',
            title: 'Soat/hafta',
            flex: 0.8,
            align: 'right',
            render: (value) => {
                const isOverloaded = (value || 0) > 40;
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.hoursText, isOverloaded && { color: COLORS.error }]}>
                            {value || 0}s
                        </Text>
                        {isOverloaded && <Feather name="alert-triangle" size={12} color={COLORS.error} />}
                    </View>
                );
            }
        },
    ], [theme, TEACHER_STATUSES]);

    // Row actions for desktop
    const renderRowActions = (item) => (
        <>
            <TouchableOpacity
                style={[styles.tableActionBtn, { backgroundColor: `${theme.primary}10` }]}
                onPress={() => navigation.navigate('TeacherDetail', { teacher: item })}
            >
                <Feather name="eye" size={14} color={theme.primary} />
            </TouchableOpacity>
        </>
    );

    const TeacherRow = ({ item }) => {
        const status = TEACHER_STATUSES[item.status] || TEACHER_STATUSES['Active'];
        const groupsCount = item.assignedCourses?.length || 0;
        const studentsCount = item.students || 0;
        const weeklyHours = item.weeklyHours || 0;
        const isOverloaded = weeklyHours > 40;

        return (
            <TouchableOpacity
                style={[styles.teacherRow, { backgroundColor: theme.surface }]}
                onPress={() => navigation.navigate('TeacherDetail', { teacher: item })}
            >
                <View style={[styles.avatarBox, { backgroundColor: COLORS.primary + '10' }]}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                    )}
                </View>

                <View style={styles.infoCol}>
                    <Text style={[styles.teacherName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={styles.teacherSub}>{item.subject || 'Instruktor'}</Text>

                    <View style={styles.statsMiniRow}>
                        <View style={styles.statMini}>
                            <Feather name="layers" size={12} color="#828282" />
                            <Text style={styles.statMiniText}>{groupsCount} guruh</Text>
                        </View>
                        <View style={styles.statMini}>
                            <Feather name="users" size={12} color="#828282" />
                            <Text style={styles.statMiniText}>{studentsCount} talaba</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>

                    <View style={styles.workloadBox}>
                        <Text style={[styles.hoursText, isOverloaded && { color: COLORS.error }]}>
                            {weeklyHours} s/hafta
                        </Text>
                        {isOverloaded && <Feather name="alert-triangle" size={12} color={COLORS.error} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <View style={styles.container}>
                {/* Premium Header with safe area */}
                <ScreenHeader
                    title="O'qituvchi"
                    subtitle="Instruktorlarni boshqarish"
                    showBack={true}
                    rightAction={
                        isDesktop ? (
                            <TouchableOpacity
                                style={styles.desktopAddButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.desktopAddButtonGradient}
                                >
                                    <Ionicons name="add" size={22} color="#fff" />
                                    <Text style={styles.desktopAddButtonText}>Yangi O'qituvchi</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.headerBtn, { backgroundColor: theme.surface }]}
                                onPress={() => {/* filter logic if any */ }}
                            >
                                <Ionicons name="filter-outline" size={22} color={theme.text} />
                            </TouchableOpacity>
                        )
                    }
                />

                {/* Search */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color="#BDBDBD" />
                        <TextInput
                            placeholder="Qidirish..."
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {[
                            { id: 'All', label: 'Barchasi' },
                            { id: 'Active', label: 'Faol' },
                            { id: 'NoGroups', label: 'Guruhsiz' },
                            { id: 'OnLeave', label: 'Ta’til' },
                            { id: 'Inactive', label: 'Faol emas' }
                        ].map(f => (
                            <TouchableOpacity
                                key={f.id}
                                style={[styles.filterChip, activeFilter === f.id && styles.activeFilterChip]}
                                onPress={() => setActiveFilter(f.id)}
                            >
                                <Text style={[styles.filterText, activeFilter === f.id && styles.activeFilterText]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List - Desktop vs Mobile */}
                {isDesktop ? (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 24 }}>
                        {/* Desktop Stats Cards */}
                        <View style={styles.desktopStatsRow}>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#667eea15' }]}>
                                    <Feather name="users" size={22} color="#667eea" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Jami o'qituvchilar</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#10B98115' }]}>
                                    <Feather name="check-circle" size={22} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.active}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Faol</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#F59E0B15' }]}>
                                    <Feather name="alert-circle" size={22} color="#F59E0B" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.noGroups}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Guruhsiz</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#8B5CF615' }]}>
                                    <Feather name="users" size={22} color="#8B5CF6" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalStudents}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Jami talabalar</Text>
                                </View>
                            </View>
                        </View>

                        {/* Desktop Data Table */}
                        <DesktopDataTable
                            columns={tableColumns}
                            data={filteredTeachers}
                            onRowPress={(item) => navigation.navigate('TeacherDetail', { teacher: item })}
                            rowActions={renderRowActions}
                            emptyMessage="O'qituvchilar topilmadi"
                        />
                    </ScrollView>
                ) : (
                    <FlatList
                        data={filteredTeachers}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <TeacherRow item={item} />}
                        contentContainerStyle={styles.listPadding}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Feather name="user-x" size={48} color="#E0E0E0" />
                                <Text style={styles.emptyText}>Ma'lumot topilmadi</Text>
                            </View>
                        }
                    />
                )}

                {/* FAB */}
                {!isDesktop && (
                    <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                )}

                {/* Add Teacher Modal */}
                <PremiumModal
                    visible={modalVisible}
                    onClose={closeModal}
                    title="Yangi O'qituvchi Qo'shish"
                    subtitle="Instruktor ma'lumotlarini kiriting"
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
                                onPress={handleAddTeacher}
                                style={{ flex: 1 }}
                                gradient={['#667eea', '#764ba2']}
                            />
                        </>
                    }
                >
                    <PremiumInput
                        label="F.I.SH *"
                        placeholder="Masalan: Ali Valiyev"
                        value={name}
                        onChangeText={setName}
                        icon="person-outline"
                    />

                    <PremiumInput
                        label="Mutaxassislik *"
                        placeholder="Masalan: Senior Frontend"
                        value={specialty}
                        onChangeText={setSpecialty}
                        icon="briefcase-outline"
                    />

                    <PremiumInput
                        label="Telefon raqami"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        icon="call-outline"
                    />

                    <PremiumInput
                        label="Haftalik dars soati"
                        placeholder="20"
                        value={hoursPerWeek}
                        onChangeText={setHoursPerWeek}
                        keyboardType="numeric"
                        icon="time-outline"
                    />

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>To'lov turi</Text>
                        <View style={styles.radioGroup}>
                            {['Fixed', 'Percentage'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.radioBtn, salaryType === type && styles.activeRadio]}
                                    onPress={() => setSalaryType(type)}
                                >
                                    <Text style={[styles.radioText, salaryType === type && styles.activeRadioText]}>
                                        {type === 'Fixed' ? 'Fiksirlangan' : 'Foizli'}
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
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
    backBtn: { marginRight: 15, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'white' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2022' },
    subtitle: { fontSize: 14, color: '#828282', marginTop: 4 },
    headerBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    searchSection: { paddingHorizontal: 20, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: 'white' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1F2022' },
    filterSection: { marginBottom: 20 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0' },
    activeFilterChip: { backgroundColor: '#1F2022', borderColor: '#1F2022' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#828282' },
    activeFilterText: { color: 'white' },
    listPadding: { paddingHorizontal: 20, paddingBottom: 130 },
    teacherRow: { flexDirection: 'row', padding: 16, borderRadius: 24, marginBottom: 15, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    avatarBox: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    infoCol: { flex: 1, marginLeft: 15 },
    teacherName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    teacherSub: { fontSize: 13, color: '#828282', marginBottom: 8 },
    statsMiniRow: { flexDirection: 'row', gap: 12 },
    statMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statMiniText: { fontSize: 11, color: '#828282' },
    rightCol: { alignItems: 'flex-end', gap: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    workloadBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    hoursText: { fontSize: 11, color: '#828282', fontWeight: '500' },
    fab: { position: 'absolute', bottom: 110, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    empty: { alignItems: 'center', marginTop: 100, gap: 15 },
    emptyText: { color: '#BDBDBD', fontSize: 16 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#828282', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    radioGroup: { flexDirection: 'row', gap: 12 },
    radioBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
    activeRadio: { backgroundColor: '#1F2022' },
    radioText: { color: '#828282', fontWeight: '600' },
    activeRadioText: { color: 'white' },
    modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 15 },
    backLink: { padding: 15 },
    backLinkText: { color: '#828282', fontWeight: '600' },
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
        borderRadius: 20,
        overflow: 'hidden',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeaderGradient: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBodyDesktop: {
        padding: 24,
    },
    desktopRow: {
        flexDirection: 'row',
        gap: 16,
    },
    desktopFooter: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    footerButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        overflow: 'hidden',
    },
    cancelButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
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
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 13,
        marginTop: 2,
    },
    // Table cell styles
    tableTeacherCell: {
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
        overflow: 'hidden',
    },
    tableAvatarImg: {
        width: 40,
        height: 40,
    },
    tableAvatarText: {
        fontSize: 14,
        fontWeight: '700',
    },
    tableTeacherName: {
        fontSize: 14,
        fontWeight: '600',
    },
    tableTeacherSpec: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadgeTable: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusTextTable: {
        fontSize: 11,
        fontWeight: '600',
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
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

export default TeachersScreen;

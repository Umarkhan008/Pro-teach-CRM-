import React, { useContext, useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    useWindowDimensions,
    ScrollView,
    Linking,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumModal from '../components/PremiumModal';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import ScreenHeader from '../components/ScreenHeader';

const getLeadStatuses = (t, isDarkMode) => ({
    'New': { label: t.statusNew, color: '#5865F2', bg: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' },
    'Contacted': { label: t.statusContacted, color: '#F2994A', bg: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8' },
    'Interested': { label: t.statusInterested, color: '#9B51E0', bg: isDarkMode ? 'rgba(155, 81, 224, 0.15)' : '#F5EBFF' },
    'Registered': { label: t.statusRegistered, color: '#27AE60', bg: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE' },
    'Lost': { label: t.statusLost, color: isDarkMode ? '#9CA3AF' : '#828282', bg: isDarkMode ? 'rgba(156, 163, 175, 0.15)' : '#F2F2F2' },
});

const LEAD_SOURCES = {
    'Telegram': { icon: 'paper-plane', color: '#0088cc', library: FontAwesome },
    'Website': { icon: 'globe-outline', color: '#5865F2', library: Ionicons },
    'Call': { icon: 'call-outline', color: '#27AE60', library: Ionicons },
    'Instagram': { icon: 'instagram', color: '#E1306C', library: FontAwesome },
};

const LeadsScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { leads, courses, addLead, deleteLead, addStudent, updateLead } = useContext(SchoolContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { showLoader, hideLoader } = useUI();
    const isDesktop = width >= 1280;

    const LEAD_STATUSES = useMemo(() => getLeadStatuses(t, isDarkMode), [t, isDarkMode]);

    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (route.params?.openAddModal) {
            setModalVisible(true);
            // Clear the param so it doesn't open again on re-render if not intended
            navigation.setParams({ openAddModal: undefined });
        }
    }, [route.params?.openAddModal]);

    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Add Lead Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [source, setSource] = useState('Call');
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.phone.includes(searchQuery);
            const matchesFilter = activeFilter === 'All' || lead.status === activeFilter;
            return matchesSearch && matchesFilter;
        }).sort((a, b) => {
            // Pin HIGH Priority (Custom logic: New leads first)
            if (a.status === 'New' && b.status !== 'New') return -1;
            if (a.status !== 'New' && b.status === 'New') return 1;
            return 0;
        });
    }, [leads, searchQuery, activeFilter]);

    const handleAddLead = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert(t.error, t.fillAllFields);
            return;
        }

        showLoader(t.saving || 'Lid saqlanmoqda...');
        try {
            await addLead({
                name,
                phone,
                source,
                interestedCourseId: selectedCourseId || null,
                courseName: courses.find(c => c.id === selectedCourseId)?.title || '',
                status: 'New',
                notes: []
            });
            setModalVisible(false);
            resetForm();
        } finally {
            hideLoader();
        }
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setSource('Call');
        setSelectedCourseId(null);
    };

    const handleStatusChange = async (leadId, newStatus) => {
        showLoader('Status yangilanmoqda...');
        try {
            await updateLead(leadId, { status: newStatus });
            if (detailModalVisible && selectedLead?.id === leadId) {
                setSelectedLead({ ...selectedLead, status: newStatus });
            }
        } finally {
            hideLoader();
        }
    };

    const handleConvertToStudent = async (lead) => {
        Alert.alert(
            t.convertToStudent,
            `${lead.name} ${t.convertToStudentMsg}`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.confirm,
                    onPress: async () => {
                        showLoader(t.saving || 'O\'tkazilmoqda...');
                        try {
                            const courseObj = courses.find(c => c.id === lead.interestedCourseId);
                            await addStudent({
                                name: lead.name,
                                phone: lead.phone,
                                assignedCourseId: lead.interestedCourseId || null,
                                course: courseObj ? courseObj.title : t.roomError,
                                status: 'Active',
                                balance: 0,
                                createdAt: new Date().toISOString()
                            });
                            await handleStatusChange(lead.id, 'Registered');
                            setDetailModalVisible(false);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return t.justNow;
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return t.justNow;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t.minutesAgo}`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t.hoursAgo}`;
        return `${Math.floor(diffInSeconds / 86400)} ${t.daysAgo}`;
    };

    const LeadRow = ({ item }) => {
        const initials = item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const status = LEAD_STATUSES[item.status] || LEAD_STATUSES['New'];
        const sourceInfo = LEAD_SOURCES[item.source] || LEAD_SOURCES['Call'];
        const SourceIcon = sourceInfo.library;

        return (
            <TouchableOpacity
                style={[styles.leadRow, { backgroundColor: theme.surface }]}
                onPress={() => {
                    setSelectedLead(item);
                    setDetailModalVisible(true);
                }}
            >
                <View style={[styles.avatarCircle, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.avatarText, { color: status.color }]}>{initials}</Text>
                </View>

                <View style={styles.leadInfo}>
                    <View style={styles.rowHeader}>
                        <Text style={[styles.leadName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                    </View>

                    <View style={styles.rowFooter}>
                        <View style={styles.sourceTag}>
                            <SourceIcon name={sourceInfo.icon} size={12} color={sourceInfo.color} />
                            <Text style={[styles.phoneText, { color: theme.textSecondary, marginLeft: 4 }]}>{item.phone}</Text>
                        </View>
                        <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.callShortcut}
                    onPress={() => Linking.openURL(`tel:${item.phone}`)}
                >
                    <Ionicons name="call" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const LeadDetailsModal = () => {
        if (!selectedLead) return null;
        const status = LEAD_STATUSES[selectedLead.status] || LEAD_STATUSES['New'];

        return (
            <PremiumModal
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                title={t.leadDetails}
                subtitle="Lid ma'lumotlari va statusi"
                headerGradient={['#667eea', '#764ba2']}
            >
                <View style={styles.detailProfile}>
                    <View style={[styles.largeAvatar, { backgroundColor: status.color + '15' }]}>
                        <Text style={[styles.largeAvatarText, { color: status.color }]}>
                            {selectedLead.name[0].toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.detailName, { color: theme.text }]}>{selectedLead.name}</Text>
                    <View style={[styles.statusBadgeLarge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusTextLarge, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${selectedLead.phone}`)}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F7EE' }]}>
                            <Ionicons name="call" size={22} color="#27AE60" />
                        </View>
                        <Text style={styles.actionLabel}>{t.sourceCall}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => Linking.openURL(`tg://resolve?domain=${selectedLead.phone.replace(/[^0-9]/g, '')}`)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' }]}>
                            <Ionicons name="paper-plane" size={22} color="#5865F2" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{t.sourceTelegram}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => {
                        Alert.alert(t.deleteStudent, t.deleteStudentConfirm, [
                            { text: t.cancel },
                            {
                                text: t.delete, onPress: async () => {
                                    await deleteLead(selectedLead.id);
                                    setDetailModalVisible(false);
                                }, style: 'destructive'
                            }
                        ]);
                    }}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
                            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                        </View>
                        <Text style={[styles.actionLabel, { color: COLORS.error }]}>{t.delete}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>{t.info}</Text>
                    <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoVal, { color: theme.text }]}>{selectedLead.phone}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="globe-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoVal, { color: theme.text }]}>{t.source}: {selectedLead.source || t.unknown}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="book-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoVal, { color: theme.text }]}>{t.courses}: {selectedLead.courseName || t.noActivities}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.convertSection}>
                    <Text style={styles.sectionHeading}>Statusni o'zgartirish</Text>
                    <View style={styles.statusGrid}>
                        {Object.keys(LEAD_STATUSES).map(sKey => (
                            <TouchableOpacity
                                key={sKey}
                                style={[
                                    styles.statusOption,
                                    selectedLead.status === sKey && { borderColor: LEAD_STATUSES[sKey].color, borderWidth: 1 }
                                ]}
                                onPress={() => handleStatusChange(selectedLead.id, sKey)}
                            >
                                <Text style={{ color: LEAD_STATUSES[sKey].color, fontSize: 12, fontWeight: '600' }}>
                                    {LEAD_STATUSES[sKey].label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <PremiumButton
                        title={t.convertToStudent}
                        icon="person-add"
                        onPress={() => handleConvertToStudent(selectedLead)}
                        style={{ marginTop: 24 }}
                        gradient={['#667eea', '#764ba2']}
                    />
                </View>
            </PremiumModal>
        );
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <View style={styles.container}>
                {/* Premium Header with safe area */}
                <ScreenHeader
                    title={t.leadsTitle}
                    subtitle={t.potentialStudents}
                    showBack={true}
                    rightAction={
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {isDesktop && (
                                <TouchableOpacity
                                    style={styles.desktopAddButton}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.desktopAddButtonGradient}
                                    >
                                        <Ionicons name="add" size={22} color="#fff" />
                                        <Text style={styles.desktopAddButtonText}>Yangi Lid</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.reportBtn, { backgroundColor: COLORS.purple }]}
                                onPress={() => Alert.alert("Hisobot", "Lidlar bo'yicha hisobot tez orada...")}
                            >
                                <Ionicons name="stats-chart" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    }
                />

                {/* Search & Filter Bar */}
                <View style={styles.searchBarContainer}>
                    <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
                        <Ionicons name="search" size={20} color="#BDBDBD" />
                        <TextInput
                            placeholder={`${t.search}...`}
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Status Filter Chips */}
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === 'All' && styles.filterChipActive]}
                            onPress={() => setActiveFilter('All')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'All' && styles.filterTextActive]}>{t.all}</Text>
                        </TouchableOpacity>
                        {Object.keys(LEAD_STATUSES).map(statusKey => (
                            <TouchableOpacity
                                key={statusKey}
                                style={[styles.filterChip, activeFilter === statusKey && styles.filterChipActive]}
                                onPress={() => setActiveFilter(statusKey)}
                            >
                                <Text style={[styles.filterText, activeFilter === statusKey && styles.filterTextActive]}>
                                    {LEAD_STATUSES[statusKey].label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Leads List */}
                <FlatList
                    data={filteredLeads}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <LeadRow item={item} />}
                    contentContainerStyle={styles.listContainer}

                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color="#E0E0E0" />
                            <Text style={styles.emptyText}>{t.noActivities}</Text>
                        </View>
                    }
                />

                {/* Floating Add Button */}
                {!isDesktop && (
                    <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                )}

                {/* Modals */}
                <LeadDetailsModal />

                <PremiumModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    title="Yangi Lid Qo'shish"
                    subtitle="Potensial mijoz ma'lumotlarini kiriting"
                    headerGradient={['#667eea', '#764ba2']}
                    footer={
                        <>
                            <PremiumButton
                                title="Bekor qilish"
                                type="outline"
                                onPress={() => setModalVisible(false)}
                                style={{ flex: 1 }}
                            />
                            <PremiumButton
                                title="Saqlash"
                                onPress={handleAddLead}
                                style={{ flex: 1 }}
                                gradient={['#667eea', '#764ba2']}
                            />
                        </>
                    }
                >
                    <PremiumInput
                        label={t.fullName + " *"}
                        placeholder="Alisher Navoiy"
                        value={name}
                        onChangeText={setName}
                        icon="person-outline"
                    />

                    <PremiumInput
                        label={t.phoneNumber + " *"}
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        icon="call-outline"
                    />

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Murojaat manbasi</Text>
                        <View style={styles.sourceGrid}>
                            {Object.keys(LEAD_SOURCES).map(sKey => (
                                <TouchableOpacity
                                    key={sKey}
                                    style={[styles.sourceChip, { backgroundColor: theme.surface, borderColor: theme.border }, source === sKey && styles.sourceChipActive]}
                                    onPress={() => setSource(sKey)}
                                >
                                    <Text style={[styles.sourceText, { color: theme.textSecondary }, source === sKey && styles.sourceTextActive]}>{sKey}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Qiziqqan kursi</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60 }}>
                            {courses.map(course => (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[styles.courseChip, { backgroundColor: theme.surface, borderColor: theme.border }, selectedCourseId === course.id && [styles.courseChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]]}
                                    onPress={() => setSelectedCourseId(course.id)}
                                >
                                    <Text style={[styles.courseChipText, { color: theme.textSecondary }, selectedCourseId === course.id && styles.courseChipTextActive]}>
                                        {course.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </PremiumModal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        elevation: 2
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2022'
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#828282',
        marginTop: 4
    },
    filterBtn: {
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
    searchBarContainer: {
        paddingHorizontal: 20,
        marginBottom: 15
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1F2022'
    },
    filterScroll: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        gap: 10
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    filterChipActive: {
        backgroundColor: '#1F2022',
        borderColor: '#1F2022'
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#828282'
    },
    filterTextActive: {
        color: 'white'
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 130
    },
    leadRow: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    leadInfo: {
        flex: 1,
        marginLeft: 12
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    leadName: {
        fontSize: 16,
        fontWeight: '700',
        maxWidth: '65%'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    rowFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    sourceTag: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    phoneText: {
        fontSize: 13
    },
    timeText: {
        fontSize: 11,
        color: '#BDBDBD'
    },
    callShortcut: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60
    },
    emptyText: {
        fontSize: 16,
        color: '#BDBDBD',
        marginTop: 15
    },
    // Unified Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 25, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#828282', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    detailProfile: { alignItems: 'center', marginBottom: 30 },
    largeAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    largeAvatarText: { fontSize: 32, fontWeight: 'bold' },
    detailName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    statusBadgeLarge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
    statusTextLarge: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    actionBtn: { alignItems: 'center' },
    actionIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 12, color: '#828282', fontWeight: '500' },
    infoSection: { marginBottom: 30 },
    sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#1F2022', marginBottom: 15 },
    infoCard: { padding: 20, borderRadius: 24, gap: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoVal: { fontSize: 15, fontWeight: '500' },
    convertSection: { marginBottom: 40 },
    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statusOption: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#F0F0F0', minWidth: '30%', alignItems: 'center' },
    sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    sourceChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F2' },
    sourceChipActive: { backgroundColor: '#1F2022' },
    sourceText: { color: '#828282', fontWeight: '500' },
    sourceTextActive: { color: 'white' },
    courseChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F2', marginRight: 10 },
    courseChipActive: { backgroundColor: COLORS.primary },
    courseChipText: { color: '#828282', fontWeight: '500' },
    courseChipTextActive: { color: 'white' },
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
    modalHeaderSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActionContainer: {
        flexDirection: 'row',
        gap: 12,
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
    reportBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default LeadsScreen;

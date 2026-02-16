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
    useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScreenHeader from '../components/ScreenHeader';
import PremiumModal from '../components/PremiumModal';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import DesktopDataTable from '../components/DesktopDataTable';

const getStatusConfig = (isDarkMode) => ({
    'Live': { label: 'Active', color: '#27AE60', bg: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE', icon: 'radio-outline' },
    'Upcoming': { label: 'Kutilmoqda', color: '#5865F2', bg: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF', icon: 'time-outline' },
    'Completed': { label: 'Tugagan', color: isDarkMode ? '#9CA3AF' : '#828282', bg: isDarkMode ? 'rgba(156, 163, 175, 0.15)' : '#F2F2F2', icon: 'checkmark-circle-outline' },
    'Paused': { label: 'To‘xtatilgan', color: '#F2994A', bg: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8', icon: 'pause-circle-outline' },
});

const GroupsScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, teachers, subjects, rooms, addCourse, updateCourse, deleteCourse } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const isDesktop = width >= 1280;

    const STATUS_CONFIG = useMemo(() => getStatusConfig(isDarkMode), [isDarkMode]);

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: '',
        instructorId: null,
        roomId: null,
        days: [],
        daysType: 'DCHJ',
        startTime: '',
        endTime: '',
        price: '',
        startDate: new Date(),
        status: 'Upcoming'
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- Helpers ---
    const getCalculatedStatus = (course) => {
        if (course.status === 'Paused') return 'Paused';
        const now = new Date();
        const start = course.startDate ? new Date(course.startDate) : null;
        if (start && start > now) return 'Upcoming';
        return 'Live';
    };

    const filteredGroups = useMemo(() => {
        return courses.map(c => ({ ...c, derivedStatus: getCalculatedStatus(c) })).filter(group => {
            const matchesSearch = group.title.toLowerCase().includes(search.toLowerCase()) ||
                (group.instructor || '').toLowerCase().includes(search.toLowerCase());

            let matchesFilter = true;
            if (activeFilter !== 'All') {
                matchesFilter = group.derivedStatus === activeFilter;
            }
            return matchesSearch && matchesFilter;
        }).sort((a, b) => {
            if (a.students === 0 && b.students > 0) return -1;
            return 0;
        });
    }, [courses, search, activeFilter]);


    const handleSaveGroup = async () => {
        if (!form.title || !form.instructorId || !form.price) {
            Alert.alert('Xatolik', 'Asosiy ma\'lumotlarni kiriting');
            return;
        }

        const teacher = teachers.find(t => t.id === form.instructorId);
        const room = rooms.find(r => r.id === form.roomId);

        // Format Time & Days
        let daysStr = form.daysType;
        if (form.daysType === 'Custom') daysStr = form.days.join(', ');
        const timeStr = form.endTime ? `${form.startTime} - ${form.endTime}` : form.startTime;

        const groupData = {
            title: form.title,
            instructor: teacher?.name || 'Admin',
            instructorId: form.instructorId,
            room: room?.name || 'Xona belgilanmagan',
            roomId: form.roomId,
            price: form.price,
            days: daysStr,
            time: timeStr,
            startDate: form.startDate.toISOString(),
            status: isEditing ? (courses.find(c => c.id === editingId)?.status || 'Live') : 'Live',
            students: isEditing ? (courses.find(c => c.id === editingId)?.students || 0) : 0,
            icon: 'people',
            color: COLORS.primary
        };

        showLoader('Saqlanmoqda...');
        if (isEditing) {
            await updateCourse(editingId, groupData);
        } else {
            await addCourse(groupData);
        }
        hideLoader();
        closeModal();
    };

    const handleEditGroup = (item) => {
        setIsEditing(true);
        setEditingId(item.id);

        // Split time
        let st = '', et = '';
        if (item.time && item.time.includes('-')) {
            const parts = item.time.split('-');
            st = parts[0].trim();
            et = parts[1].trim();
        } else {
            st = item.time || '';
        }

        setForm({
            title: item.title,
            instructorId: item.instructorId,
            daysType: ['DCHJ', 'SPSH', 'Har kuni'].includes(item.days) ? item.days : 'Custom', // Simplify for demo
            days: [],
            startTime: st,
            endTime: et,
            price: item.price,
            roomId: item.roomId || null,
            startDate: item.startDate ? new Date(item.startDate) : new Date(),
            status: item.status
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setEditingId(null);
        setStep(1);
        setForm({
            title: '',
            instructorId: null,
            roomId: null,
            days: [],
            daysType: 'DCHJ',
            startTime: '',
            endTime: '',
            price: '',
            startDate: new Date(),
            status: 'Upcoming'
        });
    };

    // Desktop stats calculation
    const stats = useMemo(() => {
        const total = courses.length;
        const live = courses.filter(c => getCalculatedStatus(c) === 'Live').length;
        const upcoming = courses.filter(c => getCalculatedStatus(c) === 'Upcoming').length;
        const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0);
        const emptyGroups = courses.filter(c => !c.students || c.students === 0).length;
        return { total, live, upcoming, totalStudents, emptyGroups };
    }, [courses]);

    // Format price helper
    const formatPriceShort = (price) => {
        if (!price) return '-';
        const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d]/g, '')) : price;
        if (isNaN(numPrice)) return price;
        if (numPrice >= 1000000) return `${(numPrice / 1000000).toFixed(1)}M`;
        if (numPrice >= 1000) return `${Math.round(numPrice / 1000)}K`;
        return numPrice.toString();
    };

    // Desktop Data Table columns
    const tableColumns = useMemo(() => [
        {
            key: 'title',
            title: 'Guruh nomi',
            flex: 1.8,
            render: (value, item) => (
                <View>
                    <Text style={[styles.tableGroupName, { color: theme.text }]}>{value}</Text>
                    <Text style={[styles.tableInstructor, { color: theme.textSecondary }]}>
                        {item.instructor || "O'qituvchi yo'q"}
                    </Text>
                </View>
            )
        },
        {
            key: 'days',
            title: 'Kunlar',
            flex: 0.8,
            render: (value) => (
                <View style={[styles.daysBadge, { backgroundColor: `${theme.primary}10` }]}>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>{value || '-'}</Text>
                </View>
            )
        },
        {
            key: 'time',
            title: 'Vaqt',
            flex: 0.9,
            render: (value) => (
                <Text style={{ color: theme.text, fontSize: 13 }}>{value || '-'}</Text>
            )
        },
        {
            key: 'room',
            title: 'Xona',
            flex: 0.7,
            render: (value) => (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{value || '-'}</Text>
            )
        },
        {
            key: 'derivedStatus',
            title: 'Holat',
            flex: 0.8,
            render: (value) => {
                const config = STATUS_CONFIG[value] || STATUS_CONFIG['Live'];
                return (
                    <View style={[styles.statusBadgeTable, { backgroundColor: isDarkMode ? `${config.color}20` : config.bg }]}>
                        <View style={[styles.statusDotTable, { backgroundColor: config.color }]} />
                        <Text style={[styles.statusTextTable, { color: config.color }]}>{config.label}</Text>
                    </View>
                );
            }
        },
        {
            key: 'students',
            title: "O'quvchilar",
            flex: 0.7,
            align: 'center',
            render: (value, item) => {
                const isEmpty = !value || value === 0;
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="people" size={14} color={isEmpty ? COLORS.error : theme.primary} />
                        <Text style={{ color: isEmpty ? COLORS.error : theme.text, fontWeight: '600' }}>
                            {value || 0}
                        </Text>
                    </View>
                );
            }
        },
        {
            key: 'price',
            title: 'Narx',
            flex: 0.7,
            align: 'right',
            render: (value) => (
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>
                    {formatPriceShort(value)}
                </Text>
            )
        },
    ], [theme, STATUS_CONFIG, isDarkMode]);

    // Row actions for desktop
    const renderRowActions = (item) => (
        <>
            <TouchableOpacity
                style={[styles.tableActionBtn, { backgroundColor: `${theme.primary}10` }]}
                onPress={() => handleEditGroup(item)}
            >
                <Feather name="edit-2" size={14} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tableActionBtn, { backgroundColor: '#10B98110' }]}
                onPress={() => navigation.navigate('CourseDetail', { course: item })}
            >
                <Feather name="eye" size={14} color="#10B981" />
            </TouchableOpacity>
        </>
    );

    const StatusBadge = ({ status }) => {
        const { isDarkMode } = useContext(ThemeContext);
        const config = STATUS_CONFIG[status] || STATUS_CONFIG['Live'];

        const badgeBg = isDarkMode ? `${config.color}20` : config.bg;

        return (
            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        );
    };

    const GroupRow = ({ item }) => {
        const isEmpty = !item.students || item.students === 0;

        return (
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={styles.cardInstructor}>{item.instructor || 'O\'qituvchi yo\'q'}</Text>
                    </View>
                    <StatusBadge status={item.derivedStatus} />

                    <TouchableOpacity onPress={() => handleEditGroup(item)} style={styles.editIconBtn}>
                        <Feather name="edit-2" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={14} color={theme.textLight} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.days}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="clock" size={14} color={theme.textLight} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.time}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={14} color={theme.textLight} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.room || 'No room'}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <View style={styles.studentInfo}>
                        <Ionicons name="people" size={16} color={isEmpty ? COLORS.error : COLORS.primary} />
                        <Text style={[styles.studentCount, { color: isEmpty ? COLORS.error : theme.text }]}>
                            {isEmpty ? '0 ta talaba' : `${item.students} ta talaba`}
                        </Text>
                        {isEmpty && (
                            <View style={[styles.warningBadge, { backgroundColor: COLORS.error + '15' }]}>
                                <Text style={{ fontSize: 10, color: COLORS.error, fontWeight: 'bold' }}>To'ldirish kk</Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.priceTag, { color: theme.text }]}>{item.price}</Text>

                    <TouchableOpacity
                        style={[styles.arrowBtn, { backgroundColor: isDarkMode ? theme.surfaceLight : theme.background }]}
                        onPress={() => navigation.navigate('CourseDetail', { course: item })}
                    >
                        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStepContent = () => {
        // Helper to format price nicely
        const formatPrice = (price) => {
            if (!price) return '';
            const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d]/g, '')) : price;
            if (isNaN(numPrice)) return price;
            return numPrice.toLocaleString('uz-UZ') + " so'm";
        };

        switch (step) {
            case 1:
                return (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.stepScrollContent}
                    >
                        {/* Section Title */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Yo'nalishni tanlang</Text>
                            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Guruh uchun kurs turini belgilang</Text>
                        </View>

                        {/* Course Cards */}
                        <View style={styles.courseCardsContainer}>
                            {subjects.map((sub, index) => {
                                const isSelected = form.title === sub.title;
                                const courseIcons = ['book-outline', 'color-palette-outline', 'code-slash-outline', 'laptop-outline', 'globe-outline', 'bulb-outline'];
                                const iconName = courseIcons[index % courseIcons.length];

                                return (
                                    <TouchableOpacity
                                        key={sub.id}
                                        style={[
                                            styles.courseCard,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                            isSelected && { borderColor: theme.primary, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
                                        ]}
                                        onPress={() => setForm({ ...form, title: sub.title, price: sub.price })}
                                        activeOpacity={0.7}
                                    >
                                        {/* Left Icon */}
                                        <View style={[
                                            styles.courseCardIcon,
                                            { backgroundColor: isSelected ? theme.primary : (isDarkMode ? '#333' : '#F3F4F6') }
                                        ]}>
                                            <Ionicons
                                                name={iconName}
                                                size={22}
                                                color={isSelected ? '#FFFFFF' : theme.textSecondary}
                                            />
                                        </View>

                                        {/* Course Info */}
                                        <View style={styles.courseCardContent}>
                                            <Text style={[
                                                styles.courseCardTitle,
                                                { color: theme.text },
                                                isSelected && { color: theme.primary, fontWeight: '700' }
                                            ]}>
                                                {sub.title}
                                            </Text>
                                            <Text style={[
                                                styles.courseCardPrice,
                                                { color: theme.textSecondary }
                                            ]}>
                                                {formatPrice(sub.price)} / oy
                                            </Text>
                                        </View>

                                        {/* Selection indicator */}
                                        <View style={[
                                            styles.courseCardCheck,
                                            { borderColor: isDarkMode ? '#555' : '#E5E7EB' },
                                            isSelected && { borderColor: theme.primary, backgroundColor: theme.primary }
                                        ]}>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Custom input option */}
                        <View style={styles.customInputSection}>
                            <View style={styles.dividerContainer}>
                                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                                <Text style={[styles.dividerText, { color: theme.textLight }]}>yoki</Text>
                                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                            </View>

                            <PremiumInput
                                label="O'z kursingizni kiriting"
                                placeholder="Masalan: Web Development"
                                value={subjects.some(s => s.title === form.title) ? '' : form.title}
                                onChangeText={t => setForm({ ...form, title: t, price: '' })}
                                icon="create-outline"
                            />
                        </View>

                        {/* Continue Button */}
                        <PremiumButton
                            title="Davom etish"
                            onPress={() => setStep(2)}
                            disabled={!form.title}
                            icon="arrow-forward"
                            style={{ marginTop: 10 }}
                        />
                    </ScrollView>
                );
            case 2:
                return (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.stepScrollContent}
                    >
                        {/* Section Title */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>O'qituvchi va boshlanish sanasi</Text>
                            <Text style={styles.sectionSubtitle}>Guruhni kim o'tadi va darslar qachon boshlanadi?</Text>
                        </View>

                        {/* Teacher Selection */}
                        <Text style={styles.inputLabelPremium}>O'qituvchini tanlang</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.teacherScroll}
                            contentContainerStyle={styles.teacherScrollContent}
                        >
                            {teachers.map(t => {
                                const isSelected = form.instructorId === t.id;
                                const initials = t.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[
                                            styles.teacherCard,
                                            { backgroundColor: theme.surface },
                                            isSelected && styles.teacherCardActive
                                        ]}
                                        onPress={() => setForm({ ...form, instructorId: t.id })}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.teacherAvatar,
                                            { backgroundColor: isSelected ? '#FFFFFF40' : COLORS.primary + '15' }
                                        ]}>
                                            <Text style={[
                                                styles.teacherAvatarText,
                                                { color: isSelected ? '#FFFFFF' : COLORS.primary }
                                            ]}>{initials}</Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.teacherName,
                                                { color: theme.text },
                                                isSelected && styles.teacherNameActive
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {t.name.split(' ')[0]}
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.teacherCheck}>
                                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Date Selection */}
                        <View style={styles.dateSection}>
                            <Text style={styles.inputLabelPremium}>Kurs boshlanish sanasi</Text>
                            <TouchableOpacity
                                style={[styles.premiumDateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.dateIconWrapper}>
                                    <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                                </View>
                                <View style={styles.dateInfoWrapper}>
                                    <Text style={[styles.dateValueText, { color: theme.primary }]}>
                                        {form.startDate.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                    <Text style={[styles.dateLabelSub, { color: theme.textSecondary }]}>Ushbu sanadan darslar boshlanadi</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={form.startDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setForm({ ...form, startDate: date });
                                }}
                            />
                        )}

                        {/* Navigation Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.backBtnPremium, { borderColor: theme.border }]}
                                onPress={() => setStep(1)}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="chevron-back" size={20} color="#6B7280" />
                                <Text style={styles.backBtnTextPremium}>Orqaga</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.continueBtnSmall,
                                    !form.instructorId && styles.continueBtnDisabled
                                ]}
                                disabled={!form.instructorId}
                                onPress={() => setStep(3)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueBtnText}>Davom etish</Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                );
            case 3:
                return (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.stepScrollContent}
                    >
                        {/* Section Title */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Jadval va narx</Text>
                            <Text style={styles.sectionSubtitle}>Dars kunlari, vaqti va to'lov miqdorini belgilang</Text>
                        </View>

                        {/* Days Selection */}
                        <Text style={styles.inputLabelPremium}>Dars kunlari</Text>
                        <View style={styles.daysGridPremium}>
                            {[
                                { id: 'DCHJ', label: 'Toq kunlar', sub: 'Du, Chor, Jum' },
                                { id: 'SPSH', label: 'Juft kunlar', sub: 'Se, Pay, Sha' },
                                { id: 'Har kuni', label: 'Har kuni', sub: 'Dam olishsiz' }
                            ].map(d => {
                                const isSelected = form.daysType === d.id;
                                return (
                                    <TouchableOpacity
                                        key={d.id}
                                        style={[
                                            styles.dayCard,
                                            { backgroundColor: theme.surface },
                                            isSelected && [styles.dayCardActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                                        ]}
                                        onPress={() => setForm({ ...form, daysType: d.id })}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.dayCardLabel,
                                            { color: theme.text },
                                            isSelected && { color: '#FFFFFF' }
                                        ]}>{d.label}</Text>
                                        <Text style={[
                                            styles.dayCardSub,
                                            { color: theme.textSecondary },
                                            isSelected && { color: '#FFFFFFE0' }
                                        ]}>{d.sub}</Text>
                                        <View style={[
                                            styles.dayCardRadio,
                                            isSelected && styles.dayCardRadioActive
                                        ]}>
                                            {isSelected && <View style={styles.dayCardRadioInner} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Time Selection */}
                        <View style={styles.timeSection}>
                            <Text style={styles.inputLabelPremium}>Dars vaqti</Text>
                            <View style={styles.timeRow}>
                                <View style={styles.timeInputWrapper}>
                                    <Ionicons name="time-outline" size={18} color="#9CA3AF" style={styles.timeIcon} />
                                    <TextInput
                                        style={[styles.premiumSmallInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="14:00"
                                        placeholderTextColor="#9CA3AF"
                                        value={form.startTime}
                                        onChangeText={t => setForm({ ...form, startTime: t })}
                                    />
                                </View>
                                <View style={styles.timeDivider}>
                                    <View style={styles.timeLine} />
                                </View>
                                <View style={styles.timeInputWrapper}>
                                    <Ionicons name="time-outline" size={18} color="#9CA3AF" style={styles.timeIcon} />
                                    <TextInput
                                        style={[styles.premiumSmallInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="16:00"
                                        placeholderTextColor="#9CA3AF"
                                        value={form.endTime}
                                        onChangeText={t => setForm({ ...form, endTime: t })}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Room Selection */}
                        <View style={styles.timeSection}>
                            <Text style={styles.inputLabelPremium}>Xona (Kreditiv)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomScroll}>
                                {rooms.map(r => (
                                    <TouchableOpacity
                                        key={r.id}
                                        style={[
                                            styles.roomChip,
                                            { backgroundColor: theme.background, borderColor: theme.border },
                                            form.roomId === r.id && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                                        ]}
                                        onPress={() => setForm({ ...form, roomId: r.id })}
                                    >
                                        <Text style={[styles.roomChipText, { color: theme.textSecondary }, form.roomId === r.id && { color: theme.primary }]}>{r.name}</Text>
                                    </TouchableOpacity>
                                ))}
                                {rooms.length === 0 && (
                                    <TouchableOpacity style={[styles.roomChip, { borderStyle: 'dashed' }]} onPress={() => { closeModal(); navigation.navigate('Rooms'); }}>
                                        <Text style={{ color: theme.textLight }}>+ Xona qo'shish</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>

                        {/* Price Input */}
                        <View style={styles.priceInputSection}>
                            <Text style={styles.inputLabelPremium}>Oylik to'lov narxi</Text>
                            <View style={[styles.premiumPriceInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.currencyLabel, { color: theme.textSecondary }]}>UZS</Text>
                                <TextInput
                                    style={[styles.priceInputText, { color: theme.text }]}
                                    placeholder="500,000"
                                    placeholderTextColor={theme.textLight}
                                    value={form.price}
                                    onChangeText={t => setForm({ ...form, price: t })}
                                    keyboardType="numeric"
                                />
                                <View style={[styles.priceIconBg, { backgroundColor: theme.primary + '20' }]}>
                                    <Ionicons name="cash-outline" size={20} color={theme.primary} />
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.backBtnPremium, { borderColor: theme.border }]}
                                onPress={() => setStep(2)}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="chevron-back" size={20} color="#6B7280" />
                                <Text style={styles.backBtnTextPremium}>Orqaga</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.submitBtnPremium,
                                    (!form.startTime || !form.price) && styles.continueBtnDisabled
                                ]}
                                disabled={!form.startTime || !form.price}
                                onPress={handleSaveGroup}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.submitBtnTextPremium}>
                                    {isEditing ? 'Saqlash' : 'Guruhni ochish'}
                                </Text>
                                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                );
            default: return null;
        }
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <View style={styles.container}>
                {/* Premium Header with safe area */}
                <ScreenHeader
                    title="Guruhlar"
                    subtitle="Barcha guruhlar ro'yxati"
                    rightAction={
                        isDesktop ? (
                            <TouchableOpacity
                                style={styles.desktopAddButton}
                                onPress={() => { setStep(1); setModalVisible(true); }}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.desktopAddButtonGradient}
                                >
                                    <Ionicons name="add" size={22} color="#fff" />
                                    <Text style={styles.desktopAddButtonText}>Yangi Guruh</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.filterIconBtn, { backgroundColor: theme.surface }]}
                                onPress={() => {/* filter logic if any */ }}
                            >
                                <Ionicons name="filter" size={22} color={theme.text} />
                            </TouchableOpacity>
                        )
                    }
                />

                {/* Filters */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {['All', 'Live', 'Upcoming', 'Completed', 'Paused'].map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: theme.surface, borderColor: theme.border },
                                    activeFilter === f && [styles.activeFilterChip, { backgroundColor: theme.text, borderColor: theme.text }]
                                ]}
                                onPress={() => setActiveFilter(f)}
                            >
                                <Text style={[styles.filterText, { color: theme.textSecondary }, activeFilter === f && { color: theme.surface }]}>
                                    {f === 'All' ? 'Barchasi' : STATUS_CONFIG[f]?.label || f}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="search" size={20} color={theme.textLight} />
                        <TextInput
                            placeholder="Guruh yoki o'qituvchini qidirish..."
                            placeholderTextColor={theme.textLight}
                            style={[styles.searchInput, { color: theme.text }]}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Groups List - Desktop vs Mobile */}
                {isDesktop ? (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 24 }}>
                        {/* Desktop Stats Cards */}
                        <View style={styles.desktopStatsRow}>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#667eea15' }]}>
                                    <Feather name="layers" size={22} color="#667eea" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Jami guruhlar</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#10B98115' }]}>
                                    <Ionicons name="radio" size={22} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.live}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Faol</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#3B82F615' }]}>
                                    <Feather name="clock" size={22} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.upcoming}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Kutilmoqda</Text>
                                </View>
                            </View>
                            <View style={[styles.desktopStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconBox, { backgroundColor: '#8B5CF615' }]}>
                                    <Ionicons name="people" size={22} color="#8B5CF6" />
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
                            data={filteredGroups.map(g => ({ ...g, derivedStatus: getCalculatedStatus(g) }))}
                            onRowPress={(item) => navigation.navigate('CourseDetail', { course: item })}
                            rowActions={renderRowActions}
                            emptyMessage="Guruhlar topilmadi"
                        />
                    </ScrollView>
                ) : (
                    <FlatList
                        data={filteredGroups}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <GroupRow item={item} />}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1, minHeight: 0 }}
                        showsVerticalScrollIndicator={true}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Feather name="layers" size={48} color={theme.border} />
                                <Text style={[styles.emptyText, { color: theme.textLight }]}>Guruhlar topilmadi</Text>
                            </View>
                        }
                    />
                )}

                {/* FAB */}
                {!isDesktop && (
                    <TouchableOpacity style={styles.fab} onPress={() => { setStep(1); setModalVisible(true); }}>
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                )}

                <PremiumModal
                    visible={modalVisible}
                    onClose={closeModal}
                    title={isEditing ? 'Guruhni Tahrirlash' : 'Yangi Guruh Qo\'shish'}
                    subtitle={step === 1 ? "Yo'nalishni tanlang" : (step === 2 ? "O'qituvchi va sana" : "Jadval va narx")}
                    headerGradient={['#667eea', '#764ba2']}
                >
                    {renderStepContent()}
                </PremiumModal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 15 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2022' },
    subtitle: { fontSize: 14, color: '#828282', marginTop: 4 },
    headerActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

    filterContainer: { marginBottom: 15 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0' },
    activeFilterChip: { backgroundColor: '#1F2022', borderColor: '#1F2022' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#828282' },
    activeFilterText: { color: 'white' },

    searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

    listContent: { paddingHorizontal: 20, paddingBottom: 130 },

    // Card Styles
    card: { borderRadius: 24, marginBottom: 16, padding: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    cardInstructor: { fontSize: 13, color: '#828282', fontWeight: '500' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    editIconBtn: { padding: 5, marginLeft: 8 },

    cardBody: { flexDirection: 'row', gap: 20, marginBottom: 18 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13, fontWeight: '500' },
    roomScroll: { flexDirection: 'row', marginTop: 5 },
    roomChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginRight: 10 },
    roomChipText: { fontSize: 13, fontWeight: '600' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 15 },
    studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    studentCount: { fontSize: 13, fontWeight: '600' },
    warningBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
    // Desktop Modal Styles
    modalOverlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalDesktopContainer: {
        width: '100%',
        maxWidth: 800,
    },
    modalContentDesktop: {
        borderRadius: 24,
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%',
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
        gap: 15,
        alignItems: 'center',
    },
    desktopStepIndicator: {
        flexDirection: 'row',
        gap: 8,
    },
    miniStep: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniStepActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    miniStepDone: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderColor: 'rgba(255,255,255,0.3)',
    },
    miniStepText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)',
    },
    modalBodyDesktop: {
        paddingTop: 10,
    },
    filterIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
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
    priceTag: { fontSize: 15, fontWeight: 'bold' },
    arrowBtn: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

    emptyState: { alignItems: 'center', marginTop: 80, gap: 15 },
    emptyText: { color: '#BDBDBD', fontSize: 16 },

    fab: { position: 'absolute', bottom: 110, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },

    // Modal - Premium Bottom Sheet
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 34,
        maxHeight: '92%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20
    },
    dragIndicatorContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8
    },
    dragIndicator: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 8,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 4
    },
    modalTitleSection: {
        flex: 1
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10
    },
    stepIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepIndicatorItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
    },
    stepDotCompleted: {
        backgroundColor: '#10B981'
    },
    stepDotText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF'
    },
    stepDotTextActive: {
        color: '#FFFFFF'
    },
    stepLine: {
        width: 24,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4
    },
    stepLineCompleted: {
        backgroundColor: '#10B981'
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6'
    },

    // Step Content
    stepScrollContent: {
        paddingTop: 20,
        paddingBottom: 20
    },
    sectionHeader: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280'
    },

    // Course Cards
    courseCardsContainer: {
        gap: 12
    },
    courseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Removed heavy shadow for a flatter look
    },
    courseCardIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    courseCardContent: {
        flex: 1,
        marginLeft: 14
    },
    courseCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2
    },
    courseCardPrice: {
        fontSize: 13,
        fontWeight: '500'
    },
    courseCardCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Custom Input Section
    customInputSection: {
        marginTop: 24
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB'
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500'
    },
    customInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 10
    },
    customInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16
    },
    customInputIcon: {
        marginRight: 12
    },
    customInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500'
    },

    // Continue Button
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        marginTop: 28,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6
    },
    continueBtnDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },

    // Navigation & Layout
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 32
    },
    backBtnPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        backgroundColor: '#FCFCFC'
    },
    backBtnTextPremium: {
        marginLeft: 4,
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280'
    },
    continueBtnSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6
    },
    submitBtnPremium: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        height: 56,
        borderRadius: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6
    },
    submitBtnTextPremium: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },

    // Step 2 Styles
    inputLabelPremium: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 14,
        marginLeft: 4
    },
    teacherScroll: {
        marginHorizontal: -24,
        marginBottom: 24
    },
    teacherScrollContent: {
        paddingHorizontal: 24,
        gap: 12
    },
    teacherCard: {
        width: 100,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8
    },
    teacherCardActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    teacherAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    teacherAvatarText: {
        fontSize: 16,
        fontWeight: '700'
    },
    teacherName: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center'
    },
    teacherNameActive: {
        color: '#FFFFFF'
    },
    teacherCheck: {
        position: 'absolute',
        top: 8,
        right: 8
    },
    dateSection: {
        marginTop: 10
    },
    premiumDateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8
    },
    dateIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center'
    },
    dateInfoWrapper: {
        flex: 1,
        marginLeft: 14
    },
    dateValueText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2
    },
    dateLabelSub: {
        fontSize: 12,
        color: '#9CA3AF'
    },

    // Step 3 Styles
    daysGridPremium: {
        gap: 12,
        marginBottom: 24
    },
    dayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F3F4F6'
    },
    dayCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '08'
    },
    dayCardLabel: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1
    },
    dayCardLabelActive: {
        color: COLORS.primary
    },
    dayCardSub: {
        fontSize: 13,
        color: '#9CA3AF',
        marginRight: 12
    },
    dayCardSubActive: {
        color: COLORS.primary + 'A0'
    },
    dayCardRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center'
    },
    dayCardRadioActive: {
        borderColor: COLORS.primary
    },
    dayCardRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary
    },
    timeSection: {
        marginBottom: 24
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    timeInputWrapper: {
        flex: 1,
        position: 'relative'
    },
    timeIcon: {
        position: 'absolute',
        left: 16,
        top: 18,
        zIndex: 1
    },
    premiumSmallInput: {
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingLeft: 44,
        paddingRight: 16,
        fontSize: 16,
        fontWeight: '600'
    },
    timeDivider: {
        width: 16,
        alignItems: 'center'
    },
    timeLine: {
        width: 12,
        height: 2,
        backgroundColor: '#E5E7EB'
    },
    priceInputSection: {
        marginBottom: 10
    },
    premiumPriceInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 64,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 20
    },
    currencyLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#9CA3AF',
        marginRight: 12
    },
    priceInputText: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700'
    },
    priceIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Legacy styles for other steps
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#828282', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    disabledBtn: { backgroundColor: '#E0E0E0' },
    backBtn: { width: 80, height: 58, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { color: '#828282', fontWeight: '600' },
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
    tableGroupName: {
        fontSize: 14,
        fontWeight: '600',
    },
    tableInstructor: {
        fontSize: 12,
        marginTop: 2,
    },
    daysBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusBadgeTable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
    },
    statusDotTable: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusTextTable: {
        fontSize: 11,
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

export default GroupsScreen;

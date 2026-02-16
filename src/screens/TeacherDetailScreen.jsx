import React, { useContext, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import PremiumModal from '../components/PremiumModal';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';

const TEACHER_STATUSES = {
    'Active': { label: 'Faol', color: '#27AE60', bg: '#E8F7EE' },
    'On Leave': { label: 'Ta’til', color: '#F2994A', bg: '#FFF4E8' },
    'Inactive': { label: 'Faol emas', color: '#EB5757', bg: '#FFF0F0' },
};

const TeacherDetailScreen = ({ route, navigation }) => {
    const { teacher: initialTeacher } = route.params;
    const { teachers, courses, updateTeacher, deleteTeacher } = useContext(SchoolContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { showLoader, hideLoader } = useUI();
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width >= 1280;

    // Get latest teacher data
    const teacher = teachers.find(t => t.id === initialTeacher.id) || initialTeacher;

    const [showPassword, setShowPassword] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    // Edit Form State
    const [name, setName] = useState(teacher.name);
    const [specialty, setSpecialty] = useState(teacher.subject || '');
    const [phone, setPhone] = useState(teacher.phone || '');
    const [email, setEmail] = useState(teacher.email || '');
    const [login, setLogin] = useState(teacher.login || '');
    const [password, setPassword] = useState(teacher.password || '');
    const [salaryType, setSalaryType] = useState(teacher.salaryType || 'Fixed');
    const [bio, setBio] = useState(teacher.bio || '');

    useEffect(() => {
        // Sync local state if teacher changes (e.g. after update)
        setName(teacher.name);
        setSpecialty(teacher.subject || '');
        setPhone(teacher.phone || '');
        setEmail(teacher.email || '');
        setLogin(teacher.login || '');
        setPassword(teacher.password || '');
        setSalaryType(teacher.salaryType || 'Fixed');
        setBio(teacher.bio || '');
    }, [teacher]);

    const assignedCourses = useMemo(() => {
        return courses.filter(course => teacher.assignedCourses?.includes(course.id));
    }, [courses, teacher]);

    const status = TEACHER_STATUSES[teacher.status] || TEACHER_STATUSES['Active'];

    const copyToClipboard = async (text, label) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Nusxalandi', `${label} buferga olindi`);
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Xatolik', 'Ismni kiriting');
            return;
        }

        const updatedData = {
            ...teacher,
            name,
            subject: specialty,
            phone,
            email,
            login,
            password,
            salaryType,
            bio
        };

        showLoader('Saqlanmoqda...');
        await updateTeacher(teacher.id, updatedData);
        setEditModalVisible(false);
        hideLoader();
    };

    const handleDeleteTeacher = async () => {
        Alert.alert(
            'O\'qituvchini O\'chirish',
            'Ushbu o\'qituvchini butunlay o\'chirmoqchimisiz? Bu amalni bekor qilib bo\'lmaydi!',
            [
                { text: t.cancel || 'Bekor qilish', style: 'cancel' },
                {
                    text: 'O\'chirish',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            showLoader('O\'chirilmoqda...');
                            await deleteTeacher(teacher.id);
                            hideLoader();
                            Alert.alert(t.success || 'Muvaffaqiyatli', 'O\'qituvchi o\'chirildi');
                            navigation.goBack();
                        } catch (error) {
                            hideLoader();
                            Alert.alert(t.error || 'Xatolik', 'O\'chirishda xatolik yuz berdi');
                        }
                    }
                }
            ]
        );
    };


    const InfoCard = ({ icon, label, value, color = COLORS.primary }) => (
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.infoIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{value || 'Kiritilmagan'}</Text>
            </View>
        </View>
    );

    // Desktop Layout Component
    const DesktopLayout = () => (
        <View style={styles.desktopContainer}>
            {/* Desktop Header */}
            <View style={[styles.desktopHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.desktopBackBtn, { backgroundColor: `${theme.primary}10` }]}>
                    <Ionicons name="arrow-back" size={20} color={theme.primary} />
                    <Text style={[styles.desktopBackText, { color: theme.primary }]}>Orqaga</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <View style={styles.desktopHeaderActions}>
                    <TouchableOpacity style={[styles.desktopActionBtn, { backgroundColor: `${theme.primary}10` }]} onPress={() => setEditModalVisible(true)}>
                        <Feather name="edit-2" size={18} color={theme.primary} />
                        <Text style={[styles.desktopActionText, { color: theme.primary }]}>Tahrirlash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.desktopActionBtn, { backgroundColor: '#EF444410' }]} onPress={handleDeleteTeacher}>
                        <Feather name="trash-2" size={18} color="#EF4444" />
                        <Text style={[styles.desktopActionText, { color: '#EF4444' }]}>O'chirish</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.desktopScrollContent}>
                <View style={styles.desktopContentRow}>
                    {/* Left Column - Profile */}
                    <View style={styles.desktopLeftColumn}>
                        <View style={[styles.desktopProfileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.desktopAvatarLarge, { backgroundColor: COLORS.primary + '15' }]}>
                                {teacher.avatar ? (
                                    <Image source={{ uri: teacher.avatar }} style={styles.desktopAvatarImg} />
                                ) : (
                                    <Text style={[styles.desktopAvatarText, { color: COLORS.primary }]}>{teacher.name[0]}</Text>
                                )}
                            </View>
                            <Text style={[styles.desktopTeacherName, { color: theme.text }]}>{teacher.name}</Text>
                            <Text style={[styles.desktopSpecialty, { color: theme.textSecondary }]}>{teacher.subject || 'Instruktor'}</Text>
                            <View style={[styles.desktopStatusBadge, { backgroundColor: isDarkMode ? `${status.color}20` : status.bg }]}>
                                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                                <Text style={{ color: status.color, fontWeight: '600', fontSize: 13 }}>{status.label}</Text>
                            </View>

                            {/* Stats */}
                            <View style={styles.desktopStatsGrid}>
                                <View style={[styles.desktopStatItem, { backgroundColor: `${COLORS.primary}10` }]}>
                                    <Text style={[styles.desktopStatValue, { color: COLORS.primary }]}>{assignedCourses.length}</Text>
                                    <Text style={[styles.desktopStatLabel, { color: theme.textSecondary }]}>Guruhlar</Text>
                                </View>
                                <View style={[styles.desktopStatItem, { backgroundColor: '#10B98110' }]}>
                                    <Text style={[styles.desktopStatValue, { color: '#10B981' }]}>96%</Text>
                                    <Text style={[styles.desktopStatLabel, { color: theme.textSecondary }]}>Davomat</Text>
                                </View>
                                <View style={[styles.desktopStatItem, { backgroundColor: '#F59E0B10' }]}>
                                    <Text style={[styles.desktopStatValue, { color: '#F59E0B' }]}>4.9</Text>
                                    <Text style={[styles.desktopStatLabel, { color: theme.textSecondary }]}>Reyting</Text>
                                </View>
                            </View>

                            {/* Quick Contact */}
                            <View style={styles.desktopQuickContact}>
                                <TouchableOpacity style={[styles.desktopContactBtn, { backgroundColor: '#27AE6010' }]} onPress={() => Linking.openURL(`tel:${teacher.phone}`)}>
                                    <Ionicons name="call" size={18} color="#27AE60" />
                                    <Text style={{ color: '#27AE60', fontWeight: '600', fontSize: 12 }}>Qo'ng'iroq</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.desktopContactBtn, { backgroundColor: '#5865F210' }]} onPress={() => Linking.openURL(`mailto:${teacher.email}`)}>
                                    <Ionicons name="mail" size={18} color="#5865F2" />
                                    <Text style={{ color: '#5865F2', fontWeight: '600', fontSize: 12 }}>Email</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Salary Card */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Ish haqi</Text>
                            <View style={styles.desktopSalaryGrid}>
                                <View style={styles.desktopSalaryItem}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>To'lov turi</Text>
                                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                                        {teacher.salaryType === 'Percentage' ? 'Foizli (50%)' : 'Fiksirlangan'}
                                    </Text>
                                </View>
                                <View style={styles.desktopSalaryItem}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Kutilmoqda</Text>
                                    <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 15 }}>4,200,000 UZS</Text>
                                </View>
                            </View>
                        </View>

                        {/* Credentials */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Tizimga kirish</Text>
                            <View style={styles.desktopCredentialRow}>
                                <View style={[styles.desktopCredIcon, { backgroundColor: `${theme.primary}10` }]}>
                                    <Feather name="user" size={16} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Login</Text>
                                    <Text style={{ color: theme.text, fontWeight: '600' }}>{teacher.login || 'belgilanmagan'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => copyToClipboard(teacher.login, 'Login')}>
                                    <Feather name="copy" size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.desktopCredentialRow, { marginTop: 12 }]}>
                                <View style={[styles.desktopCredIcon, { backgroundColor: '#5865F210' }]}>
                                    <Feather name="lock" size={16} color="#5865F2" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Parol</Text>
                                    <Text style={{ color: theme.text, fontWeight: '600' }}>{showPassword ? teacher.password : '••••••••'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Groups & Details */}
                    <View style={styles.desktopRightColumn}>
                        {/* Groups */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Guruhlar va Jadval</Text>
                            {assignedCourses.length > 0 ? (
                                <View style={styles.desktopGroupsGrid}>
                                    {assignedCourses.map(course => (
                                        <TouchableOpacity
                                            key={course.id}
                                            style={[styles.desktopGroupCard, { backgroundColor: isDarkMode ? '#101827' : '#F9FAFB', borderColor: theme.border }]}
                                            onPress={() => navigation.navigate('CourseDetail', { course: course })}
                                        >
                                            <View style={[styles.desktopGroupIconBox, { backgroundColor: (course.color || COLORS.primary) + '15' }]}>
                                                <Ionicons name="book" size={24} color={course.color || COLORS.primary} />
                                            </View>
                                            <Text style={[styles.desktopGroupName, { color: theme.text }]}>{course.title}</Text>
                                            <View style={styles.desktopGroupMeta}>
                                                <View style={styles.desktopMetaItem}>
                                                    <Feather name="calendar" size={12} color={theme.textSecondary} />
                                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{course.days}</Text>
                                                </View>
                                                <View style={styles.desktopMetaItem}>
                                                    <Feather name="clock" size={12} color={theme.textSecondary} />
                                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{course.time}</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.desktopGroupStudents, { backgroundColor: `${theme.primary}10` }]}>
                                                <Ionicons name="people" size={14} color={theme.primary} />
                                                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 12 }}>{course.students || 0}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.desktopNoGroups}>
                                    <Ionicons name="school-outline" size={48} color={theme.border} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Hozircha guruhlar yo'q</Text>
                                </View>
                            )}
                        </View>

                        {/* Contact Info */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Bog'lanish ma'lumotlari</Text>
                            <View style={styles.desktopContactGrid}>
                                <View style={styles.desktopContactItem}>
                                    <View style={[styles.desktopContactIcon, { backgroundColor: '#27AE6010' }]}>
                                        <Ionicons name="call" size={20} color="#27AE60" />
                                    </View>
                                    <View>
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Telefon</Text>
                                        <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>{teacher.phone || 'Kiritilmagan'}</Text>
                                    </View>
                                </View>
                                <View style={styles.desktopContactItem}>
                                    <View style={[styles.desktopContactIcon, { backgroundColor: '#5865F210' }]}>
                                        <Ionicons name="mail" size={20} color="#5865F2" />
                                    </View>
                                    <View>
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Email</Text>
                                        <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>{teacher.email || 'Kiritilmagan'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Bio */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Bio va Eslatmalar</Text>
                            <Text style={{ color: theme.textSecondary, lineHeight: 22 }}>
                                {teacher.bio || "O'qituvchi haqida qo'shimcha ma'lumotlar kiritilmagan."}
                            </Text>
                            <View style={styles.desktopTagsRow}>
                                {['Senior', 'IELTS 8.5', 'Expert'].map(tag => (
                                    <View key={tag} style={[styles.desktopTag, { backgroundColor: `${theme.primary}10` }]}>
                                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    // Mobile Layout Component
    const MobileLayout = () => (
        <>
            <View style={[styles.header, { backgroundColor: isDarkMode ? theme.background : 'white' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>O'qituvchi Profili</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
                    <Ionicons name="pencil-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarLarge, { backgroundColor: COLORS.primary + '10' }]}>
                            {teacher.avatar ? (
                                <Image source={{ uri: teacher.avatar }} style={styles.avatarImg} />
                            ) : (
                                <Text style={styles.avatarLetter}>{teacher.name[0]}</Text>
                            )}
                        </View>
                        <View style={[styles.statusPoint, { backgroundColor: status.color }]} />
                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>{teacher.name}</Text>
                    <Text style={styles.specialty}>{teacher.subject || 'Instruktor'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statVal, { color: COLORS.primary }]}>{assignedCourses.length}</Text>
                        <Text style={styles.statLab}>Guruhlar</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statVal, { color: COLORS.success }]}>96%</Text>
                        <Text style={styles.statLab}>Davomat</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statVal, { color: COLORS.warning }]}>4.9/5</Text>
                        <Text style={styles.statLab}>Reyting</Text>
                    </View>
                </View>

                {/* Salary Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ish haqi va Shartnoma</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.salaryRow}>
                        <View style={styles.salaryInfo}>
                            <Text style={styles.salaryLabel}>To'lov turi</Text>
                            <Text style={[styles.salaryVal, { color: theme.text }]}>
                                {teacher.salaryType === 'Percentage' ? 'Foizli (50%)' : 'Fiksirlangan'}
                            </Text>
                        </View>
                        <View style={styles.salaryDivider} />
                        <View style={styles.salaryInfo}>
                            <Text style={styles.salaryLabel}>Kutilmoqda (Yanvar)</Text>
                            <Text style={[styles.salaryVal, { color: COLORS.success }]}>4,200,000 UZS</Text>
                        </View>
                    </View>
                </View>

                {/* Credentials */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tizimga kirish</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity style={styles.credentialRow} onPress={() => copyToClipboard(teacher.login, 'Login')}>
                        <View style={styles.credLeft}>
                            <Feather name="user" size={18} color="#828282" />
                            <Text style={[styles.credVal, { color: theme.text }]}>{teacher.login || 'belgilanmagan'}</Text>
                        </View>
                        <Feather name="copy" size={16} color="#BDBDBD" />
                    </TouchableOpacity>
                    <View style={styles.hDivider} />
                    <View style={styles.credentialRow}>
                        <TouchableOpacity style={styles.credLeft} onPress={() => copyToClipboard(teacher.password, 'Parol')}>
                            <Feather name="lock" size={18} color="#828282" />
                            <Text style={[styles.credVal, { color: theme.text }]}>{showPassword ? teacher.password : '••••••••'}</Text>
                            <Feather name="copy" size={16} color="#BDBDBD" style={{ marginLeft: 10 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#828282" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Groups */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Guruhlar va Jadval</Text>
                </View>
                <View style={styles.groupsList}>
                    {assignedCourses.length > 0 ? (
                        assignedCourses.map(course => (
                            <TouchableOpacity key={course.id} style={[styles.groupCard, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('CourseDetail', { course: course })}>
                                <View style={[styles.groupIcon, { backgroundColor: (course.color || COLORS.primary) + '15' }]}>
                                    <Ionicons name="book" size={24} color={course.color || COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.groupName, { color: theme.text }]}>{course.title}</Text>
                                    <View style={styles.groupMetaRow}>
                                        <View style={styles.metaCol}>
                                            <Feather name="calendar" size={12} color="#828282" />
                                            <Text style={styles.metaText}>{course.days}</Text>
                                        </View>
                                        <View style={styles.metaCol}>
                                            <Feather name="clock" size={12} color="#828282" />
                                            <Text style={styles.metaText}>{course.time}</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.groupAction}>
                                    <Feather name="chevron-right" size={20} color="#BDBDBD" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                            <Text style={styles.emptyText}>Hozircha guruhlar yo'q</Text>
                        </View>
                    )}
                </View>

                {/* Contact */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Bog'lanish</Text>
                </View>
                <View style={styles.contactList}>
                    <InfoCard icon="call-outline" label="Telefon" value={teacher.phone} color="#27AE60" />
                    <InfoCard icon="mail-outline" label="Email" value={teacher.email || 'Kiritilmagan'} color="#5865F2" />
                </View>

                {/* Notes */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Eshlatmalar</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={styles.notesText}>{teacher.bio || "O'qituvchi haqida qo'shimcha ma'lumotlar kiritilmagan."}</Text>
                    <View style={styles.tagsRow}>
                        {['Senior', 'IELTS 8.5', 'Expert'].map(tag => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#EB5757' }]}>Xavfli hudud</Text>
                </View>
                <View style={[styles.card, { backgroundColor: isDarkMode ? 'rgba(235, 87, 87, 0.1)' : '#FFF0F0' }]}>
                    <TouchableOpacity style={styles.dangerAction} onPress={handleDeleteTeacher}>
                        <View style={styles.dangerIconContainer}>
                            <Feather name="trash-2" size={20} color="#EB5757" />
                        </View>
                        <View>
                            <Text style={[styles.dangerTitle, { color: '#EB5757' }]}>O'qituvchini o'chirish</Text>
                            <Text style={styles.dangerSub}>Ushbu profil butunlay o'chiriladi</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? theme.background : 'white'} />
            {isDesktop ? <DesktopLayout /> : <MobileLayout />}
            <PremiumModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                title="Profilni Tahrirlash"
                subtitle="O'qituvchi ma'lumotlarini o'zgartirish"
                headerGradient={['#667eea', '#764ba2']}
                footer={
                    <PremiumButton
                        title="O'zgarishlarni Saqlash"
                        onPress={handleSaveProfile}
                        gradient={['#667eea', '#764ba2']}
                        style={{ flex: 1 }}
                    />
                }
            >
                <PremiumInput
                    label="F.I.SH *"
                    value={name}
                    onChangeText={setName}
                    placeholder="Alisher Navoi"
                    icon="person-outline"
                />

                <PremiumInput
                    label="Mutaxassislik *"
                    value={specialty}
                    onChangeText={setSpecialty}
                    placeholder="Ingliz tili, Matematika..."
                    icon="briefcase-outline"
                />

                <PremiumInput
                    label="Telefon raqami"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+998 90 123 45 67"
                    keyboardType="phone-pad"
                    icon="call-outline"
                />

                <PremiumInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@mail.com"
                    keyboardType="email-address"
                    icon="mail-outline"
                />

                <View style={[globalStyles.row, { gap: 12 }]}>
                    <PremiumInput
                        label="Login"
                        value={login}
                        onChangeText={setLogin}
                        autoCapitalize="none"
                        containerStyle={{ flex: 1 }}
                        icon="at-outline"
                    />
                    <PremiumInput
                        label="Parol"
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        containerStyle={{ flex: 1 }}
                        icon="lock-closed-outline"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>To'lov turi</Text>
                    <View style={styles.radioGroup}>
                        {['Fixed', 'Percentage'].map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.radioBtn, salaryType === type && { backgroundColor: theme.primary }]}
                                onPress={() => setSalaryType(type)}
                            >
                                <Text style={[styles.radioText, salaryType === type && { color: 'white' }]}>
                                    {type === 'Fixed' ? 'Fiksirlangan' : 'Foizli'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <PremiumInput
                    label="Bio / Eshlatma"
                    value={bio}
                    onChangeText={setBio}
                    placeholder="O'qituvchi haqida qisqacha..."
                    multiline
                    icon="document-text-outline"
                />
            </PremiumModal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, justifyContent: 'space-between', backgroundColor: 'white' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FE' },
    editBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },
    scrollContent: { paddingBottom: 40 },
    profileSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: 'white', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    avatarWrapper: { position: 'relative', marginBottom: 20 },
    avatarLarge: { width: 110, height: 110, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarLetter: { fontSize: 44, fontWeight: 'bold', color: COLORS.primary },
    statusPoint: { position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderColor: 'white' },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
    specialty: { fontSize: 15, color: '#828282', marginBottom: 15 },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, gap: 12 },
    statItem: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    statVal: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    statLab: { fontSize: 11, color: '#828282', fontWeight: '500' },
    sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    card: { marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    salaryRow: { flexDirection: 'row', alignItems: 'center' },
    salaryInfo: { flex: 1, alignItems: 'center' },
    salaryDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
    salaryLabel: { fontSize: 11, color: '#828282', marginBottom: 5 },
    salaryVal: { fontSize: 15, fontWeight: 'bold' },
    credentialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    credLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    credVal: { fontSize: 15, fontWeight: '500' },
    hDivider: { height: 1, backgroundColor: '#F2F2F2', marginVertical: 12 },
    groupsList: { marginHorizontal: 20, gap: 12 },
    groupCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 15 },
    groupIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    groupName: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    groupMetaRow: { flexDirection: 'row', gap: 15 },
    metaCol: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 12, color: '#828282' },
    groupAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    emptyCard: { padding: 20, borderRadius: 20, alignItems: 'center' },
    emptyText: { color: '#BDBDBD', fontStyle: 'italic' },
    contactList: { marginHorizontal: 20, gap: 12 },
    infoCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, gap: 18 },
    infoIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 12, color: '#828282', marginBottom: 3 },
    infoValue: { fontSize: 16, fontWeight: '600' },
    notesText: { fontSize: 14, color: '#4F4F4F', lineHeight: 22, marginBottom: 20 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F2F2F2' },
    tagText: { fontSize: 12, color: '#828282', fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#828282', marginBottom: 8, marginTop: 15 },
    modalInput: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
    radioGroup: { flexDirection: 'row', gap: 12 },
    radioBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
    activeRadio: { backgroundColor: '#1F2022' },
    radioText: { color: '#828282', fontWeight: '600' },
    activeRadioText: { color: 'white' },
    saveBtn: { backgroundColor: '#1F2022', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Danger Zone Styles
    dangerAction: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    dangerIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(235, 87, 87, 0.1)', alignItems: 'center', justifyContent: 'center' },
    dangerTitle: { fontSize: 16, fontWeight: 'bold' },
    dangerSub: { fontSize: 12, color: '#828282', marginTop: 2 },
    // Desktop Styles
    desktopContainer: { flex: 1 },
    desktopHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderBottomWidth: 1 },
    desktopBackBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 8 },
    desktopBackText: { fontSize: 14, fontWeight: '600' },
    desktopHeaderActions: { flexDirection: 'row', gap: 12 },
    desktopActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 8 },
    desktopActionText: { fontSize: 14, fontWeight: '600' },
    desktopScrollContent: { padding: 32 },
    desktopContentRow: { flexDirection: 'row', gap: 24 },
    desktopLeftColumn: { width: 340, gap: 20 },
    desktopRightColumn: { flex: 1, gap: 20 },
    desktopProfileCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
    desktopAvatarLarge: { width: 100, height: 100, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
    desktopAvatarImg: { width: '100%', height: '100%' },
    desktopAvatarText: { fontSize: 40, fontWeight: '700' },
    desktopTeacherName: { fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
    desktopSpecialty: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
    desktopStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    desktopStatsGrid: { flexDirection: 'row', width: '100%', gap: 10, marginTop: 20 },
    desktopStatItem: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
    desktopStatValue: { fontSize: 20, fontWeight: '700' },
    desktopStatLabel: { fontSize: 11, marginTop: 2 },
    desktopQuickContact: { flexDirection: 'row', width: '100%', gap: 12, marginTop: 16 },
    desktopContactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    desktopCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
    desktopCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    desktopSalaryGrid: { flexDirection: 'row', gap: 20 },
    desktopSalaryItem: { flex: 1 },
    desktopCredentialRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    desktopCredIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    desktopGroupsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    desktopGroupCard: { width: 'calc(50% - 8px)', padding: 20, borderRadius: 16, borderWidth: 1 },
    desktopGroupIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    desktopGroupName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    desktopGroupMeta: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    desktopMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    desktopGroupStudents: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
    desktopNoGroups: { alignItems: 'center', paddingVertical: 40 },
    desktopContactGrid: { flexDirection: 'row', gap: 20 },
    desktopContactItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
    desktopContactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    desktopTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    desktopTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
});

export default TeacherDetailScreen;

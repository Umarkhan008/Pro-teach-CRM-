import React, { useState, useContext, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Linking,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import PremiumModal from '../components/PremiumModal';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';

const getStudentStatuses = (isDarkMode) => ({
    'Active': { label: 'Faol', color: '#27AE60', bg: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE' },
    'Waiting': { label: 'Kutilmoqda', color: '#F2994A', bg: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8' },
    'Completed': { label: 'Bitirgan', color: '#5865F2', bg: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' },
    'Inactive': { label: 'Tark etgan', color: isDarkMode ? '#9CA3AF' : '#828282', bg: isDarkMode ? 'rgba(156, 163, 175, 0.15)' : '#F2F2F2' },
});

const StudentDetailScreen = ({ route, navigation }) => {
    const { student: initialStudent } = route.params;
    const { students, courses, finance, attendance, updateStudent, deleteStudent, addTransaction } = useContext(SchoolContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const STUDENT_STATUSES = getStudentStatuses(isDarkMode);
    const { showLoader, hideLoader } = useUI();
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width >= 1280;

    // Use student from context to get latest updates
    const studentId = initialStudent?.id;
    const student = students.find(s => s.id === studentId) || initialStudent;

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [balanceModalVisible, setBalanceModalVisible] = useState(false);
    const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
    const [transactionType, setTransactionType] = useState('deposit'); // deposit or withdraw
    const [transactionAmount, setTransactionAmount] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form State for editing
    const [name, setName] = useState(student.name);
    const [phone, setPhone] = useState(student.phone || '');
    const [email, setEmail] = useState(student.email || '');
    const [login, setLogin] = useState(student.login || '');
    const [password, setPassword] = useState(student.password || '');
    const [selectedCourseId, setSelectedCourseId] = useState(student.assignedCourseId);
    const [paymentPlan, setPaymentPlan] = useState(student.paymentPlan || 'Monthly');

    const status = STUDENT_STATUSES[student.status] || STUDENT_STATUSES['Active'];
    const assignedCourse = courses.find(c => c.id === student.assignedCourseId);
    const isDebtor = (student.balance || 0) < 0;

    // Filter recent payments for this student
    const studentPayments = useMemo(() => {
        return finance.filter(f =>
            f.studentId === student.id ||
            (f.studentName && f.studentName.toLowerCase() === student.name?.toLowerCase())
        ).slice(0, 5); // Show last 5
    }, [finance, student]);

    // Track student attendance history
    const studentAttendance = useMemo(() => {
        if (!attendance) return [];

        // Filter attendance records where this student is included
        const records = attendance.filter(record =>
            record.students && record.students[student.id]
        );

        // Map to a more useful format for display
        return records.map(record => ({
            id: record.id,
            date: record.date,
            courseName: record.courseName,
            status: record.students[student.id].status,
            reason: record.students[student.id].reason,
            note: record.students[student.id].note,
            timestamp: record.timestamp || 0
        })).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
    }, [attendance, student]);

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Xatolik', 'Ismni kiriting');
            return;
        }
        const courseObj = courses.find(c => c.id === selectedCourseId);
        const updatedData = {
            ...student,
            name,
            phone,
            email,
            login,
            password,
            assignedCourseId: selectedCourseId,
            course: courseObj ? courseObj.title : 'Guruhsiz',
            paymentPlan,
            status: selectedCourseId ? 'Active' : 'Waiting'
        };

        try {
            showLoader('Saqlanmoqda...');
            await updateStudent(student.id, updatedData);
            setEditModalVisible(false);
        } catch (error) {
            Alert.alert('Xatolik', 'Saqlashda xatolik yuz berdi');
        } finally {
            hideLoader();
        }
    };

    const handleTransaction = async () => {
        const amount = parseFloat(transactionAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Xatolik', 'To\'g\'ri summani kiriting');
            return;
        }

        const newBalance = transactionType === 'deposit'
            ? (student.balance || 0) + amount
            : (student.balance || 0) - amount;

        try {
            showLoader('Bajarilmoqda...');

            // Update student balance
            await updateStudent(student.id, { ...student, balance: newBalance });

            // Add to finance history
            await addTransaction({
                title: transactionType === 'deposit' ? 'To\'lov (Kirim)' : 'To\'lov (Chiqim)',
                amount: `${transactionType === 'deposit' ? '+' : '-'}${amount.toLocaleString()} UZS`,
                type: transactionType === 'deposit' ? 'Income' : 'Expense',
                studentId: student.id,
                studentName: student.name,
                category: 'Tuition'
            });

            setTransactionAmount('');
            setBalanceModalVisible(false);
        } finally {
            hideLoader();
        }
    };

    const confirmRemovefromGroup = () => {
        const performRemove = async () => {
            try {
                showLoader('Guruhdan chiqarilmoqda...');
                await updateStudent(student.id, {
                    assignedCourseId: null,
                    course: 'Guruhsiz',
                    status: 'Waiting'
                });
                if (Platform.OS === 'web') {
                    alert('Talaba guruhdan chiqarildi');
                } else {
                    Alert.alert('Muvaffaqiyatli', 'Talaba guruhdan chiqarildi');
                }
            } catch (error) {
                if (Platform.OS === 'web') {
                    alert('Guruhdan chiqarishda xatolik yuz berdi');
                } else {
                    Alert.alert('Xatolik', 'Guruhdan chiqarishda xatolik yuz berdi');
                }
            } finally {
                hideLoader();
            }
        };

        const message = "Haqiqatdan ham bu o'quvchini guruhdan chiqarmoqchimisiz? Talaba tizimda saqlanib qoladi.";

        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                performRemove();
            }
        } else {
            Alert.alert(
                'Guruhdan chiqarish',
                message,
                [
                    { text: 'Yo\'q' },
                    { text: 'Ha', style: 'destructive', onPress: performRemove }
                ]
            );
        }
    };

    const confirmDelete = () => {
        const performDelete = async () => {
            try {
                showLoader('O\'chirilmoqda...');
                await deleteStudent(student.id);
                navigation.goBack();
            } finally {
                hideLoader();
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Haqiqatdan ham bu o'quvchini o'chirmoqchimisiz?")) {
                performDelete();
            }
        } else {
            Alert.alert(
                'O\'chirish',
                'Haqiqatdan ham bu o\'quvchini o\'chirmoqchimisiz?',
                [
                    { text: 'Yo\'q' },
                    { text: 'Ha', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    const InfoRow = ({ icon, label, value, isPassword }) => (
        <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FE' }]}>
                <Ionicons name={icon} size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                    {isPassword && !showPassword ? '••••••••' : (value || 'Kiritilmagan')}
                </Text>
            </View>
            {isPassword && (
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={theme.textLight} />
                </TouchableOpacity>
            )}
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
                    <TouchableOpacity style={[styles.desktopActionBtn, { backgroundColor: '#EF444410' }]} onPress={confirmDelete}>
                        <Feather name="trash-2" size={18} color="#EF4444" />
                        <Text style={[styles.desktopActionText, { color: '#EF4444' }]}>O'chirish</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.desktopScrollContent}>
                <View style={styles.desktopContentRow}>
                    {/* Left Column - Profile & Quick Info */}
                    <View style={styles.desktopLeftColumn}>
                        {/* Profile Card */}
                        <View style={[styles.desktopProfileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.desktopAvatarLarge, { backgroundColor: status.color + '15' }]}>
                                <Text style={[styles.desktopAvatarText, { color: status.color }]}>
                                    {student.name ? student.name[0].toUpperCase() : 'U'}
                                </Text>
                            </View>
                            <Text style={[styles.desktopStudentName, { color: theme.text }]}>{student.name}</Text>
                            <View style={[styles.desktopStatusBadge, { backgroundColor: status.bg }]}>
                                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                                <Text style={[styles.desktopStatusText, { color: status.color }]}>{status.label}</Text>
                            </View>

                            {/* Balance Indicator */}
                            <View style={[styles.desktopBalanceBox, { backgroundColor: isDebtor ? '#EF444410' : '#10B98110', borderColor: isDebtor ? '#EF4444' : '#10B981' }]}>
                                <Ionicons name={isDebtor ? "alert-circle" : "checkmark-circle"} size={24} color={isDebtor ? '#EF4444' : '#10B981'} />
                                <View>
                                    <Text style={[styles.desktopBalanceLabel, { color: theme.textSecondary }]}>{isDebtor ? 'Qarzdorlik' : 'Balans'}</Text>
                                    <Text style={[styles.desktopBalanceValue, { color: isDebtor ? '#EF4444' : '#10B981' }]}>
                                        {Math.abs(student.balance || 0).toLocaleString()} UZS
                                    </Text>
                                </View>
                            </View>

                            {/* Quick Actions */}
                            <View style={styles.desktopQuickActions}>
                                <TouchableOpacity style={[styles.desktopQuickBtn, { backgroundColor: '#27AE6010' }]} onPress={() => Linking.openURL(`tel:${student.phone}`)}>
                                    <Ionicons name="call" size={20} color="#27AE60" />
                                    <Text style={{ color: '#27AE60', fontSize: 12, fontWeight: '600' }}>Qo'ng'iroq</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.desktopQuickBtn, { backgroundColor: '#F59E0B10' }]} onPress={() => { setTransactionType('deposit'); setBalanceModalVisible(true); }}>
                                    <Ionicons name="wallet" size={20} color="#F59E0B" />
                                    <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '600' }}>To'lov</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Group Card */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Guruh Ma'lumotlari</Text>
                            {assignedCourse ? (
                                <View style={styles.desktopGroupContent}>
                                    <View style={[styles.desktopGroupIcon, { backgroundColor: (assignedCourse.color || theme.primary) + '15' }]}>
                                        <Ionicons name="book" size={28} color={assignedCourse.color || theme.primary} />
                                    </View>
                                    <Text style={[styles.desktopGroupTitle, { color: theme.text }]}>{assignedCourse.title}</Text>
                                    <Text style={[styles.desktopGroupSub, { color: theme.textSecondary }]}>{assignedCourse.instructor || "O'qituvchi noma'lum"}</Text>
                                    <View style={styles.desktopGroupMeta}>
                                        <View style={[styles.desktopMetaBadge, { backgroundColor: `${theme.primary}10` }]}>
                                            <Ionicons name="time" size={14} color={theme.primary} />
                                            <Text style={{ color: theme.primary, fontSize: 12 }}>{assignedCourse.time}</Text>
                                        </View>
                                        <View style={[styles.desktopMetaBadge, { backgroundColor: `${theme.primary}10` }]}>
                                            <Ionicons name="calendar" size={14} color={theme.primary} />
                                            <Text style={{ color: theme.primary, fontSize: 12 }}>{assignedCourse.days}</Text>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.desktopNoGroup}>
                                    <Ionicons name="school-outline" size={40} color={theme.border} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Guruhga biriktirilmagan</Text>
                                    <TouchableOpacity style={[styles.desktopAddGroupBtn, { borderColor: theme.primary }]} onPress={() => setEditModalVisible(true)}>
                                        <Text style={{ color: theme.primary, fontWeight: '600' }}>Guruhga qo'shish</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Attendance Stats */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Davomat</Text>
                            <View style={styles.desktopAttendanceStats}>
                                <View style={styles.desktopAttendanceCircle}>
                                    <Text style={[styles.desktopAttendanceValue, { color: theme.text }]}>{student.attendanceRate || 0}%</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Davomat</Text>
                                </View>
                                <TouchableOpacity style={[styles.desktopViewAllBtn, { backgroundColor: `${theme.primary}10` }]} onPress={() => setAttendanceModalVisible(true)}>
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>Batafsil ko'rish</Text>
                                    <Feather name="chevron-right" size={16} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Details Grid */}
                    <View style={styles.desktopRightColumn}>
                        {/* Contact Information */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Bog'lanish ma'lumotlari</Text>
                            <View style={styles.desktopInfoGrid}>
                                <View style={styles.desktopInfoItem}>
                                    <View style={[styles.desktopInfoIcon, { backgroundColor: `${theme.primary}10` }]}>
                                        <Ionicons name="call-outline" size={20} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.desktopInfoLabel, { color: theme.textSecondary }]}>Telefon</Text>
                                        <Text style={[styles.desktopInfoValue, { color: theme.text }]}>{student.phone || 'Kiritilmagan'}</Text>
                                    </View>
                                </View>
                                <View style={styles.desktopInfoItem}>
                                    <View style={[styles.desktopInfoIcon, { backgroundColor: `${theme.primary}10` }]}>
                                        <Ionicons name="mail-outline" size={20} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.desktopInfoLabel, { color: theme.textSecondary }]}>Email</Text>
                                        <Text style={[styles.desktopInfoValue, { color: theme.text }]}>{student.email || 'Kiritilmagan'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Login Credentials */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Kirish ma'lumotlari</Text>
                            <View style={styles.desktopInfoGrid}>
                                <View style={styles.desktopInfoItem}>
                                    <View style={[styles.desktopInfoIcon, { backgroundColor: '#5865F210' }]}>
                                        <Ionicons name="at-outline" size={20} color="#5865F2" />
                                    </View>
                                    <View>
                                        <Text style={[styles.desktopInfoLabel, { color: theme.textSecondary }]}>Login</Text>
                                        <Text style={[styles.desktopInfoValue, { color: theme.text }]}>{student.login || 'Kiritilmagan'}</Text>
                                    </View>
                                </View>
                                <View style={styles.desktopInfoItem}>
                                    <View style={[styles.desktopInfoIcon, { backgroundColor: '#5865F210' }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#5865F2" />
                                    </View>
                                    <View>
                                        <Text style={[styles.desktopInfoLabel, { color: theme.textSecondary }]}>Parol</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={[styles.desktopInfoValue, { color: theme.text }]}>
                                                {showPassword ? (student.password || 'Kiritilmagan') : '••••••••'}
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Payment Info */}
                        {assignedCourse && (
                            <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.desktopCardTitle, { color: theme.text }]}>To'lov ma'lumotlari</Text>
                                <View style={styles.desktopPaymentGrid}>
                                    <View style={[styles.desktopPaymentItem, { backgroundColor: isDarkMode ? '#101827' : '#F9FAFB' }]}>
                                        <Ionicons name="card-outline" size={24} color={theme.primary} />
                                        <Text style={[styles.desktopPaymentLabel, { color: theme.textSecondary }]}>Oylik to'lov</Text>
                                        <Text style={[styles.desktopPaymentValue, { color: theme.text }]}>
                                            {(() => {
                                                const p = assignedCourse.price;
                                                const num = typeof p === 'string' ? parseFloat(p.replace(/[^\d]/g, '')) : p;
                                                return isNaN(num) ? 'Kiritilmagan' : num.toLocaleString() + ' UZS';
                                            })()}
                                        </Text>
                                    </View>
                                    <View style={[styles.desktopPaymentItem, { backgroundColor: isDarkMode ? '#101827' : '#F9FAFB' }]}>
                                        <Ionicons name="receipt-outline" size={24} color="#10B981" />
                                        <Text style={[styles.desktopPaymentLabel, { color: theme.textSecondary }]}>To'lov rejasi</Text>
                                        <Text style={[styles.desktopPaymentValue, { color: theme.text }]}>
                                            {student.paymentPlan === 'Full' ? "To'liq" : (student.paymentPlan === 'Monthly' ? 'Oylik' : 'Individual')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Recent Payments */}
                        <View style={[styles.desktopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.desktopCardHeader}>
                                <Text style={[styles.desktopCardTitle, { color: theme.text }]}>Oxirgi to'lovlar</Text>
                                <TouchableOpacity style={[styles.desktopAddPaymentBtn, { backgroundColor: '#10B98110' }]} onPress={() => { setTransactionType('deposit'); setBalanceModalVisible(true); }}>
                                    <Ionicons name="add" size={18} color="#10B981" />
                                    <Text style={{ color: '#10B981', fontWeight: '600' }}>Yangi to'lov</Text>
                                </TouchableOpacity>
                            </View>
                            {studentPayments.length > 0 ? (
                                <View style={styles.desktopPaymentsList}>
                                    {studentPayments.map((payment, index) => (
                                        <View key={payment.id || index} style={[styles.desktopPaymentRow, { borderBottomColor: theme.border }]}>
                                            <View style={[styles.desktopPaymentIcon, { backgroundColor: payment.type === 'Income' ? '#10B98110' : '#EF444410' }]}>
                                                <Ionicons name={payment.type === 'Income' ? "arrow-down" : "arrow-up"} size={18} color={payment.type === 'Income' ? '#10B981' : '#EF4444'} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.desktopPaymentTitle, { color: theme.text }]}>{payment.title}</Text>
                                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{payment.date}</Text>
                                            </View>
                                            <Text style={{ color: payment.type === 'Income' ? '#10B981' : '#EF4444', fontWeight: '700', fontSize: 15 }}>
                                                {payment.amount}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.desktopEmptyPayments}>
                                    <Ionicons name="wallet-outline" size={40} color={theme.border} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Hali to'lovlar mavjud emas</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    // Mobile Layout Component
    const MobileLayout = () => (
        <>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FE' }]}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Talaba Profili</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(true)} style={[styles.editBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="pencil-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
                    <View style={[styles.avatarLarge, { backgroundColor: status.color + '15' }]}>
                        <Text style={[styles.avatarLargeText, { color: status.color }]}>
                            {student.name ? student.name[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.studentName, { color: theme.text }]}>{student.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Balance & Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statValue, { color: isDebtor ? theme.error : theme.success }]}>
                            {Math.abs(student.balance || 0).toLocaleString()}
                            <Text style={[styles.statCurrency, { color: theme.textLight }]}> UZS</Text>
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{isDebtor ? 'Qarzdorlik' : 'Balans'}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {student.attendanceRate || 0}%
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Davomat</Text>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionItem} onPress={() => Linking.openURL(`tel:${student.phone}`)}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE' }]}>
                            <Ionicons name="call" size={24} color="#27AE60" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Qo'ng'iroq</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={() => { setTransactionType('deposit'); setBalanceModalVisible(true); }}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8' }]}>
                            <Ionicons name="wallet" size={24} color="#F2994A" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>To'lov</Text>
                    </TouchableOpacity>

                    {assignedCourse ? (
                        <TouchableOpacity style={styles.actionItem} onPress={confirmRemovefromGroup}>
                            <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : '#FFF3E0' }]}>
                                <Ionicons name="person-remove-outline" size={24} color="#FF9F43" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.textSecondary, textAlign: 'center', fontSize: 11 }]}>Guruhdan chiqarish</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.actionItem} onPress={() => setAttendanceModalVisible(true)}>
                            <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' }]}>
                                <Ionicons name="clipboard-outline" size={24} color="#5865F2" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Davomat</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionItem} onPress={confirmDelete}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FFF0F0' }]}>
                            <Ionicons name="trash" size={24} color={theme.error} />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>O'chirish</Text>
                    </TouchableOpacity>
                </View>

                {/* Group Details Card */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Guruh Ma'lumotlari</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {assignedCourse ? (
                        <View style={styles.courseContent}>
                            <View style={[styles.courseIcon, { backgroundColor: (assignedCourse.color || theme.primary) + '15' }]}>
                                <Ionicons name="book" size={24} color={assignedCourse.color || theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.courseTitle, { color: theme.text }]}>{assignedCourse.title}</Text>
                                <Text style={[styles.courseSubtitle, { color: theme.textSecondary }]}>{assignedCourse.instructor || "O'qituvchi noma'lum"}</Text>
                                <View style={styles.courseMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color={theme.textLight} />
                                        <Text style={[styles.metaText, { color: theme.textLight }]}>{assignedCourse.time}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.textLight} />
                                        <Text style={[styles.metaText, { color: theme.textLight }]}>{assignedCourse.days}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{ marginTop: 12, paddingVertical: 6, width: 140, backgroundColor: theme.error + '15', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.error + '30' }}
                                    onPress={confirmRemovefromGroup}
                                >
                                    <Text style={{ color: theme.error, fontSize: 12, fontWeight: '600' }}>Guruhdan chiqarish</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noGroup}>
                            <Text style={[styles.noGroupText, { color: theme.textLight }]}>Hech qanday guruhga biriktirilmagan</Text>
                            <TouchableOpacity style={styles.assignLink} onPress={() => setEditModalVisible(true)}>
                                <Text style={[styles.assignLinkText, { color: theme.primary }]}>Guruhga qo'shish +</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Finance Info Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>To'lov Ma'lumotlari</Text>
                </View>
                <View style={[styles.financeCard, { backgroundColor: theme.surface }]}>
                    {assignedCourse ? (
                        <>
                            <View style={styles.financeRow}>
                                <View style={styles.financeItem}>
                                    <Text style={[styles.financeLabel, { color: theme.textSecondary }]}>Oylik to'lov</Text>
                                    <View style={styles.financeValueRow}>
                                        <Ionicons name="card-outline" size={18} color={theme.primary} />
                                        <Text style={[styles.financeValue, { color: theme.text }]}>
                                            {(() => {
                                                const p = assignedCourse.price;
                                                const num = typeof p === 'string' ? parseFloat(p.replace(/[^\d]/g, '')) : p;
                                                return isNaN(num) ? 'Kiritilmagan' : num.toLocaleString() + ' UZS';
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.financeDivider, { backgroundColor: theme.border }]} />
                                <View style={styles.financeItem}>
                                    <Text style={[styles.financeLabel, { color: theme.textSecondary }]}>Kunlik yechim</Text>
                                    <View style={styles.financeValueRow}>
                                        <Ionicons name="calendar-outline" size={18} color="#27AE60" />
                                        <Text style={[styles.financeValue, { color: theme.text }]}>
                                            {(() => {
                                                const p = assignedCourse.price;
                                                const num = typeof p === 'string' ? parseFloat(p.replace(/[^\d]/g, '')) : p;
                                                if (isNaN(num)) return '0 UZS';
                                                return Math.round(num / 12).toLocaleString() + ' UZS';
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.debtStatusBox, { backgroundColor: isDebtor ? (isDarkMode ? 'rgba(239,68,68,0.15)' : '#FFF0F0') : (isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE') }]}>
                                <Ionicons name={isDebtor ? "alert-circle" : "checkmark-circle"} size={20} color={isDebtor ? theme.error : '#27AE60'} />
                                <Text style={[styles.debtStatusText, { color: isDebtor ? theme.error : '#27AE60' }]}>
                                    {isDebtor ? `Diqqat! ${Math.abs(student.balance || 0).toLocaleString()} UZS qarzdorlik bor` : "Talaba balansi ijobiy holatda"}
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.noGroupFinance}>
                            <Ionicons name="information-circle-outline" size={32} color="#BDBDBD" />
                            <Text style={styles.noGroupText}>To'lov ma'lumotlari uchun guruhga qo'shing</Text>
                        </View>
                    )}
                </View>

                {/* Credentials & Contact Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ma'lumotlar va Kirish</Text>
                </View>
                <View style={styles.infoList}>
                    <InfoRow icon="call-outline" label="Telefon" value={student.phone} />
                    <InfoRow icon="mail-outline" label="Email" value={student.email} />
                    <InfoRow icon="person-outline" label="Login" value={student.login} />
                    <InfoRow icon="lock-closed-outline" label="Parol" value={student.password} isPassword={true} />
                    <InfoRow icon="card-outline" label="To'lov rejasi" value={student.paymentPlan === 'Full' ? "To'liq" : (student.paymentPlan === 'Monthly' ? 'Oylik' : 'Individual')} />
                    <InfoRow icon="time-outline" label="Qo'shilgan sana" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "Noma'lum"} />
                </View>

                {/* Recent Payments Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Oxirgi To'lovlar</Text>
                </View>
                <View style={styles.paymentList}>
                    {studentPayments.length > 0 ? (
                        studentPayments.map((payment, index) => (
                            <View key={payment.id || index} style={[styles.paymentCard, { backgroundColor: theme.surface }]}>
                                <View style={[styles.paymentIcon, { backgroundColor: payment.type === 'Income' ? (isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE') : (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FFF0F0') }]}>
                                    <Ionicons name={payment.type === 'Income' ? "arrow-down" : "arrow-up"} size={20} color={payment.type === 'Income' ? "#27AE60" : theme.error} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.paymentTitle, { color: theme.text }]}>{payment.title}</Text>
                                    <Text style={[styles.paymentDate, { color: theme.textSecondary }]}>{payment.date}</Text>
                                </View>
                                <Text style={[styles.paymentAmount, { color: payment.type === 'Income' ? "#27AE60" : theme.error }]}>
                                    {payment.amount}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyPayments}>
                            <Text style={[styles.emptyPaymentsText, { color: theme.textLight }]}>Hali to'lovlar mavjud emas</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {isDesktop ? <DesktopLayout /> : <MobileLayout />}
            <PremiumModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                title="Profilni Tahrirlash"
                subtitle="O'quvchi ma'lumotlarini o'zgartirish"
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
                    <Text style={styles.inputLabel}>Guruhni tanlang</Text>
                    <View style={styles.chipRow}>
                        {courses.map(course => (
                            <TouchableOpacity
                                key={course.id}
                                style={[styles.courseChip, selectedCourseId === course.id && { backgroundColor: theme.primary }]}
                                onPress={() => setSelectedCourseId(course.id)}
                            >
                                <Text style={[styles.courseChipText, selectedCourseId === course.id && { color: 'white', fontWeight: 'bold' }]}>
                                    {course.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>To'lov rejasi</Text>
                    <View style={styles.chipRow}>
                        {['Monthly', 'Full', 'Individual'].map(plan => (
                            <TouchableOpacity
                                key={plan}
                                style={[styles.courseChip, paymentPlan === plan && { backgroundColor: theme.primary }]}
                                onPress={() => setPaymentPlan(plan)}
                            >
                                <Text style={[styles.courseChipText, paymentPlan === plan && { color: 'white', fontWeight: 'bold' }]}>
                                    {plan === 'Full' ? 'To\'liq' : (plan === 'Monthly' ? 'Oylik' : 'Individual')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </PremiumModal>

            {/* Balance Modal */}
            <PremiumModal
                visible={balanceModalVisible}
                onClose={() => setBalanceModalVisible(false)}
                title={transactionType === 'deposit' ? 'Balansni to\'ldirish' : 'Qarzdorlikni yopish'}
                subtitle="Amaliyot summasini kiriting"
                headerGradient={['#10b981', '#059669']}
                footer={
                    <PremiumButton
                        title="Tasdiqlash"
                        onPress={handleTransaction}
                        gradient={['#10b981', '#059669']}
                        style={{ flex: 1 }}
                    />
                }
            >
                <PremiumInput
                    label="Summani kiriting (UZS)"
                    placeholder="Masalan: 500,000"
                    keyboardType="numeric"
                    value={transactionAmount}
                    onChangeText={setTransactionAmount}
                    icon="cash-outline"
                    autoFocus
                />
            </PremiumModal>

            {/* Attendance Modal */}
            <PremiumModal
                visible={attendanceModalVisible}
                onClose={() => setAttendanceModalVisible(false)}
                title="Davomat Tarixi"
                subtitle={student.name}
                headerGradient={['#5865F2', '#404EED']}
            >
                {studentAttendance.length > 0 ? (
                    studentAttendance.map((record, index) => (
                        <View key={record.id || index} style={[styles.attendanceCard, { backgroundColor: theme.surface }]}>
                            <View style={[styles.attendanceStatusDot, { backgroundColor: record.status === 'Present' ? '#27AE60' : '#EB5757' }]} />
                            <View style={{ flex: 1 }}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.attendanceDate, { color: theme.text }]}>{record.date}</Text>
                                    <Text style={[styles.attendanceStatusText, { color: record.status === 'Present' ? '#27AE60' : '#EB5757' }]}>
                                        {record.status === 'Present' ? 'Kelgan' : 'Kelmagan'}
                                    </Text>
                                </View>
                                <Text style={styles.attendanceCourse}>{record.courseName}</Text>
                                {(record.reason || record.note) && (
                                    <View style={styles.attendanceDetailBox}>
                                        <Text style={styles.attendanceDetailText}>
                                            {record.reason ? `${t[record.reason] || record.reason}` : ''}
                                            {record.reason && record.note ? ' • ' : ''}
                                            {record.note}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
                        <Text style={styles.emptyText}>Davomat ma'lumotlari topilmadi</Text>
                    </View>
                )}
            </PremiumModal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        justifyContent: 'space-between',
        backgroundColor: 'white'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    // Simplified BackBtn
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FE' },
    editBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },

    // ... all old styles kept ...

    // Add missing or needed styles for safety inside StyleSheet
    scrollContent: { paddingBottom: 40 },
    profileSection: { alignItems: 'center', paddingVertical: 20, backgroundColor: 'white', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    avatarLargeText: { fontSize: 40, fontWeight: 'bold' },
    studentName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 15 },
    statBox: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    statCurrency: { fontSize: 12, color: '#828282' },
    statLabel: { fontSize: 12, color: '#828282', fontWeight: '500' },
    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25 },
    actionItem: { alignItems: 'center', gap: 10 },
    actionIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 12, color: '#828282', fontWeight: '500' },
    sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    card: { marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    courseContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    courseIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    courseTitle: { fontSize: 18, fontWeight: 'bold' },
    courseSubtitle: { fontSize: 13, color: '#828282', marginVertical: 2 },
    courseMeta: { flexDirection: 'row', gap: 15, marginTop: 6 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#828282' },
    noGroup: { alignItems: 'center', paddingVertical: 10 },
    noGroupText: { color: '#828282', fontSize: 14 },
    assignLink: { marginTop: 10 },
    assignLinkText: { color: COLORS.primary, fontWeight: 'bold' },
    infoList: { marginHorizontal: 20, gap: 12 },
    infoItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, gap: 15 },
    infoIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8F9FE', alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 12, color: '#828282', marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500' },
    paymentList: { marginHorizontal: 20, gap: 12 },
    paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 15 },
    paymentIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    paymentTitle: { fontSize: 15, fontWeight: 'bold' },
    paymentDate: { fontSize: 12, color: '#828282', marginTop: 2 },
    paymentAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyPayments: { alignItems: 'center', padding: 30 },
    emptyPaymentsText: { color: '#828282', fontSize: 14 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
    // Finance Card Styles
    financeCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    financeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    financeItem: { flex: 1 },
    financeLabel: { fontSize: 13, color: '#828282', marginBottom: 8, fontWeight: '500' },
    financeValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    financeValue: { fontSize: 16, fontWeight: '700' },
    financeDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0', mx: 15 },
    debtStatusBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, gap: 10 },
    debtStatusText: { fontSize: 13, fontWeight: '600' },
    noGroupFinance: { alignItems: 'center', paddingVertical: 10, gap: 10 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#828282', marginBottom: 8, marginTop: 15 },
    modalInput: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 20 },
    courseChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F2' },
    activeCourseChip: { backgroundColor: COLORS.primary },
    courseChipText: { color: '#828282', fontSize: 13 },
    activeCourseChipText: { color: 'white', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#1F2022', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    // Balance Modal styles
    centeredModal: { flex: 1, justifyContent: 'center', padding: 20 },
    balanceModal: { padding: 24, borderRadius: 32, alignItems: 'center' },
    balanceModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    balanceInput: { width: '100%', height: 60, fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.primary, marginBottom: 30 },
    modalActions: { flexDirection: 'row', gap: 15 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F2' },
    cancelBtnText: { fontWeight: 'bold', color: '#828282' },
    confirmBtn: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { fontWeight: 'bold', color: 'white' },
    // Attendance Modal Specific Styles
    modalSubTitle: { fontSize: 14, color: '#828282', marginTop: 4 },
    attendanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    attendanceStatusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 15 },
    attendanceDate: { fontSize: 16, fontWeight: '700' },
    attendanceStatusText: { fontSize: 14, fontWeight: '600' },
    attendanceCourse: { fontSize: 12, color: '#828282', marginTop: 2 },
    attendanceDetailBox: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F2',
    },
    attendanceDetailText: { fontSize: 12, color: '#5865F2', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, opacity: 0.5 },
    emptyText: { fontSize: 14, color: '#828282', marginTop: 10 },
    // Desktop Styles
    desktopContainer: { flex: 1 },
    desktopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    desktopBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 8,
    },
    desktopBackText: { fontSize: 14, fontWeight: '600' },
    desktopHeaderActions: { flexDirection: 'row', gap: 12 },
    desktopActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    desktopActionText: { fontSize: 14, fontWeight: '600' },
    desktopScrollContent: { padding: 32 },
    desktopContentRow: { flexDirection: 'row', gap: 24 },
    desktopLeftColumn: { width: 340, gap: 20 },
    desktopRightColumn: { flex: 1, gap: 20 },
    desktopProfileCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    desktopAvatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    desktopAvatarText: { fontSize: 40, fontWeight: '700' },
    desktopStudentName: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    desktopStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    desktopStatusText: { fontSize: 13, fontWeight: '600' },
    desktopBalanceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 20,
        gap: 12,
    },
    desktopBalanceLabel: { fontSize: 12 },
    desktopBalanceValue: { fontSize: 18, fontWeight: '700' },
    desktopQuickActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        marginTop: 16,
    },
    desktopQuickBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    desktopCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    desktopCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    desktopCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    desktopGroupContent: { alignItems: 'center' },
    desktopGroupIcon: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    desktopGroupTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
    desktopGroupSub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
    desktopGroupMeta: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    desktopMetaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    desktopNoGroup: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    desktopAddGroupBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    desktopAttendanceStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    desktopAttendanceCircle: {
        alignItems: 'center',
    },
    desktopAttendanceValue: { fontSize: 32, fontWeight: '700' },
    desktopViewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    desktopInfoGrid: { gap: 16 },
    desktopInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    desktopInfoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    desktopInfoLabel: { fontSize: 12, marginBottom: 2 },
    desktopInfoValue: { fontSize: 15, fontWeight: '600' },
    desktopPaymentGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    desktopPaymentItem: {
        flex: 1,
        padding: 20,
        borderRadius: 14,
        alignItems: 'center',
        gap: 8,
    },
    desktopPaymentLabel: { fontSize: 12 },
    desktopPaymentValue: { fontSize: 16, fontWeight: '700' },
    desktopAddPaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    desktopPaymentsList: { gap: 12 },
    desktopPaymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 14,
    },
    desktopPaymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    desktopPaymentTitle: { fontSize: 14, fontWeight: '600' },
    desktopEmptyPayments: {
        alignItems: 'center',
        paddingVertical: 30,
    },
});

export default StudentDetailScreen;

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import Header from '../components/Header';
import { SchoolContext } from '../context/SchoolContext';
import { useContext, useState } from 'react'; // Added useState
import { ThemeContext } from '../context/ThemeContext'; // Ensure ThemeContext is used if needed for consistency
import { Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native'; // Added Modal comps

import { LanguageContext } from '../context/LanguageContext';

const ContactItem = ({ icon, value, label }) => (
    <View style={styles.contactItem}>
        <View style={styles.contactIcon}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View>
            <Text style={styles.contactLabel}>{label}</Text>
            <Text style={styles.contactValue}>{value}</Text>
        </View>
    </View>
);

const StudentDetailScreen = ({ route, navigation }) => {
    const { student } = route.params || { student: null };

    const { courses, updateStudent } = useContext(SchoolContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    const [modalVisible, setModalVisible] = useState(false);
    const [changeGroupModalVisible, setChangeGroupModalVisible] = useState(false);

    // Edit Form State
    const [name, setName] = useState(student?.name || '');
    const [phone, setPhone] = useState(student?.phone || '');
    const [email, setEmail] = useState(student?.email || '');
    const [address, setAddress] = useState(student?.address || '');
    const [login, setLogin] = useState(student?.login || '');
    const [password, setPassword] = useState(student?.password || '');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(student?.assignedCourseId || null);

    // Balance and Transaction State
    const [balanceModalVisible, setBalanceModalVisible] = useState(false);
    const [transactionType, setTransactionType] = useState('deposit'); // 'deposit' or 'withdraw'
    const [transactionAmount, setTransactionAmount] = useState('');

    // Find assigned course details
    const assignedCourse = courses.find(c => c.id === (selectedCourseId || student?.assignedCourseId)) ||
        courses.find(c => c.title === student?.course); // Fallback to name match

    if (!student) return <View><Text>Student not found</Text></View>;

    const handleEditPress = () => {
        // Initialize state with current student data if not already set or stale
        setName(student.name);
        setPhone(student.phone);
        setEmail(student.email || '');
        setAddress(student.address || '');
        setLogin(student.login || '');
        setPassword(student.password || '');
        setSelectedCourseId(student.assignedCourseId || courses.find(c => c.title === student.course)?.id);
        // setStatus(student.status);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!name || !selectedCourseId) {
            Alert.alert(t.error, t.errorFillFields);
            return;
        }

        const courseObj = courses.find(c => c.id === selectedCourseId);
        const updatedStudent = {
            ...student,
            name,
            phone,
            email,
            address,
            login,
            password,
            assignedCourseId: selectedCourseId,
            course: courseObj ? courseObj.title : 'General',
            status: selectedCourseId ? 'Active' : 'Pending'
        };

        updateStudent(student.id, updatedStudent);
        setModalVisible(false);
        // Optionally update local params or rely on context re-render if using context for current student
        // Since we pass via route.params, the displayed data might be stale unless we go back or update navigation params
        navigation.setParams({ student: updatedStudent });
    };

    const handleChangeGroupSave = () => {
        if (!selectedCourseId) {
            Alert.alert(t.error, t.errorFillFields);
            return;
        }

        const courseObj = courses.find(c => c.id === selectedCourseId);
        const updatedStudent = {
            ...student,
            assignedCourseId: selectedCourseId,
            course: courseObj ? courseObj.title : 'General',
            status: selectedCourseId ? 'Active' : 'Pending'
        };

        updateStudent(student.id, updatedStudent);
        setChangeGroupModalVisible(false);
        navigation.setParams({ student: updatedStudent });
    };

    const openChangeGroupModal = () => {
        setSelectedCourseId(student?.assignedCourseId || courses.find(c => c.title === student.course)?.id);
        setChangeGroupModalVisible(true);
    };

    const handleTransaction = () => {
        if (!transactionAmount || isNaN(transactionAmount)) {
            Alert.alert(t.error, 'Please enter a valid amount');
            return;
        }

        const amount = parseFloat(transactionAmount);
        const currentBalance = student.balance || 0;
        let newBalance = currentBalance;

        if (transactionType === 'deposit') {
            newBalance += amount;
        } else {
            if (currentBalance < amount) {
                Alert.alert(t.error, 'Insufficient funds');
                return;
            }
            newBalance -= amount;
        }

        const updatedStudent = {
            ...student,
            balance: newBalance
        };

        updateStudent(student.id, updatedStudent);
        setBalanceModalVisible(false);
        setTransactionAmount('');
        navigation.setParams({ student: updatedStudent });
    };

    const openBalanceModal = (type) => {
        setTransactionType(type);
        setBalanceModalVisible(true);
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header
                title={t.studentProfile}
                rightIcon="pencil"
                onRightPress={handleEditPress}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Redesigned Profile Header */}
                <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={{ uri: student.image || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                            style={styles.avatar}
                        />
                        <View style={{ marginLeft: 15, flex: 1 }}>
                            <View style={[globalStyles.rowBetween, { alignItems: 'flex-start' }]}>
                                <View>
                                    <Text style={[styles.name, { color: theme.text }]}>{student.name}</Text>
                                    <Text style={[styles.id, { color: theme.textSecondary }]}>ID: {student.id}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: student.status === 'Active' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                                    <Text style={[styles.statusText, { color: student.status === 'Active' ? COLORS.success : COLORS.warning }]}>
                                        {student.status || 'Pending'}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.headerCredentials, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8, paddingTop: 8 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="person-outline" size={14} color={COLORS.primary} />
                                        <Text style={[styles.headerCredentialText, { color: theme.textSecondary, marginLeft: 4 }]}>
                                            {student.login || 'no login'}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} style={{ marginLeft: 15 }} />
                                        <Text style={[styles.headerCredentialText, { color: theme.textSecondary, marginLeft: 4 }]}>
                                            {showPassword ? (student.password || '••••••••') : '••••••••'}
                                        </Text>
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 8 }}>
                                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={globalStyles.screenPadding}>

                    {/* New Wallet/Balance Card */}
                    <View style={[styles.walletCard, globalStyles.shadow]}>
                        <Text style={styles.walletLabel}>{t.balance || "Balance"}</Text>
                        <Text style={styles.walletBalance}>${(student.balance || 0).toLocaleString()}</Text>

                        <View style={styles.walletActions}>
                            <TouchableOpacity
                                style={[styles.walletBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={() => openBalanceModal('deposit')}
                            >
                                <Ionicons name="arrow-down" size={20} color={COLORS.white} />
                                <Text style={styles.walletBtnText}>{t.deposit || "Deposit"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.walletBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={() => openBalanceModal('withdraw')}
                            >
                                <Ionicons name="arrow-up" size={20} color={COLORS.white} />
                                <Text style={styles.walletBtnText}>{t.withdraw || "Withdraw"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>{t.contactInfo}</Text>
                    <View style={[globalStyles.card, globalStyles.shadow, styles.infoCard]}>
                        <ContactItem icon="mail" label="Email" value={student.email || "Not set"} />
                        <View style={styles.divider} />
                        <ContactItem icon="call" label={t.phone} value={student.phone || "+998 90 123 45 67"} />
                        <View style={styles.divider} />
                        <ContactItem icon="location" label={t.address} value={student.address || "Not set"} />
                    </View>

                    {/* New Interesting Stats Section */}
                    <Text style={styles.sectionTitle}>{t.performance || "Performance"}</Text>
                    <View style={[globalStyles.rowBetween, { marginBottom: SIZES.base }]}>
                        <View style={[globalStyles.card, globalStyles.shadow, styles.statBox, { backgroundColor: theme.surface }]}>
                            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            </View>
                            <Text style={styles.statValue}>92%</Text>
                            <Text style={styles.statLabel}>{t.attendance || "Attendance"}</Text>
                        </View>
                        <View style={[globalStyles.card, globalStyles.shadow, styles.statBox, { backgroundColor: theme.surface }]}>
                            <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '20' }]}>
                                <Ionicons name="star" size={20} color={COLORS.warning} />
                            </View>
                            <Text style={styles.statValue}>4.8</Text>
                            <Text style={styles.statLabel}>{t.rating || "Avg Score"}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>{t.enrolledCourses}</Text>
                    <View style={[globalStyles.card, globalStyles.shadow, styles.courseCard]}>
                        {!assignedCourse && !student.course ? (
                            <TouchableOpacity
                                style={{ alignItems: 'center', padding: 20 }}
                                onPress={handleEditPress} // Open edit modal to assign course
                            >
                                <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
                                <Text style={{ ...FONTS.body3, color: theme.textSecondary, marginTop: 10 }}>
                                    {t.assignCourse || "Assign to Group"}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <View style={styles.courseHeader}>
                                    <View style={[styles.courseIcon, { backgroundColor: assignedCourse?.color ? assignedCourse.color + '20' : COLORS.primary + '20' }]}>
                                        <Ionicons name={assignedCourse?.icon || "book"} size={20} color={assignedCourse?.color || COLORS.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.courseTitle}>{assignedCourse?.title || student.course}</Text>
                                        <Text style={styles.courseInstructor}>{assignedCourse?.instructor || t.instructorNotAssigned}</Text>
                                    </View>
                                    {assignedCourse && (
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <View style={[styles.courseBadge, { backgroundColor: COLORS.success + '20', marginBottom: 4 }]}>
                                                <Text style={[styles.courseBadgeText, { color: COLORS.success }]}>Active</Text>
                                            </View>
                                            <TouchableOpacity onPress={openChangeGroupModal}>
                                                <Text style={[styles.courseBadgeText, { color: COLORS.primary, fontSize: 12 }]}>Change</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                {assignedCourse ? (
                                    <View style={styles.courseMetaRow}>
                                        <View style={styles.courseMetaItem}>
                                            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                                            <Text style={[styles.courseMetaText, { color: theme.textSecondary }]}>{assignedCourse.days}</Text>
                                        </View>
                                        <View style={styles.courseMetaItem}>
                                            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                                            <Text style={[styles.courseMetaText, { color: theme.textSecondary }]}>{assignedCourse.time}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={[styles.courseMetaText, { color: theme.textSecondary, marginTop: 4 }]}>
                                        {t.noScheduleInfo || "No schedule information available"}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>{t.recentPayments}</Text>
                    <View style={[globalStyles.card, globalStyles.shadow, { padding: SIZES.padding }]}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={styles.paymentTitle}>October Tuition</Text>
                            <Text style={[styles.paymentAmount, { color: COLORS.success }]}>+$200.00</Text>
                        </View>
                        <Text style={styles.paymentDate}>Oct 05, 2023</Text>
                    </View>

                </View>
            </ScrollView>


            {/* Edit Modal (Duplicated for accessibility in Detail View) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.editStudent}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.fullName}</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.phone}</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.address || "Address"}</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholderTextColor={theme.textLight}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Email (for recovery)</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="example@mail.com"
                                placeholderTextColor={theme.textLight}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={globalStyles.rowBetween}>
                            <View style={[styles.inputContainer, { width: '48%' }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>{t.login || "Login"}</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    value={login}
                                    onChangeText={setLogin}
                                    placeholder="Login"
                                    placeholderTextColor={theme.textLight}
                                />
                            </View>
                            <View style={[styles.inputContainer, { width: '48%' }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>{t.password || "Password"}</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Password"
                                    placeholderTextColor={theme.textLight}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.assignCourse}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                {courses.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.courseChip,
                                            selectedCourseId === c.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                            { borderColor: theme.border, backgroundColor: selectedCourseId === c.id ? COLORS.primary : theme.background }
                                        ]}
                                        onPress={() => setSelectedCourseId(c.id)}
                                    >
                                        <Text style={[
                                            styles.courseChipText,
                                            selectedCourseId === c.id ? { color: COLORS.white } : { color: theme.text }
                                        ]}>
                                            {c.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>



                        <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                            <Text style={styles.submitBtnText}>{t.saveChanges}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal >

            {/* Change Group Modal - Simplified */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={changeGroupModalVisible}
                onRequestClose={() => setChangeGroupModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: theme.surface, height: 'auto', paddingBottom: 40 }]}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.assignCourse}</Text>
                            <TouchableOpacity onPress={() => setChangeGroupModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, { color: theme.textSecondary }]}>Select a group to assign:</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 20 }}>
                            {courses.map((c) => (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[
                                        styles.courseChip,
                                        selectedCourseId === c.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                        { borderColor: theme.border, backgroundColor: selectedCourseId === c.id ? COLORS.primary : theme.background }
                                    ]}
                                    onPress={() => setSelectedCourseId(c.id)}
                                >
                                    <Text style={[
                                        styles.courseChipText,
                                        selectedCourseId === c.id ? { color: COLORS.white } : { color: theme.text }
                                    ]}>
                                        {c.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleChangeGroupSave}>
                            <Text style={styles.submitBtnText}>{t.saveChanges}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Balance Transaction Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={balanceModalVisible}
                onRequestClose={() => setBalanceModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalView, { backgroundColor: theme.surface, height: 'auto', paddingBottom: 30 }]}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {transactionType === 'deposit' ? (t.deposit || 'Deposit Funds') : (t.withdraw || 'Withdraw Funds')}
                            </Text>
                            <TouchableOpacity onPress={() => setBalanceModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.amount || "Amount"}</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, fontSize: 20, fontWeight: 'bold' }]}
                                value={transactionAmount}
                                onChangeText={setTransactionAmount}
                                keyboardType="numeric"
                                placeholder="$0.00"
                                placeholderTextColor={theme.textLight}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitBtn,
                                { backgroundColor: transactionType === 'deposit' ? COLORS.success : COLORS.danger }
                            ]}
                            onPress={handleTransaction}
                        >
                            <Text style={styles.submitBtnText}>
                                {transactionType === 'deposit' ? (t.confirmDeposit || 'Confirm Deposit') : (t.confirmWithdraw || 'Confirm Withdraw')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    profileHeader: {
        padding: SIZES.padding,
        marginBottom: SIZES.base,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    walletCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        marginBottom: 20,
    },
    walletLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    walletBalance: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    walletActions: {
        flexDirection: 'row',
        marginTop: 10,
    },
    walletBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 30,
        marginRight: 10,
    },
    walletBtnText: {
        color: COLORS.white,
        fontWeight: '600',
        marginLeft: 6,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    name: {
        ...FONTS.h2,
        fontWeight: 'bold',
    },
    id: {
        ...FONTS.body4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: SIZES.padding,
    },
    statusText: {
        ...FONTS.small,
        fontWeight: 'bold',
    },
    courseChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    courseChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    courseBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    courseBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    courseMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0', // Fallback or use theme in component
    },
    courseMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    courseMetaText: {
        fontSize: 12,
        marginLeft: 4,
    },
    sectionTitle: {
        ...FONTS.h4,
        color: COLORS.textSecondary,
        marginBottom: SIZES.base,
        marginLeft: 4,
        marginTop: SIZES.base,
    },
    infoCard: {
        padding: SIZES.padding,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactLabel: {
        ...FONTS.small,
        color: COLORS.textLight,
    },
    contactValue: {
        ...FONTS.body4,
        color: COLORS.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 4,
    },
    courseCard: {
        padding: SIZES.padding,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    courseIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    courseTitle: {
        ...FONTS.body3,
        fontWeight: '600',
        color: COLORS.text,
    },
    courseInstructor: {
        ...FONTS.small,
        color: COLORS.textSecondary,
    },
    progressContainer: {
        marginTop: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressText: {
        ...FONTS.small,
        color: COLORS.textLight,
        textAlign: 'right',
    },
    paymentTitle: {
        ...FONTS.body3,
        fontWeight: '500',
        color: COLORS.text,
    },
    paymentAmount: {
        ...FONTS.h4,
        fontWeight: 'bold',
    },
    paymentDate: {
        ...FONTS.small,
        color: COLORS.textLight,
    },
    // Modal Styles Copied
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SIZES.padding,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        ...FONTS.h3,
        marginBottom: SIZES.padding
    },
    inputContainer: {
        marginBottom: SIZES.padding
    },
    label: {
        ...FONTS.body4,
        marginBottom: 8
    },
    input: {
        height: 50,
        borderRadius: SIZES.radius,
        paddingHorizontal: 15,
        borderWidth: 1,
        ...FONTS.body3
    },
    statusOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.base
    },
    submitBtnText: {
        color: COLORS.white,
        ...FONTS.h3
    },
    courseChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statBox: {
        width: '48%',
        padding: SIZES.padding,
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        ...FONTS.h3,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        ...FONTS.small,
        color: COLORS.textSecondary,
    },
    headerCredentials: {
        width: '100%',
    },
    headerCredentialText: {
        fontSize: 12,
        fontWeight: '500',
    }
});

export default StudentDetailScreen;

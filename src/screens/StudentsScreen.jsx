import React, { useState, useContext } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Text, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import Input from '../components/Input';
import ListItem from '../components/ListItem';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';

const StudentsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { students, courses, addStudent, updateStudent, deleteStudent } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All'); // All, Active, Pending, Graduated
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
            student.course.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || student.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleSaveStudent = () => {
        if (!name || !selectedCourseId) {
            Alert.alert(t.error, t.errorFillFields);
            return;
        }

        const courseObj = courses.find(c => c.id === selectedCourseId);

        const studentData = {
            name,
            phone,
            email,
            address,
            login,
            password,
            course: courseObj ? courseObj.title : 'General',
            assignedCourseId: selectedCourseId,
            status: selectedCourseId ? 'Active' : 'Pending',
            avatar: null
        };

        showLoader('Saqlanmoqda...');
        try {
            if (isEditing) {
                const original = students.find(s => s.id === editingId);
                updateStudent(editingId, { ...original, ...studentData });
            } else {
                addStudent(studentData);
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
        setEmail('');
        setAddress('');
        setLogin('');
        setPassword('');
        setSelectedCourseId(null);
    };

    const handleEdit = (student) => {
        setIsEditing(true);
        setEditingId(student.id);
        setName(student.name);
        setPhone(student.phone || '');
        setEmail(student.email || '');
        setAddress(student.address || '');
        setLogin(student.login || '');
        setPassword(student.password || '');
        setSelectedCourseId(student.assignedCourseId || (courses.find(c => c.title === student.course)?.id));
        setModalVisible(true);
    };

    const handleLongPress = (student) => {
        Alert.alert(
            t.manageStudent || "Manage Student",
            `${t.manageStudentPrompt || "What do you want to do with"} ${student.name}?`,
            [
                { text: t.cancel, style: "cancel" },
                { text: t.editStudent || "Edit", onPress: () => handleEdit(student) },
                { text: t.deleteStudent || "Delete", style: "destructive", onPress: () => confirmDelete(student.id) }
            ]
        );
    };

    const confirmDelete = (id) => {
        Alert.alert(
            t.deleteStudent || "Delete Student",
            t.deleteStudentConfirm || "Are you sure you want to delete this student?",
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.deleteStudent || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader('O\'chirilmoqda...');
                        try {
                            await deleteStudent(id);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const renderFilterBtn = (key, label) => (
        <TouchableOpacity
            style={[
                styles.filterBtn,
                filter === key ? styles.activeFilterBtn : { backgroundColor: theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFilter(key)}
        >
            <Text style={[
                styles.filterText,
                filter === key ? styles.activeFilterText : { color: theme.textSecondary }
            ]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header title={t.students} subtitle={t.manageStudents || "Manage Students"} />

            <View style={{ flex: 1 }}>
                <View style={[globalStyles.screenPadding, { paddingBottom: 0 }]}>
                    <Input
                        icon="search-outline"
                        placeholder={t.searchStudents}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={[styles.filterContainer, { marginTop: SIZES.base * 2, paddingHorizontal: SIZES.padding }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {renderFilterBtn('All', t.seeAll)}
                        {renderFilterBtn('Active', t.active)}
                        {renderFilterBtn('Pending', t.pending)}
                        {renderFilterBtn('Graduated', t.graduated)}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredStudents}
                    keyExtractor={item => item.id.toString()}
                    style={{ flex: 1 }}
                    renderItem={({ item }) => (
                        <ListItem
                            title={item.name}
                            subtitle={item.course}
                            image={item.avatar}
                            onPress={() => navigation.navigate('StudentDetail', { student: item })}
                            onLongPress={() => handleLongPress(item)}
                            rightElement={
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: item.status === 'Active' ? COLORS.success + '20' : COLORS.warning + '20' }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: item.status === 'Active' ? COLORS.success : COLORS.warning }
                                    ]}>{item.status === 'Active' ? t.active : t.pending}</Text>
                                </View>
                            }
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: SIZES.padding }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.noStudentsFound}</Text>
                        </View>
                    }
                />
            </View>

            <TouchableOpacity
                style={globalStyles.fab}
                onPress={() => {
                    closeModal();
                    setModalVisible(true);
                }}
            >
                <Ionicons name="add" size={30} color={COLORS.surface} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={globalStyles.rowBetween}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{isEditing ? t.editStudent : t.addNewStudent}</Text>
                                <TouchableOpacity onPress={closeModal}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>{t.fullName} *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Ex: John Doe"
                                    placeholderTextColor={theme.textLight}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Email (for recovery)</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="example@mail.com"
                                    placeholderTextColor={theme.textLight}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={globalStyles.rowBetween}>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t.phone}</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="+998..."
                                        placeholderTextColor={theme.textLight}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t.address || "Address"}</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="Tashkent..."
                                        placeholderTextColor={theme.textLight}
                                        value={address}
                                        onChangeText={setAddress}
                                    />
                                </View>
                            </View>

                            <View style={globalStyles.rowBetween}>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Login</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="Login"
                                        placeholderTextColor={theme.textLight}
                                        value={login}
                                        onChangeText={setLogin}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="Password"
                                        placeholderTextColor={theme.textLight}
                                        value={password}
                                        onChangeText={setPassword}
                                        autoCapitalize="none"
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
                                                { borderColor: theme.border }
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

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveStudent}>
                                <Text style={styles.submitBtnText}>{isEditing ? t.saveChanges : t.addNewStudent}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    filterContainer: {
        marginTop: SIZES.base,
        marginBottom: SIZES.base * 2,
        height: 40,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    activeFilterBtn: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeFilterText: {
        color: COLORS.surface,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: SIZES.padding,
        height: '80%',
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
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.base,
        marginBottom: 20
    },
    submitBtnText: {
        color: COLORS.white,
        ...FONTS.h3
    },
    courseChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    courseChipText: {
        fontSize: 12,
        fontWeight: '500',
    }
});

export default StudentsScreen;

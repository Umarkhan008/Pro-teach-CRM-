import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import Header from '../components/Header';
import Input from '../components/Input';
import ListItem from '../components/ListItem';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
// import { mockData } from '../data/mockData'; // Removed mockData
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import { generateLogin, generatePassword } from '../utils/generateCredentials';

const TeachersScreen = () => {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);


    const { teachers, courses, addTeacher, updateTeacher, deleteTeacher } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const route = useRoute();

    useEffect(() => {
        if (route.params?.editTeacher) {
            handleEdit(route.params.editTeacher);
            // Clear params after handling to prevent modal reopening on re-focus
            navigation.setParams({ editTeacher: undefined });
        }
    }, [route.params?.editTeacher]);

    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [selectedCourses, setSelectedCourses] = useState([]);

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(search.toLowerCase())
    );

    const matchCourse = (courseId) => {
        if (selectedCourses.includes(courseId)) {
            setSelectedCourses(selectedCourses.filter(id => id !== courseId));
        } else {
            setSelectedCourses([...selectedCourses, courseId]);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSaveTeacher = () => {
        if (!name || !subject) {
            Alert.alert(t.error, 'Please fill in required fields (Name, Subject)');
            return;
        }

        const finalLogin = login || generateLogin(name);
        const finalPassword = password || generatePassword();

        const teacherData = {
            name,
            subject,
            email,
            phone,
            bio,
            students: isEditing ? (teachers.find(t => t.id === editingId)?.students || 0) : 0,
            avatar: avatar,
            login: finalLogin,
            password: finalPassword,
            assignedCourses: selectedCourses
        };

        showLoader('Saqlanmoqda...');
        try {
            if (isEditing) {
                updateTeacher(editingId, teacherData);
            } else {
                addTeacher(teacherData);
                Alert.alert(
                    "Muvaffaqiyatli",
                    `O'qituvchi yaratildi!\n\nLogin: ${finalLogin}\nParol: ${finalPassword}`,
                    [{ text: "OK" }]
                );
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
        setSubject('');
        setEmail('');
        setPhone('');
        setBio('');
        setAvatar(null);
        setLogin('');
        setPassword('');
        setSelectedCourses([]);
    };

    const handleEdit = (teacher) => {
        setIsEditing(true);
        setEditingId(teacher.id);
        setName(teacher.name);
        setSubject(teacher.subject);
        setEmail(teacher.email || '');
        setPhone(teacher.phone || '');
        setBio(teacher.bio || '');
        setAvatar(teacher.avatar);
        setLogin(teacher.login || '');
        setPassword(teacher.password || '');
        setSelectedCourses(teacher.assignedCourses || []);
        setModalVisible(true);
    };

    const handleLongPress = (teacher) => {
        Alert.alert(
            "Manage Teacher",
            `What do you want to do with ${teacher.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Edit", onPress: () => handleEdit(teacher) },
                { text: "Delete", style: "destructive", onPress: () => confirmDelete(teacher.id) }
            ]
        );
    };

    const confirmDelete = (id) => {
        Alert.alert(
            "Delete Teacher",
            "Are you sure you want to delete this teacher?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader('O\'chirilmoqda...');
                        try {
                            await deleteTeacher(id);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header title={t.teachers} subtitle={t.ourInstructors || "Our Instructors"} />

            <View style={globalStyles.screenPadding}>
                <Input
                    icon="search-outline"
                    placeholder={t.search || "Search teachers..."}
                    value={search}
                    onChangeText={setSearch}
                />

                <FlatList
                    data={filteredTeachers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <ListItem
                            title={item.name}
                            subtitle={item.subject}
                            image={item.avatar}
                            onPress={() => navigation.navigate('TeacherDetail', { teacher: item })}
                            onLongPress={() => handleLongPress(item)}
                            rightElement={
                                <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
                                    <Ionicons name="people" size={14} color={theme.textSecondary} />
                                    <Text style={[styles.statsText, { color: theme.textSecondary }]}>{item.students}</Text>
                                </View>
                            }
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="school-outline" size={64} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.noResults || "No teachers found"}</Text>
                        </View>
                    }
                />


            </View>

            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.extendedFab, globalStyles.shadow]}
                    onPress={() => {
                        setIsEditing(false);
                        setName('');
                        setSubject('');
                        setPhone('');
                        setBio('');
                        setAvatar(null);
                        setLogin('');
                        setPassword('');
                        setEmail('');
                        setSelectedCourses([]);
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={24} color={COLORS.white} />
                    <Text style={styles.fabText}>Add Teacher</Text>
                </TouchableOpacity>
            </View>

            {/* Add Teacher Modal - Premium Design */}
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
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{isEditing ? "Edit Teacher" : "Add New Teacher"}</Text>
                                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{isEditing ? "Update details & groups" : "Enter instructor details below"}</Text>
                            </View>
                            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.background }]} onPress={closeModal}>
                                <Ionicons name="close" size={20} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>

                            {/* Avatar Picker */}
                            <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
                                <View style={[
                                    styles.addAvatarCircle,
                                    { borderColor: COLORS.primary, backgroundColor: theme.background },
                                    avatar && { borderStyle: 'solid', borderWidth: 0 }
                                ]}>
                                    {avatar ? (
                                        <Image source={{ uri: avatar }} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="camera" size={30} color={COLORS.primary} />
                                    )}
                                </View>
                                <Text style={[styles.avatarText, { color: COLORS.primary }]}>{avatar ? 'Change Photo' : 'Upload Photo'}</Text>
                            </TouchableOpacity>

                            <View style={globalStyles.rowBetween}>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="Ex: John Doe"
                                        placeholderTextColor={theme.textLight}
                                        value={name}
                                        onChangeText={(text) => {
                                            setName(text);
                                            if (!isEditing && text.length > 2 && !login) {
                                                setLogin(generateLogin(text));
                                                setPassword(generatePassword());
                                            }
                                        }}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Subject *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="Ex: Math"
                                        placeholderTextColor={theme.textLight}
                                        value={subject}
                                        onChangeText={setSubject}
                                    />
                                </View>
                            </View>

                            {/* Credentials Section */}
                            <View style={[styles.credentialsSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <View style={globalStyles.rowBetween}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Login Credentials</Text>
                                    {!isEditing && (
                                        <TouchableOpacity
                                            style={styles.generateBtn}
                                            onPress={() => {
                                                if (!name) {
                                                    Alert.alert("Error", "Please enter teacher name first");
                                                    return;
                                                }
                                                setLogin(generateLogin(name));
                                                setPassword(generatePassword());
                                            }}
                                        >
                                            <Ionicons name="refresh" size={16} color={COLORS.primary} />
                                            <Text style={[styles.generateBtnText, { color: COLORS.primary }]}>Generate</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Login</Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        <Ionicons name="person-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.inputFlex, { color: theme.text }]}
                                            placeholder="Auto-generated or enter"
                                            placeholderTextColor={theme.textLight}
                                            value={login}
                                            onChangeText={setLogin}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.inputFlex, { color: theme.text }]}
                                            placeholder="Auto-generated or enter"
                                            placeholderTextColor={theme.textLight}
                                            value={password}
                                            onChangeText={setPassword}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>
                            </View>


                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address (for recovery)</Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <Ionicons name="mail-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.inputFlex, { color: theme.text }]}
                                        placeholder="example@mail.com"
                                        placeholderTextColor={theme.textLight}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <Ionicons name="call-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.inputFlex, { color: theme.text }]}
                                        placeholder="+1 234 567 8900"
                                        placeholderTextColor={theme.textLight}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>


                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Bio / Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Short description about the teacher..."
                                    placeholderTextColor={theme.textLight}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Assign Groups</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                    {courses.map((course) => (
                                        <TouchableOpacity
                                            key={course.id}
                                            style={[
                                                styles.courseChip,
                                                selectedCourses.includes(course.id) && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                                { borderColor: theme.border }
                                            ]}
                                            onPress={() => matchCourse(course.id)}
                                        >
                                            <Text style={[
                                                styles.courseChipText,
                                                selectedCourses.includes(course.id) ? { color: COLORS.white } : { color: theme.text }
                                            ]}>
                                                {course.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <TouchableOpacity style={[styles.submitBtn, globalStyles.shadow]} onPress={handleSaveTeacher}>
                                <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'Create Teacher Profile'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statsText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: SIZES.padding,
        height: '85%', // Taller modal
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -10
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.padding,
    },
    modalTitle: {
        ...FONTS.h2,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        ...FONTS.body4,
        fontSize: 12,
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formScroll: {
        paddingBottom: 20
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: SIZES.padding * 1.5,
    },
    addAvatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: SIZES.padding
    },
    label: {
        ...FONTS.body4,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderRadius: 12, // Softer corners
        paddingHorizontal: 15,
        borderWidth: 1,
        ...FONTS.body3
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputFlex: {
        flex: 1,
        height: '100%',
        ...FONTS.body3
    },
    textArea: {
        height: 100,
        paddingTop: 15,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 16, // Premium button style
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.base,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnText: {
        color: COLORS.white,
        ...FONTS.h3,
        fontWeight: 'bold',
        fontSize: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    extendedFab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabText: {
        color: COLORS.white,
        ...FONTS.h4,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    },
    credentialsSection: {
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SIZES.padding,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    generateBtnText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    }
});

export default TeachersScreen;

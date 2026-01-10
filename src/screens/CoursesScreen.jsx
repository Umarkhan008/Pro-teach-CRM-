import React, { useState, useContext } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import Input from '../components/Input';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
// import { mockData } from '../data/mockData'; // Removed mockData
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';

const CourseCard = ({ item, onPress, onLongPress }) => (
    <TouchableOpacity
        style={[styles.card, { backgroundColor: item.color }]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
    >
        <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={item.icon || 'book'} size={20} color={COLORS.surface} />
            </View>
            <TouchableOpacity onPress={onLongPress}>
                <Ionicons name="ellipsis-vertical" size={20} color={COLORS.surface} />
            </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
            <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.instructor}>{item.instructor || "Pro Teach"}</Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText}>{item.days} | {item.time}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="people" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText}>{item.students}</Text>
                </View>
            </View>
        </View>

        <View style={styles.cardFooter}>
            <Text style={styles.price}>{item.price}</Text>
            <View style={styles.enrollBtn}>
                <Text style={styles.enrollText}>View</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const CoursesScreen = () => {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, addCourse, updateCourse, deleteCourse, teachers } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [title, setTitle] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);

    const [daysType, setDaysType] = useState('DCHJ'); // 'DCHJ', 'SPSH', 'Individual'
    const [selectedDays, setSelectedDays] = useState([]); // For Individual mode

    // Time split
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [price, setPrice] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [description, setDescription] = useState('');

    const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]; // Uzbek abbreviations for Mon-Sun

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        (course.instructor && course.instructor.toLowerCase().includes(search.toLowerCase()))
    );

    const handleSaveCourse = () => {
        if (!title || !startTime || !endTime || !price) {
            Alert.alert(t.error, 'Please fill in all required fields');
            return;
        }

        if (daysType === 'Individual' && selectedDays.length === 0) {
            Alert.alert(t.error, 'Please select at least one day');
            return;
        }

        const predefinedColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.info, COLORS.warning];
        const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];

        // Construct final days string
        let finalDays = '';
        if (daysType === 'Individual') {
            finalDays = selectedDays.join(', ');
        } else {
            finalDays = daysType;
        }

        const teacherObj = teachers.find(t => t.id === selectedTeacherId);

        // Construct final time string
        const finalTime = `${startTime} - ${endTime}`;

        const courseData = {
            title,
            days: finalDays,
            time: finalTime,
            price: price.startsWith('$') ? price : `$${price}`,
            level,
            description,
            students: isEditing ? (courses.find(c => c.id === editingId)?.students || 0) : 0,
            color: isEditing ? (courses.find(c => c.id === editingId)?.color || randomColor) : randomColor,
            icon: 'people', // Changed default icon to people/group
            instructor: teacherObj ? teacherObj.name : 'Admin',
            instructorId: selectedTeacherId
        };

        showLoader('Saqlanmoqda...');
        try {
            if (isEditing) {
                updateCourse(editingId, courseData);
            } else {
                addCourse(courseData);
            }
            closeModal();
        } finally {
            hideLoader();
        }
    };

    const handleEditCourse = (course) => {
        setIsEditing(true);
        setEditingId(course.id);
        setTitle(course.title);
        setSelectedTeacherId(course.instructorId || teachers.find(t => t.name === course.instructor)?.id || null);

        // Parse Days
        if (course.days === 'DCHJ' || course.days === 'SPSH') {
            setDaysType(course.days);
            setSelectedDays([]);
        } else {
            setDaysType('Individual');
            // Assuming comma spaced e.g. "Du, Ch"
            setSelectedDays(course.days ? course.days.split(', ').filter(Boolean) : []);
        }

        // Parse Time: "14:00 - 15:30"
        if (course.time && course.time.includes('-')) {
            const [start, end] = course.time.split('-').map(s => s.trim());
            setStartTime(start || '');
            setEndTime(end || '');
        } else {
            setStartTime(course.time || '');
            setEndTime('');
        }

        setPrice(course.price.replace('$', ''));
        setLevel(course.level || 'Beginner');
        setDescription(course.description || '');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setEditingId(null);
        setTitle('');
        setSelectedTeacherId(null);
        setDaysType('DCHJ');
        setSelectedDays([]);
        setStartTime('');
        setEndTime('');
        setPrice('');
        setDescription('');
        setLevel('Beginner');
    };

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Group",
            "Are you sure you want to delete this group?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader('O\'chirilmoqda...');
                        try {
                            await deleteCourse(id);
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
            <Header title="Guruhlar" subtitle="All Groups" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={globalStyles.screenPadding}>
                    <Input
                        icon="search-outline"
                        placeholder="Guruhni qidirish..."
                        value={search}
                        onChangeText={setSearch}
                    />

                    <View style={styles.grid}>
                        {filteredCourses.map((item) => (
                            <View key={item.id} style={styles.gridItem}>
                                <CourseCard
                                    item={item}
                                    onPress={() => handleEditCourse(item)}
                                    onLongPress={() => handleDelete(item.id)}
                                />
                            </View>
                        ))}
                    </View>

                    {filteredCourses.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.noResults || "Hech qanday guruh topilmadi"}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.extendedFab, globalStyles.shadow]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color={COLORS.white} />
                    <Text style={styles.fabText}>Guruh qo'shish</Text>
                </TouchableOpacity>
            </View>

            {/* Add Group Modal */}
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
                        <View style={globalStyles.rowBetween}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{isEditing ? 'Guruhni tahrirlash' : 'Yangi guruh'}</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formScroll}>
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Guruh nomi</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Masalan: React Native"
                                    placeholderTextColor={theme.textLight}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Kunlar</Text>
                                <View style={[globalStyles.row, { flexWrap: 'wrap', gap: 8 }]}>
                                    {['DCHJ', 'SPSH', 'Individual'].map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[
                                                styles.levelOption,
                                                daysType === d ? { backgroundColor: COLORS.primary } : { borderWidth: 1, borderColor: theme.border }
                                            ]}
                                            onPress={() => setDaysType(d)}
                                        >
                                            <Text style={{ color: daysType === d ? COLORS.white : theme.text, fontSize: 12 }}>{d}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {daysType === 'Individual' && (
                                    <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                        {WEEKDAYS.map((day) => {
                                            const isSelected = selectedDays.includes(day);
                                            return (
                                                <TouchableOpacity
                                                    key={day}
                                                    style={[
                                                        styles.dayBadge,
                                                        isSelected ? { backgroundColor: COLORS.secondary } : { borderWidth: 1, borderColor: theme.border }
                                                    ]}
                                                    onPress={() => toggleDay(day)}
                                                >
                                                    <Text style={{
                                                        color: isSelected ? COLORS.white : theme.text,
                                                        fontSize: 11,
                                                        fontWeight: isSelected ? 'bold' : 'normal'
                                                    }}>{day}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>

                            <View style={globalStyles.rowBetween}>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Boshlanish vaqti</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="14:00"
                                        placeholderTextColor={theme.textLight}
                                        value={startTime}
                                        onChangeText={setStartTime}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { width: '48%' }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Tugash vaqti</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="15:30"
                                        placeholderTextColor={theme.textLight}
                                        value={endTime}
                                        onChangeText={setEndTime}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Narx</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Masalan: 500000"
                                    placeholderTextColor={theme.textLight}
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>O'qituvchi</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.teacherChip,
                                            !selectedTeacherId && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                            { borderColor: theme.border }
                                        ]}
                                        onPress={() => setSelectedTeacherId(null)}
                                    >
                                        <Text style={[
                                            styles.teacherChipText,
                                            !selectedTeacherId ? { color: COLORS.white } : { color: theme.text }
                                        ]}>
                                            Admin
                                        </Text>
                                    </TouchableOpacity>
                                    {teachers.map((teacher) => (
                                        <TouchableOpacity
                                            key={teacher.id}
                                            style={[
                                                styles.teacherChip,
                                                selectedTeacherId === teacher.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                                { borderColor: theme.border }
                                            ]}
                                            onPress={() => setSelectedTeacherId(teacher.id)}
                                        >
                                            <Text style={[
                                                styles.teacherChipText,
                                                selectedTeacherId === teacher.id ? { color: COLORS.white } : { color: theme.text }
                                            ]}>
                                                {teacher.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveCourse}>
                                <Text style={styles.submitBtnText}>{isEditing ? 'Saqlash' : 'Qo\'shish'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    gridItem: {
        width: '50%',
        padding: 8,
    },
    card: {
        borderRadius: SIZES.radius,
        padding: 12,
        height: 180,
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseTitle: {
        ...FONTS.h4,
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    instructor: {
        ...FONTS.small,
        color: COLORS.surface,
        opacity: 0.9,
        fontSize: 10,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    metaText: {
        fontSize: 10,
        color: COLORS.surface,
        marginLeft: 2,
        opacity: 0.9,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        ...FONTS.h4,
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    enrollBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    enrollText: {
        fontSize: 10,
        color: COLORS.surface,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        width: '100%'
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
        height: '80%',
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
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        ...FONTS.body3
    },
    levelOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    dayBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    textArea: {
        height: 100,
        paddingTop: 15,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 16,
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
    teacherChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    teacherChipText: {
        fontSize: 14,
        fontWeight: '500',
    }
});

export default CoursesScreen;

import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
// import { mockData } from '../data/mockData'; // Removed mockData
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';

const ScheduleScreen = ({ navigation }) => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { schedule, addClass, deleteClass, courses } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    const [selected, setSelected] = useState(new Date().toISOString().split('T')[0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [filteredClasses, setFilteredClasses] = useState([]);

    React.useEffect(() => {
        if (!selected) return;

        const date = new Date(selected);
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayMap[date.getDay()]; // e.g. 'Mon'

        // 1. Get courses that match this day
        const dayCourses = courses.filter(c => {
            if (!c.days) return false;
            // c.days could be "Mon, Wed, Fri" or "DCHJ" (Mon, Wed, Fri in Uzb?)
            // Mapping Uzb codes if strictly used: D=Mon, S=Tue, Ch=Wed, P=Thu, J=Fri, S=Sat, Y=Sun?
            // Assuming simpler "Mon, Wed" format for now as observed in mock data or just text match
            // But simpler check:
            return c.days.includes(dayName) || c.days.includes('Daily'); // rudimentary check
        }).map(c => ({
            id: 'c_' + c.id,
            title: c.title,
            teacher: c.instructor,
            time: c.time,
            room: 'Room 1', // Default for courses if not specified
            isCourse: true
        }));

        // 2. Combine with manual schedule items (if they have a date property? currently they don't seem to have one, defaulting to show all or filtering if added)
        // Current 'schedule' in context seems to be just a list of classes without date?
        // Let's assume 'schedule' items are generic weekly items or we just show them all for now, 
        // OR better: we blend them. For now let's just show dayCourses + schedule.

        setFilteredClasses([...dayCourses, ...schedule]);

    }, [selected, courses, schedule]);

    // Form State
    const [title, setTitle] = useState('');
    const [teacher, setTeacher] = useState('');
    const [time, setTime] = useState('');
    const [room, setRoom] = useState('');

    const handleAddClass = async () => {
        if (!title || !teacher || !time || !room) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newClass = {
            id: Date.now(),
            title,
            teacher,
            time,
            room
        };

        showLoader('Saqlanmoqda...');
        try {
            await addClass(newClass);
            setModalVisible(false);
            setTitle('');
            setTeacher('');
            setTime('');
            setRoom('');
        } finally {
            hideLoader();
        }
    };

    const handleDeleteClass = (item) => {
        Alert.alert(
            "Delete Class",
            `Are you sure you want to delete "${item.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader('O\'chirilmoqda...');
                        try {
                            await deleteClass(item.id);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const renderClassItem = (item) => (
        <View key={item.id} style={[globalStyles.card, globalStyles.shadow, styles.classCard, { backgroundColor: theme.surface, borderLeftColor: COLORS.primary }]}>
            <View style={[styles.timeContainer, { borderRightColor: theme.border }]}>
                <Text style={[styles.timeText, { color: theme.text }]}>{item.time.split(' - ')[0]}</Text>
                <Text style={[styles.durationText, { color: theme.textLight }]}>1.5h</Text>
            </View>

            <View style={styles.classInfo}>
                <Text style={[styles.classTitle, { color: theme.text }]}>{item.title}</Text>
                <View style={styles.classMeta}>
                    <Ionicons name="person" size={12} color={theme.textLight} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.teacher}</Text>
                    <View style={[styles.divider, { backgroundColor: theme.textLight }]} />
                    <Ionicons name="location" size={12} color={theme.textLight} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.room}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => !item.isCourse && handleDeleteClass(item)}>
                {!item.isCourse && <Ionicons name="trash-outline" size={20} color={COLORS.danger} />}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header
                title={t.schedule || "Schedule"}
                subtitle={t.manageTimetable || "Manage Timetable"}
                rightIcon="add"
                onRightPress={() => setModalVisible(true)}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={globalStyles.screenPadding}>

                    <Calendar
                        onDayPress={day => setSelected(day.dateString)}
                        markedDates={{
                            [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' }
                        }}
                        theme={{
                            backgroundColor: theme.surface,
                            calendarBackground: theme.surface,
                            textSectionTitleColor: theme.textSecondary,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: COLORS.primary,
                            dayTextColor: theme.text,
                            textDisabledColor: theme.textLight,
                            dotColor: COLORS.primary,
                            selectedDotColor: '#ffffff',
                            arrowColor: COLORS.primary,
                            monthTextColor: theme.text,
                            indicatorColor: COLORS.primary,
                            textDayFontFamily: 'System',
                            textMonthFontFamily: 'System',
                            textDayHeaderFontFamily: 'System',
                            textDayFontWeight: '300',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '300',
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 14
                        }}
                        style={{
                            marginBottom: SIZES.base * 2,
                            borderRadius: SIZES.radius,
                            elevation: 4,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                        }}
                    />

                    <View style={styles.sectionHeader}>
                        <Text style={[globalStyles.title, { color: theme.text }]}>{t.todaysClasses || "Today's Classes"}</Text>
                        <Text style={styles.dateText}>{selected || "Select a date"}</Text>
                    </View>

                    {filteredClasses.length > 0 ? (
                        filteredClasses.map(renderClassItem)
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: theme.textSecondary }}>No classes for this date</Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Add Class Modal */}
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
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Class</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Class Title</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Ex: React Native Basics"
                                placeholderTextColor={theme.textLight}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Teacher</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Ex: Mr. Smith"
                                placeholderTextColor={theme.textLight}
                                value={teacher}
                                onChangeText={setTeacher}
                            />
                        </View>

                        <View style={globalStyles.rowBetween}>
                            <View style={[styles.inputContainer, { width: '48%' }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Time</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Ex: 14:00 - 15:30"
                                    placeholderTextColor={theme.textLight}
                                    value={time}
                                    onChangeText={setTime}
                                />
                            </View>
                            <View style={[styles.inputContainer, { width: '48%' }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Room</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Ex: Lab 1"
                                    placeholderTextColor={theme.textLight}
                                    value={room}
                                    onChangeText={setRoom}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAddClass}>
                            <Text style={styles.submitBtnText}>Add Class</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.base,
    },
    dateText: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: '600',
    },
    classCard: {
        flexDirection: 'row',
        padding: SIZES.padding * 0.75,
        borderLeftWidth: 4,
        marginBottom: SIZES.base
    },
    timeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: SIZES.base * 2,
        borderRightWidth: 1,
        marginRight: SIZES.base * 2,
    },
    timeText: {
        ...FONTS.h4,
        marginBottom: 4,
    },
    durationText: {
        ...FONTS.small,
    },
    classInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    classTitle: {
        ...FONTS.h4,
        marginBottom: 6,
    },
    classMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        ...FONTS.small,
        marginLeft: 4,
    },
    divider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginHorizontal: 8,
    },
    actionBtn: {
        justifyContent: 'center',
        paddingLeft: SIZES.base,
    },
    // Modal Styles
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
        shadowOffset: {
            width: 0,
            height: -2
        },
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
        marginTop: SIZES.base
    },
    submitBtnText: {
        color: COLORS.white,
        ...FONTS.h3
    }
});

export default ScheduleScreen;

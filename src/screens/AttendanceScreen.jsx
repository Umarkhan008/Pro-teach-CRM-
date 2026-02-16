import React, { useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
    ScrollView,
    useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { ThemeContext } from '../context/ThemeContext';
import { SchoolContext } from '../context/SchoolContext';
import { LanguageContext } from '../context/LanguageContext';
import globalStyles from '../styles/globalStyles';
import { useUI } from '../context/UIContext';

// Enable LayoutAnimation for Android


const AttendanceScreen = ({ route, navigation }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, students, attendance, saveAttendance, updateAttendance } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width >= 1280;
    const { courseId, course } = route.params || {};

    const targetCourse = useMemo(() => {
        return course || courses.find(c => String(c.id) === String(courseId));
    }, [course, courses, courseId]);

    const courseName = targetCourse?.title || 'Guruh nomi';
    const courseTime = targetCourse?.time || 'Vaqt belgilanmagan';

    // Filter students for this course
    const groupStudents = useMemo(() => {
        return students.filter(s => s.assignedCourseId === targetCourse?.id || s.course === courseName);
    }, [students, targetCourse, courseName]);

    // Date and Time
    const today = useRef(new Date()).current;
    const dateStr = today.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateKey = today.toISOString().split('T')[0];

    const [attendanceData, setAttendanceData] = useState({});
    const [history, setHistory] = useState([]); // For Undo action
    const [activeAbsentId, setActiveAbsentId] = useState(null); // To show reason picker
    const [isEditing, setIsEditing] = useState(false);
    const [existingId, setExistingId] = useState(null);

    // Load existing attendance if it exists for this date and course
    // We use a ref to track if we've initialized the state to avoid loops
    const isInitialized = useRef(false);

    useEffect(() => {
        // Hide global loader if it was shown during navigation transition
        hideLoader();
    }, []);

    useEffect(() => {
        if (!targetCourse || isInitialized.current) return;

        const found = attendance.find(a => String(a.courseId) === String(targetCourse.id) && a.date === dateKey);

        if (found) {
            setIsEditing(true);
            setExistingId(found.id);
            // Merge with local state to ensure all students are present
            const mergedData = {};
            groupStudents.forEach(s => {
                if (found.students[s.id]) {
                    mergedData[s.id] = found.students[s.id];
                } else {
                    mergedData[s.id] = { status: 'Present', reason: '', note: '', homework: '0' };
                }
            });
            setAttendanceData(mergedData);
        } else {
            // Initialize with all students "Present"
            const initialData = {};
            groupStudents.forEach(s => {
                initialData[s.id] = { status: 'Present', reason: '', note: '', homework: '0' };
            });
            setAttendanceData(initialData);
        }

        isInitialized.current = true;
    }, [attendance, targetCourse, groupStudents, dateKey]);

    const updateStatus = useCallback((studentId, status, reason = '', note = '', homework = '0') => {
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(attendanceData))]);

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { status, reason, note, homework: prev[studentId]?.homework || homework }
        }));

        if (status === 'Absent') {
            setActiveAbsentId(studentId);
        } else {
            setActiveAbsentId(null);
        }
    }, [attendanceData]);

    const markAll = (status) => {
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(attendanceData))]);
        const newData = {};
        groupStudents.forEach(s => {
            newData[s.id] = { status, reason: '', note: '', homework: '0' };
        });
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAttendanceData(newData);
    };

    const undo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAttendanceData(lastState);
    };

    const presentCount = Object.values(attendanceData).filter(v => v.status === 'Present').length;
    const absentCount = Object.values(attendanceData).filter(v => v.status === 'Absent').length;

    const save = async () => {
        showLoader();
        try {
            const studentsWithNames = {};
            // Inject names to ensure they are sent to Google Sheets
            Object.keys(attendanceData).forEach(key => {
                const student = groupStudents.find(s => String(s.id) === String(key));
                studentsWithNames[key] = {
                    ...attendanceData[key],
                    name: student?.name || 'Talaba'
                };
            });

            const finalAttendance = {
                courseId: targetCourse?.id,
                courseName: courseName,
                courseTime: courseTime,
                courseDays: targetCourse?.days || '',
                date: dateKey,
                students: studentsWithNames,
                timestamp: Date.now()
            };

            if (isEditing && existingId) {
                await updateAttendance(existingId, finalAttendance);
                alert(t.davomatTahrirlangan);
            } else {
                await saveAttendance(finalAttendance);
                alert(`${t.davomatSaqlangan}!\nTalabalar balansidan kunlik to'lovlar yechildi.\n\n${t.keldi}: ${presentCount} \n${t.kelmadi}: ${absentCount}`);
            }
            navigation.goBack();
        } catch (error) {
            console.error(error);
            alert(t.xatolikYuzBerdi);
        } finally {
            hideLoader();
        }
    };

    const ReasonPicker = ({ studentId }) => {
        const reasons = [
            { id: 'sick', label: t.sick, icon: 'thermometer' },
            { id: 'late', label: t.late_status, icon: 'clock' },
            { id: 'excused', label: t.excused, icon: 'file-text' },
            { id: 'unknown', label: t.unknown, icon: 'help-circle' }
        ];

        return (
            <View style={[styles.reasonOverlay, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8F9FE', borderColor: theme.border }]}>
                <View style={styles.tabHeader}>
                    <Text style={[styles.reasonTitle, { color: theme.textSecondary }]}>{t.attendanceDetails}</Text>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.homeworkInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                        <Text style={[styles.homeworkLabel, { color: theme.textLight }]}>{t.vazifa}:</Text>
                        <TextInput
                            style={[styles.homeworkInput, { color: theme.text }]}
                            keyboardType="numeric"
                            value={attendanceData[studentId]?.homework}
                            onChangeText={(text) => {
                                setAttendanceData(prev => ({
                                    ...prev,
                                    [studentId]: { ...prev[studentId], homework: text }
                                }));
                            }}
                            returnKeyType="done"
                            blurOnSubmit={false}
                            selectTextOnFocus={true}
                        />
                    </TouchableOpacity>
                </View>

                {attendanceData[studentId]?.status === 'Absent' && (
                    <>
                        <Text style={[styles.reasonTitle, { color: theme.textSecondary }]}>{t.reasonForAbsence}:</Text>
                        <View style={styles.reasonGrid}>
                            {reasons.map(r => (
                                <TouchableOpacity
                                    key={r.id}
                                    style={[
                                        styles.reasonChip,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        attendanceData[studentId]?.reason === r.id && [styles.reasonChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                                    ]}
                                    onPress={() => {
                                        setAttendanceData(prev => ({
                                            ...prev,
                                            [studentId]: { ...prev[studentId], reason: r.id }
                                        }));
                                    }}
                                >
                                    <Feather name={r.icon} size={14} color={attendanceData[studentId]?.reason === r.id ? '#FFF' : theme.textSecondary} />
                                    <Text style={[styles.reasonLabel, { color: theme.textSecondary }, attendanceData[studentId]?.reason === r.id && styles.reasonLabelActive]}>
                                        {r.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <TextInput
                    style={[styles.reasonInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder={`${t.izoh}...`}
                    placeholderTextColor={theme.textLight}
                    value={attendanceData[studentId]?.note}
                    onChangeText={(text) => {
                        setAttendanceData(prev => ({
                            ...prev,
                            [studentId]: { ...prev[studentId], note: text }
                        }));
                    }}
                />

                <TouchableOpacity
                    style={[styles.closeExpandedBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#EEE' }]}
                    onPress={() => setActiveAbsentId(null)}
                >
                    <Text style={[styles.closeExpandedText, { color: theme.textSecondary }]}>{t.yopish}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderStudent = ({ item }) => {
        const studentInfo = attendanceData[item.id] || { status: 'Present' };
        const isPresent = studentInfo.status === 'Present';

        return (
            <View style={[styles.rowContainer, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.studentRow, { backgroundColor: theme.background }]}
                    activeOpacity={0.7}
                    onPress={() => updateStatus(item.id, isPresent ? 'Absent' : 'Present')}
                >
                    <Image source={{ uri: item.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
                    <View style={styles.details}>
                        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                        {studentInfo.reason || studentInfo.note ? (
                            <Text style={styles.reasonNote} numberOfLines={1}>
                                {studentInfo.reason ? `${studentInfo.reason}${studentInfo.note ? ': ' : ''}` : ''}{studentInfo.note}
                            </Text>
                        ) : null}
                    </View>
                    <View style={styles.statusIndicator}>
                        <View style={[styles.statusDot, { backgroundColor: isPresent ? '#4CAF50' : '#F44336' }]} />
                        <Text style={[styles.statusText, { color: isPresent ? '#4CAF50' : '#F44336' }]}>
                            {isPresent ? t.keldi : t.kelmadi}
                        </Text>
                    </View>
                </TouchableOpacity>
                {activeAbsentId === item.id && <ReasonPicker studentId={item.id} />}
            </View>
        );
    };

    const DesktopLayout = () => (
        <View style={styles.desktopContainer}>
            {/* Desktop Header */}
            <View style={[styles.desktopHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.desktopBackBtn}>
                    <Ionicons name="close" size={24} color={theme.text} />
                    <Text style={[styles.desktopBackText, { color: theme.text }]}>{t.yopish || 'Yopish'}</Text>
                </TouchableOpacity>

                <View style={styles.desktopHeaderCenter}>
                    <Text style={[styles.desktopHeaderTitle, { color: theme.text }]}>{t.attendance} — {courseName}</Text>
                    <Text style={[styles.desktopHeaderSub, { color: theme.textSecondary }]}>{dateStr} • {courseTime}</Text>
                </View>

                <View style={styles.desktopHeaderRight}>
                    <View style={styles.desktopActionsBar}>
                        <TouchableOpacity
                            style={[styles.desktopActionBtn, { backgroundColor: '#4CAF5010' }]}
                            onPress={() => markAll('Present')}
                        >
                            <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                            <Text style={{ color: '#4CAF50', fontWeight: '600' }}>{t.hammaKeldi}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.desktopActionBtn, { backgroundColor: isDarkMode ? '#FFFFFF05' : '#F5F5F5' }]}
                            onPress={() => markAll('Absent')}
                        >
                            <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{t.hammaKelmadi}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.desktopActionBtn, { backgroundColor: isDarkMode ? '#FFFFFF05' : '#F5F5F5' }, history.length === 0 && { opacity: 0.5 }]}
                            onPress={undo}
                            disabled={history.length === 0}
                        >
                            <Ionicons name="arrow-undo" size={20} color={theme.primary} />
                            <Text style={{ color: theme.primary, fontWeight: '600' }}>{t.orqaga}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f9fa', borderBottomColor: theme.border }]}>
                <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'center', color: theme.textSecondary }]}>#</Text>
                <Text style={[styles.tableHeaderText, { flex: 3, color: theme.textSecondary }]}>Talaba</Text>
                <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'center', color: theme.textSecondary }]}>Davomat</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'center', color: theme.textSecondary }]}>{t.homework || 'Vazifa'}</Text>
                <Text style={[styles.tableHeaderText, { flex: 3, color: theme.textSecondary }]}>{t.izoh || 'Izoh'}</Text>
            </View>

            {/* Student Rows */}
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {groupStudents.map((student, index) => {
                    const info = attendanceData[student.id] || { status: 'Present', homework: '0', note: '', reason: '' };
                    const isPresent = info.status === 'Present';

                    return (
                        <View key={student.id} style={[styles.tableRow, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                            <Text style={{ flex: 0.5, textAlign: 'center', color: theme.textSecondary, fontWeight: '500' }}>{index + 1}</Text>

                            <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Image source={{ uri: student.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.tableAvatar} />
                                <View>
                                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>{student.name}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>ID: {student.id}</Text>
                                </View>
                            </View>

                            <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                                <TouchableOpacity
                                    style={[styles.statusBtn, isPresent && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }, !isPresent && { borderColor: theme.border }]}
                                    onPress={() => updateStatus(student.id, 'Present', info.reason, info.note, info.homework)}
                                >
                                    <Ionicons name="checkmark" size={18} color={isPresent ? '#FFF' : '#4CAF50'} />
                                    <Text style={[styles.statusBtnText, { color: isPresent ? '#FFF' : '#4CAF50' }]}>{t.keldi}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusBtn, !isPresent && { backgroundColor: '#F44336', borderColor: '#F44336' }, isPresent && { borderColor: theme.border }]}
                                    onPress={() => updateStatus(student.id, 'Absent', info.reason, info.note, info.homework)}
                                >
                                    <Ionicons name="close" size={18} color={!isPresent ? '#FFF' : '#F44336'} />
                                    <Text style={[styles.statusBtnText, { color: !isPresent ? '#FFF' : '#F44336' }]}>{t.kelmadi}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1.5, alignItems: 'center' }}>
                                <TextInput
                                    style={[styles.tableInput, { color: theme.text, borderColor: theme.border, textAlign: 'center', width: 60 }]}
                                    value={info.homework}
                                    onChangeText={(text) => {
                                        setAttendanceData(prev => ({
                                            ...prev,
                                            [student.id]: { ...prev[student.id], homework: text }
                                        }));
                                    }}
                                    placeholder="0"
                                    placeholderTextColor={theme.textLight}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={{ flex: 3 }}>
                                <TextInput
                                    style={[styles.tableInput, { color: theme.text, borderColor: theme.border, paddingHorizontal: 10 }]}
                                    value={info.note}
                                    onChangeText={(text) => {
                                        setAttendanceData(prev => ({
                                            ...prev,
                                            [student.id]: { ...prev[student.id], note: text }
                                        }));
                                    }}
                                    placeholder={t.izoh || "Izoh yozing..."}
                                    placeholderTextColor={theme.textLight}
                                />
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Bottom Save Bar */}
            <View style={[styles.desktopBottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' }} />
                        <Text style={{ color: theme.text }}>{t.keldi}: <Text style={{ fontWeight: 'bold' }}>{presentCount}</Text></Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F44336' }} />
                        <Text style={{ color: theme.text }}>{t.kelmadi}: <Text style={{ fontWeight: 'bold' }}>{absentCount}</Text></Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={save}>
                    <Text style={styles.saveBtnText}>{isEditing ? t.saveChanges : t.saqlash}</Text>
                    <Ionicons name="save-outline" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const MobileLayout = () => (
        <>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Sticky Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>{t.attendance} — {courseName}</Text>
                            {isEditing && (
                                <View style={[styles.editBadge, { backgroundColor: isDarkMode ? 'rgba(88, 101, 242, 0.2)' : '#E8EAF6', borderColor: isDarkMode ? 'rgba(88, 101, 242, 0.4)' : '#C5CAE9' }]}>
                                    <Text style={[styles.editBadgeText, { color: isDarkMode ? '#8E99F3' : '#3F51B5' }]}>{t.tahrirlash.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{dateStr} • {courseTime}</Text>
                    </View>
                    <View style={styles.counterRow}>
                        <View style={[styles.counter, { backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
                            <Text style={[styles.counterText, { color: '#4CAF50' }]}>{presentCount}</Text>
                        </View>
                        <View style={[styles.counter, { backgroundColor: isDarkMode ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE' }]}>
                            <Text style={[styles.counterText, { color: '#F44336' }]}>{absentCount}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions Bar */}
                <View style={[styles.quickActions, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9' }]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => markAll('Present')}
                    >
                        <Ionicons name="checkmark-done" size={18} color="#4CAF50" />
                        <Text style={[styles.actionBtnText, { color: '#4CAF50' }]}>{t.hammaKeldi}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => markAll('Absent')}
                    >
                        <Ionicons name="close" size={18} color={theme.textLight} />
                        <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>{t.hammaKelmadi}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }, history.length === 0 && { opacity: 0.3 }]}
                        onPress={undo}
                        disabled={history.length === 0}
                    >
                        <Ionicons name="arrow-undo" size={16} color={theme.textPrimary} />
                        <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>{t.orqaga}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Student List */}
            <FlatList
                data={groupStudents}
                renderItem={renderStudent}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <Text style={styles.emptyText}>{t.noStudentsInGroup}</Text>
                    </View>
                }
            />

            {/* Sticky Bottom Bar */}
            <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <View style={styles.summaryContainer}>
                    <Text style={[styles.summaryTitle, { color: theme.text }]}>{groupStudents.length} {t.students.toLowerCase()}</Text>
                    <Text style={styles.summaryDetail}>{absentCount} {t.kelmadi.toLowerCase()}</Text>
                </View>
                <TouchableOpacity style={[styles.saveBtn, isEditing && { backgroundColor: theme.primary }]} onPress={save}>
                    <Text style={styles.saveBtnText}>{isEditing ? t.saveChanges : t.saqlash}</Text>
                    <Ionicons name={isEditing ? "save-outline" : "arrow-forward"} size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            {isDesktop ? <DesktopLayout /> : <MobileLayout />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingTop: 5,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerTitleContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editBadge: {
        backgroundColor: '#E8EAF6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#C5CAE9',
    },
    editBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3F51B5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2022',
        maxWidth: '80%',
    },
    counterRow: {
        flexDirection: 'row',
        gap: 6,
    },
    counter: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        minWidth: 35,
        alignItems: 'center',
    },
    counterText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#F9F9F9',
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EEE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 120,
    },
    rowContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFF',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 15,
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2022',
    },
    reasonNote: {
        fontSize: 11,
        color: '#9B51E0',
        marginTop: 2,
        fontWeight: '500',
    },
    statusIndicator: {
        alignItems: 'flex-end',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Reason Picker Style
    reasonOverlay: {
        backgroundColor: '#F8F9FE',
        padding: 15,
        paddingTop: 0,
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8EAF6',
    },
    tabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    homeworkInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    homeworkLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#666',
        marginRight: 5,
    },
    homeworkInput: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2022',
        width: 30,
        textAlign: 'center',
        padding: 0,
    },
    reasonTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#888',
        marginVertical: 10,
        textTransform: 'uppercase',
    },
    reasonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    reasonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        gap: 5,
    },
    reasonChipActive: {
        backgroundColor: '#1F2022',
        borderColor: '#1F2022',
    },
    reasonLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    reasonLabelActive: {
        color: '#FFF',
    },
    reasonInput: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: '#1F2022',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    closeExpandedBtn: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 8,
        backgroundColor: '#EEE',
        borderRadius: 10,
    },
    closeExpandedText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    // Footer Style
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    summaryContainer: null,
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2022',
    },
    summaryDetail: {
        fontSize: 13,
        color: '#F44336',
        fontWeight: '500',
    },
    saveBtn: {
        backgroundColor: '#1F2022',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyView: {
        padding: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
    },
    // Desktop Specific Styles
    desktopContainer: {
        flex: 1,
    },
    desktopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        justifyContent: 'space-between',
    },
    desktopBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    desktopBackText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    desktopHeaderCenter: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    desktopHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    desktopHeaderSub: {
        fontSize: 14,
        marginTop: 2,
    },
    desktopHeaderRight: {
        flexDirection: 'row',
        gap: 20,
    },
    desktopStatBox: {
        alignItems: 'center',
    },
    statBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    desktopContent: {
        flex: 1,
        flexDirection: 'row',
    },
    desktopLeftColumn: {
        flex: 1,
        padding: 24,
    },
    desktopActionsBar: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    desktopActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    desktopGridContent: {
        paddingBottom: 40,
    },
    desktopGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    desktopStudentCard: {
        width: '31.5%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    studentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    desktopAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    desktopStudentName: {
        fontSize: 15,
        fontWeight: '600',
    },
    desktopStudentSub: {
        fontSize: 12,
    },
    studentCardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    desktopStatusBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        gap: 6,
    },
    desktopStatusBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    desktopDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 12,
        gap: 6,
    },
    desktopDetailsBtnText: {
        fontSize: 12,
        fontWeight: '500',
    },
    desktopRightColumn: {
        width: 360,
        borderLeftWidth: 1,
        padding: 24,
    },
    desktopDetailPanel: {
        flex: 1,
    },
    detailPanelTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 24,
    },
    detailTargetInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    largeAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    largeName: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    detailSection: {
        marginBottom: 24,
    },
    detailSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    desktopInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    desktopLargeInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        paddingVertical: 12,
    },
    desktopReasonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    desktopReasonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    desktopReasonLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    desktopNoteInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        height: 120,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    desktopSaveCloseBtn: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 'auto',
    },
    desktopSaveCloseText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    desktopEmptyPanel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyPanelText: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    desktopFinalSaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        width: '100%',
        borderRadius: 14,
        gap: 12,
    },
    desktopFinalSaveText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    // Table Styles
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    tableAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    statusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    statusBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    tableInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 14,
        width: '100%',
    },
    desktopBottomBar: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default AttendanceScreen;

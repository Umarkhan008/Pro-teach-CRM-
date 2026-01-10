import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Header from '../components/Header';
import ListItem from '../components/ListItem';
import globalStyles from '../styles/globalStyles';

const LeadsScreen = ({ navigation, route }) => {
    const { leads, courses, addLead, deleteLead, addStudent } = useContext(SchoolContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { showLoader, hideLoader } = useUI();

    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    React.useEffect(() => {
        if (route.params?.openAddModal) {
            setModalVisible(true);
            navigation.setParams({ openAddModal: undefined });
        }
    }, [route.params?.openAddModal]);

    const handleAddLead = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert(t.error, t.errorFillFields);
            return;
        }

        showLoader('Saqlanmoqda...');
        try {
            await addLead({
                name,
                phone,
                notes,
                interestedCourseId: selectedCourseId || null,
                courseName: courses.find(c => c.id === selectedCourseId)?.title || '',
                status: 'new'
            });

            setModalVisible(false);
            setName('');
            setPhone('');
            setNotes('');
            setSelectedCourseId(null);
        } finally {
            hideLoader();
        }
    };

    const handleConvertToStudent = (lead) => {
        Alert.alert(
            t.convertToStudent,
            `${t.manageStudentPrompt} ${lead.name}?`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.convertToStudent,
                    onPress: async () => {
                        const courseObj = courses.find(c => c.id === lead.interestedCourseId);
                        showLoader('Talabaga o\'tkazilmoqda...');
                        try {
                            await addStudent({
                                name: lead.name,
                                phone: lead.phone,
                                email: '',
                                assignedCourseId: lead.interestedCourseId || null,
                                course: courseObj ? courseObj.title : '',
                                status: 'Pending',
                                avatar: 'https://via.placeholder.com/150'
                            });
                            await deleteLead(lead.id);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <ListItem
            title={item.name}
            subtitle={item.phone}
            icon="person-add"
            iconColor={COLORS.warning}
            onPress={() => handleConvertToStudent(item)}
            rightElement={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.courseName && (
                        <View style={{ backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 }}>
                            <Text style={{ ...FONTS.small, color: COLORS.primary }}>{item.courseName}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={async () => {
                        showLoader('O\'chirilmoqda...');
                        try {
                            await deleteLead(item.id);
                        } finally {
                            hideLoader();
                        }
                    }}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            }
        />
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header
                title={t.leads}
                rightIcon="add"
                onRightPress={() => setModalVisible(true)}
            />

            <FlatList
                data={leads}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No leads found</Text>
                    </View>
                }
            />

            {/* Add Lead Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.addNewLead}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                            placeholder={t.fullName}
                            placeholderTextColor={theme.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                            placeholder={t.phone}
                            placeholderTextColor={theme.textSecondary}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, height: 80 }]}
                            placeholder="Notes"
                            placeholderTextColor={theme.textSecondary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.courses || "Interested Group"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {courses.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.courseChip,
                                            selectedCourseId === c.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                            { borderColor: theme.border }
                                        ]}
                                        onPress={() => setSelectedCourseId(c.id === selectedCourseId ? null : c.id)}
                                    >
                                        <Text style={[
                                            styles.courseChipText,
                                            selectedCourseId === c.id ? { color: COLORS.white } : { color: theme.text }
                                        ]}>
                                            {c.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>


                        <TouchableOpacity style={styles.saveButton} onPress={handleAddLead}>
                            <Text style={styles.saveButtonText}>{t.saveChanges}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        padding: SIZES.padding,
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        ...FONTS.body3,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: SIZES.padding,
    },
    modalView: {
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.base * 2,
    },
    modalTitle: {
        ...FONTS.h3,
    },
    input: {
        borderWidth: 1,
        borderRadius: SIZES.radius,
        padding: SIZES.base,
        marginBottom: SIZES.base * 2,
        ...FONTS.body4,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginTop: SIZES.base,
    },
    saveButtonText: {
        color: COLORS.white,
        ...FONTS.h3,
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

export default LeadsScreen;

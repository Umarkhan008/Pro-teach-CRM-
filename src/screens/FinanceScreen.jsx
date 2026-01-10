import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import Chart from '../components/Chart';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
// import { mockData } from '../data/mockData'; // Removed mockData
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';

const TransactionItem = ({ item, onLongPress }) => {
    const { theme } = useContext(ThemeContext);

    return (
        <TouchableOpacity
            style={[styles.transactionItem, globalStyles.shadow, { backgroundColor: theme.surface }]}
            onLongPress={() => onLongPress(item)}
            delayLongPress={500}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, {
                backgroundColor: item.type === 'income' ? COLORS.success + '20' : COLORS.danger + '20'
            }]}>
                <Ionicons
                    name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={item.type === 'income' ? COLORS.success : COLORS.danger}
                />
            </View>

            <View style={styles.transactionContent}>
                <Text style={[styles.transactionTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.transactionDate, { color: theme.textLight }]}>{item.date}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: item.type === 'income' ? COLORS.success : theme.text }]}>
                    {item.amount}
                </Text>
                <Text style={[styles.status, { color: theme.textSecondary }]}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );
};

const FinanceScreen = ({ navigation }) => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { finance, addTransaction, deleteTransaction, revenueData, getTotalRevenue } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('income'); // income | expense

    const handleAddTransaction = async () => {
        if (!title || !amount) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newTransaction = {
            title,
            amount: type === 'income' ? `+$${amount}` : `-$${amount}`,
            status: 'Pending',
            type: type
        };

        showLoader('Saqlanmoqda...');
        try {
            await addTransaction(newTransaction);
            setModalVisible(false);
            setTitle('');
            setAmount('');
            setType('income');
        } finally {
            hideLoader();
        }
    };

    const handleDeleteTransaction = (item) => {
        Alert.alert(
            "Delete Transaction",
            `Are you sure you want to delete "${item.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader('O\'chirilmoqda...');
                        try {
                            await deleteTransaction(item.id);
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
            <Header
                title={t.finance || "Finance"}
                subtitle={t.revenueExpenses || "Revenue & Expenses"}
                rightIcon="add"
                onRightPress={() => setModalVisible(true)}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={globalStyles.screenPadding}>

                    <View style={[styles.summaryContainer, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                        <View style={globalStyles.rowBetween}>
                            <View>
                                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{t.totalRevenue || "Total Revenue"}</Text>
                                <Text style={[styles.totalAmount, { color: theme.text }]}>{getTotalRevenue()}</Text>
                            </View>
                            <View style={styles.growthBadge}>
                                <Ionicons name="trending-up" size={16} color={COLORS.success} />
                                <Text style={styles.growthText}>+12.5%</Text>
                            </View>
                        </View>
                    </View>

                    <Chart
                        title={t.monthlyRevenue || "Monthly Revenue"}
                        data={revenueData}
                        type="bar"
                    />

                    <View style={styles.sectionHeader}>
                        <Text style={[globalStyles.title, { color: theme.text }]}>{t.recentTransactions || "Recent Transactions"}</Text>
                        <Text style={styles.linkText}>{t.seeAll || "See All"}</Text>
                    </View>

                    {finance.map((item) => (
                        <TransactionItem
                            key={item.id}
                            item={item}
                            onLongPress={handleDeleteTransaction}
                        />
                    ))}

                </View>
            </ScrollView>

            {/* Add Transaction Modal */}
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
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Transaction</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Ex: Tuition Fee"
                                placeholderTextColor={theme.textLight}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount ($)</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Ex: 500"
                                placeholderTextColor={theme.textLight}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
                            <View style={globalStyles.row}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeOption,
                                        type === 'income' ? { backgroundColor: COLORS.success, borderColor: COLORS.success } : { borderColor: theme.border }
                                    ]}
                                    onPress={() => setType('income')}
                                >
                                    <Text style={{ color: type === 'income' ? COLORS.white : theme.text }}>Income</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.typeOption,
                                        type === 'expense' ? { backgroundColor: COLORS.danger, borderColor: COLORS.danger } : { borderColor: theme.border }
                                    ]}
                                    onPress={() => setType('expense')}
                                >
                                    <Text style={{ color: type === 'expense' ? COLORS.white : theme.text }}>Expense</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAddTransaction}>
                            <Text style={styles.submitBtnText}>Add Transaction</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    summaryContainer: {
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.base * 2,
    },
    totalLabel: {
        ...FONTS.body4,
        marginBottom: 4,
    },
    totalAmount: {
        ...FONTS.h1,
    },
    growthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    growthText: {
        ...FONTS.body4,
        color: COLORS.success,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.base,
        marginTop: SIZES.base,
    },
    linkText: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: '600',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding * 0.75,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.base,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 1.5,
    },
    transactionContent: {
        flex: 1,
    },
    transactionTitle: {
        ...FONTS.body3,
        marginBottom: 2,
        fontWeight: '500',
    },
    transactionDate: {
        ...FONTS.small,
    },
    amount: {
        ...FONTS.h4,
        marginBottom: 2,
    },
    status: {
        ...FONTS.small,
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
    typeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 4
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

export default FinanceScreen;

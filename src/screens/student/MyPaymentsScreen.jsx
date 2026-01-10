import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import Header from '../../components/Header';

const payments = [
    { id: 1, title: 'October Tuition', amount: '$200.00', date: 'Oct 05, 2023', status: 'Paid', type: 'in-time' },
    { id: 2, title: 'November Tuition', amount: '$200.00', date: 'Nov 03, 2023', status: 'Paid', type: 'in-time' },
    { id: 3, title: 'December Tuition', amount: '$200.00', date: 'Dec 05, 2023', status: 'Due', type: 'pending' },
];

const MyPaymentsScreen = () => {
    const renderItem = ({ item }) => (
        <View style={[globalStyles.card, globalStyles.shadow, styles.paymentCard]}>
            <View style={[styles.iconContainer, {
                backgroundColor: item.type === 'pending' ? COLORS.warning + '20' : COLORS.success + '20'
            }]}>
                <Ionicons
                    name={item.type === 'pending' ? 'time' : 'checkmark-circle'}
                    size={24}
                    color={item.type === 'pending' ? COLORS.warning : COLORS.success}
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{item.amount}</Text>
                <View style={[styles.badge, {
                    backgroundColor: item.type === 'pending' ? COLORS.warning + '20' : COLORS.success + '20'
                }]}>
                    <Text style={[styles.status, {
                        color: item.type === 'pending' ? COLORS.warning : COLORS.success
                    }]}>{item.status}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={globalStyles.container} edges={['top']}>
            <Header title="Payments" />

            <View style={globalStyles.screenPadding}>
                <View style={[globalStyles.card, globalStyles.shadow, styles.balanceCard]}>
                    <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                    <Text style={styles.balanceAmount}>$200.00</Text>
                    <Text style={styles.balanceNote}>Due by Dec 15, 2023</Text>
                </View>

                <Text style={[globalStyles.title, { marginTop: SIZES.base * 2 }]}>Payment History</Text>

                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    balanceCard: {
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        padding: SIZES.padding * 1.5,
    },
    balanceLabel: {
        ...FONTS.body4,
        color: COLORS.surface,
        opacity: 0.8,
        marginBottom: 8,
    },
    balanceAmount: {
        ...FONTS.h1,
        color: COLORS.surface,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    balanceNote: {
        ...FONTS.small,
        color: COLORS.surface,
        opacity: 0.9,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        marginBottom: SIZES.base * 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 2,
    },
    content: {
        flex: 1,
    },
    title: {
        ...FONTS.h4,
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        ...FONTS.small,
        color: COLORS.textSecondary,
    },
    amount: {
        ...FONTS.h3,
        color: COLORS.text,
        marginBottom: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    status: {
        fontSize: 10,
        fontWeight: 'bold',
    }
});

export default MyPaymentsScreen;

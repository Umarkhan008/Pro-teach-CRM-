import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import Header from '../../components/Header';

const MyScheduleScreen = () => {
    const [selected, setSelected] = useState('');

    return (
        <SafeAreaView style={globalStyles.container} edges={['top']}>
            <Header title="My Schedule" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={globalStyles.screenPadding}>
                    <Calendar
                        onDayPress={day => setSelected(day.dateString)}
                        markedDates={{
                            [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' }
                        }}
                        theme={{
                            backgroundColor: COLORS.surface,
                            calendarBackground: COLORS.surface,
                            textSectionTitleColor: COLORS.textSecondary,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: COLORS.primary,
                            dayTextColor: COLORS.text,
                            textDisabledColor: COLORS.textLight,
                            dotColor: COLORS.primary,
                            selectedDotColor: '#ffffff',
                            arrowColor: COLORS.primary,
                            monthTextColor: COLORS.text,
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

                    <Text style={[globalStyles.title, { marginTop: SIZES.base }]}>Upcoming Classes</Text>

                    {/* Mock Schedule Data */}
                    <View style={[globalStyles.card, globalStyles.shadow, styles.classCard]}>
                        <View style={styles.timeBox}>
                            <Text style={styles.timeText}>14:00</Text>
                        </View>
                        <View style={styles.classInfo}>
                            <Text style={styles.classTitle}>Frontend Development</Text>
                            <Text style={styles.classLocation}>Lab Room 1</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    classCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    timeBox: {
        paddingRight: SIZES.base * 2,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        marginRight: SIZES.base * 2,
    },
    timeText: {
        ...FONTS.h3,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    classInfo: {
        flex: 1,
    },
    classTitle: {
        ...FONTS.h4,
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    classLocation: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
    }
});

export default MyScheduleScreen;

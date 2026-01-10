import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';

const screenWidth = Dimensions.get('window').width;

const Chart = ({ title, data, type = 'line', height = 220 }) => {
    const chartConfig = {
        backgroundGradientFrom: COLORS.surface,
        backgroundGradientTo: COLORS.surface,
        color: (opacity = 1) => COLORS.primary + (opacity < 1 ? Math.round(opacity * 255).toString(16) : ''),
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => COLORS.textSecondary,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: COLORS.primary
        }
    };

    return (
        <View style={[globalStyles.card, globalStyles.shadow, styles.container]}>
            <Text style={styles.title}>{title}</Text>

            {type === 'line' ? (
                <LineChart
                    data={data}
                    width={screenWidth - (SIZES.padding * 2) - (SIZES.padding * 1.5)}
                    height={height}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withInnerLines={false}
                    withOuterLines={false}
                />
            ) : (
                <BarChart
                    data={data}
                    width={screenWidth - (SIZES.padding * 2) - (SIZES.padding * 1.5)}
                    height={height}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    withInnerLines={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    title: {
        ...FONTS.h3,
        color: COLORS.text,
        marginBottom: SIZES.base * 2,
    },
    chart: {
        borderRadius: SIZES.radius,
        paddingRight: 40, // Add padding for right labels
    }
});

export default Chart;

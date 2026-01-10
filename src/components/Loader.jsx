import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS } from '../constants/theme';
import { useUI } from '../context/UIContext';

const { width, height } = Dimensions.get('window');

const Loader = () => {
    const { isLoading, loadingText } = useUI();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (isLoading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isLoading]);

    if (!isLoading && fadeAnim._value === 0) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    pointerEvents: isLoading ? 'auto' : 'none'
                }
            ]}
        >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            <Animated.View style={[styles.loaderCard, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <View style={styles.innerDot} />
                </View>

                {loadingText ? (
                    <Text style={styles.text}>{loadingText}</Text>
                ) : (
                    <Text style={styles.text}>Yuklanmoqda...</Text>
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderCard: {
        width: 150,
        height: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    spinnerContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    innerDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        opacity: 0.3,
    },
    text: {
        ...FONTS.body4,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 10,
    }
});

export default Loader;

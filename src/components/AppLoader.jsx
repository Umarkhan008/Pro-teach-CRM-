import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Text } from 'react-native';

const AppLoader = ({ isDarkMode }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Continuous spin
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
                easing: Easing.linear,
            })
        ).start();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();

        // Dots animation
        const animateDot = (dotAnim, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dotAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animateDot(dot1, 0);
        animateDot(dot2, 200);
        animateDot(dot3, 400);
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const backgroundColor = isDarkMode ? '#0A0A0A' : '#FFFFFF';
    const primaryColor = '#FF6B6B';
    const textColor = isDarkMode ? '#FFFFFF' : '#1A1A1A';
    const secondaryTextColor = isDarkMode ? '#888888' : '#666666';

    return (
        <Animated.View style={[styles.container, { backgroundColor, opacity: fadeAnim }]}>
            {/* Main Spinner */}
            <View style={styles.spinnerContainer}>
                <Animated.View
                    style={[
                        styles.spinner,
                        {
                            borderColor: isDarkMode ? '#222' : '#F0F0F0',
                            borderTopColor: primaryColor,
                            transform: [{ rotate: spin }],
                        },
                    ]}
                />

                {/* Center Logo */}
                <Animated.View
                    style={[
                        styles.centerDot,
                        {
                            backgroundColor: primaryColor,
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                />
            </View>

            {/* Brand Text */}
            <Text style={[styles.brandText, { color: textColor }]}>
                Pro Teach
            </Text>

            {/* Loading Text with Dots */}
            <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
                    Yuklanmoqda
                </Text>
                <View style={styles.dotsContainer}>
                    <Animated.View
                        style={[
                            styles.dot,
                            {
                                backgroundColor: primaryColor,
                                opacity: dot1,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.dot,
                            {
                                backgroundColor: primaryColor,
                                opacity: dot2,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.dot,
                            {
                                backgroundColor: primaryColor,
                                opacity: dot3,
                            },
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    spinner: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
    },
    centerDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    brandText: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 20,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});

export default AppLoader;

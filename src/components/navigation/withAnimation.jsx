import React, { useRef, useCallback } from 'react';
import { Animated, Easing, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const withAnimation = (Component) => {
    return (props) => {
        // Animatsiya qiymati: Ekranning o'ng chetidan boshlanadi
        const translateX = useRef(new Animated.Value(width)).current;
        const animationRef = useRef(null); // Track animation to prevent memory leaks

        useFocusEffect(
            useCallback(() => {
                // Sahifa ochilganda qiymatni boshlang'ich holatga qaytaramiz
                translateX.setValue(width);

                // Haqiqiy Navigation effekti
                animationRef.current = Animated.timing(translateX, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.poly(5)),
                });

                animationRef.current.start();

                return () => {
                    // CRITICAL: Stop animation on unmount to prevent memory leak
                    if (animationRef.current) {
                        animationRef.current.stop();
                        animationRef.current = null;
                    }
                };
            }, [translateX])
        );

        return (
            <Animated.View
                style={{
                    flex: 1,
                    transform: [{ translateX }],
                    backgroundColor: '#fff' // Orqafon oq bo'lishi kerak, shunda siljiganda orqasi ko'rinmaydi
                }}
            >
                <Component {...props} />
            </Animated.View>
        );
    };
};

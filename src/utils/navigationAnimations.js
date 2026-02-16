import { Easing } from 'react-native';

// Smooth fade transition
export const fadeTransition = {
    transitionSpec: {
        open: {
            animation: 'timing',
            config: {
                duration: 200,
                easing: Easing.inOut(Easing.ease),
            },
        },
        close: {
            animation: 'timing',
            config: {
                duration: 150,
                easing: Easing.inOut(Easing.ease),
            },
        },
    },
    cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
            opacity: current.progress,
        },
    }),
};

// Slide from right (iOS style - simplified)
export const slideFromRightTransition = {
    transitionSpec: {
        open: {
            animation: 'timing',
            config: {
                duration: 300,
                easing: Easing.out(Easing.cubic),
            },
        },
        close: {
            animation: 'timing',
            config: {
                duration: 250,
                easing: Easing.in(Easing.cubic),
            },
        },
    },
    cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
            transform: [
                {
                    translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                    }),
                },
            ],
        },
    }),
};

// Slide from bottom (Modal style)
export const slideFromBottomTransition = {
    transitionSpec: {
        open: {
            animation: 'spring',
            config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
            },
        },
        close: {
            animation: 'spring',
            config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
            },
        },
    },
    cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
            transform: [
                {
                    translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                    }),
                },
            ],
        },
    }),
};

// Scale & Fade (Premium look)
export const scaleFromCenterTransition = {
    transitionSpec: {
        open: {
            animation: 'timing',
            config: {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            },
        },
        close: {
            animation: 'timing',
            config: {
                duration: 250,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            },
        },
    },
    cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
            opacity: current.progress,
            transform: [
                {
                    scale: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                    }),
                },
            ],
        },
    }),
};

// Horizontal slide with depth (modern - simplified)
export const modernSlideTransition = {
    transitionSpec: {
        open: {
            animation: 'timing',
            config: {
                duration: 300,
                easing: Easing.out(Easing.cubic),
            },
        },
        close: {
            animation: 'timing',
            config: {
                duration: 250,
                easing: Easing.in(Easing.cubic),
            },
        },
    },
    cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
            transform: [
                {
                    translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                    }),
                },
            ],
        },
    }),
};

// Flip transition (experimental, fun)
export const flipTransition = {
    transitionSpec: {
        open: {
            animation: 'timing',
            config: {
                duration: 400,
                easing: Easing.out(Easing.poly(4)),
            },
        },
        close: {
            animation: 'timing',
            config: {
                duration: 400,
                easing: Easing.in(Easing.poly(4)),
            },
        },
    },
    cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
            transform: [
                {
                    rotateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['180deg', '0deg'],
                    }),
                },
            ],
            opacity: current.progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 1],
            }),
        },
    }),
};

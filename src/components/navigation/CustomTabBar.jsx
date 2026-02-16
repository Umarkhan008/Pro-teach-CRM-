import React, { useContext, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { ThemeContext } from '../../context/ThemeContext';
import { useUI } from '../../context/UIContext';
import { SchoolContext } from '../../context/SchoolContext';

const { width } = Dimensions.get('window');

const TabButton = React.memo(({
    item,
    onPress,
    accessibilityState,
    theme,
    badge,
    indicator,
}) => {
    const focused = accessibilityState?.selected || false;
    const circleAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const labelOpacity = useRef(new Animated.Value(1)).current;
    const iconTranslateY = useRef(new Animated.Value(0)).current; // To center the icon when label is gone

    useEffect(() => {
        Animated.parallel([
            Animated.spring(circleAnim, {
                toValue: focused ? 1 : 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }),
            Animated.spring(scaleAnim, {
                toValue: focused ? 1 : 0.8,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }),
            Animated.timing(labelOpacity, {
                toValue: focused ? 0 : 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    }, [focused]);

    const handlePress = () => {
        try {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (e) { }

        // Add a small scale bounce on press
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();

        if (onPress) onPress();
    };

    const labelText = typeof item?.label === 'string' ? item.label : String(item?.name || '');

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            style={styles.tabBtn}
        >
            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <Animated.View
                        style={[
                            styles.activeCircle,
                            {
                                opacity: circleAnim,
                                transform: [{ scale: scaleAnim }],
                                backgroundColor: theme?.primary || '#FF6D4D'
                            }
                        ]}
                    />

                    <Ionicons
                        name={focused ? item?.activeIcon : item?.inactiveIcon}
                        size={26}
                        color={focused ? '#FFFFFF' : (theme?.textSecondary || '#888888')}
                    />

                    {indicator === 'LIVE' && (
                        <View style={styles.liveIndicator}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}

                    {badge && !indicator && (
                        <View style={[styles.badge, { backgroundColor: COLORS.danger, borderColor: theme?.surface || '#FFFFFF' }]}>
                            <View style={styles.badgeDot} />
                        </View>
                    )}
                </View>

                <Animated.Text
                    style={[
                        styles.label,
                        {
                            color: theme?.textSecondary || '#888888',
                            opacity: labelOpacity,
                        }
                    ]}
                    numberOfLines={1}
                >
                    {labelText}
                </Animated.Text>
            </View>
        </TouchableOpacity>
    );
});

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const schoolContext = useContext(SchoolContext) || {};
    const { schedule = [], attendance = [] } = schoolContext;

    const getTabMeta = (routeName) => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const now = new Date();
            const currentTime = now.getHours() + (now.getMinutes() / 60);

            if (routeName === 'Students') {
                const todaySchedule = Array.isArray(schedule) ? schedule.filter(s => s?.date === todayStr) : [];
                const todayAttendance = Array.isArray(attendance) ? attendance.filter(a => a?.date === todayStr) : [];
                if (todaySchedule.length > todayAttendance.length) return { badge: true };
            }

            if (routeName === 'Courses') {
                const isLive = Array.isArray(schedule) ? schedule.some(s => {
                    if (s?.date !== todayStr) return false;
                    const startArr = (s?.startTime || "0:0").split(':');
                    const endArr = (s?.endTime || "0:0").split(':');
                    const start = parseInt(startArr[0]) + (parseInt(startArr[1]) / 60);
                    const end = parseInt(endArr[0]) + (parseInt(endArr[1]) / 60);
                    return currentTime >= start && currentTime < end;
                }) : false;
                if (isLive) return { indicator: 'LIVE' };
            }

            if (routeName === 'Schedule') {
                const hasLesson = Array.isArray(schedule) ? schedule.some(s => s?.date === todayStr) : false;
                if (hasLesson) return { badge: true };
            }

            if (routeName === 'More') return { badge: 'update' };
        } catch (e) {
            console.log('Meta error:', e);
        }
        return {};
    };

    const windowWidth = Dimensions.get('window').width;
    if (Platform.OS === 'web' && windowWidth >= 1280) return null;

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.blurContainer,
                    {
                        backgroundColor: isDarkMode ? 'rgba(22, 27, 34, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }
                ]}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined ? options.tabBarLabel : (options.title !== undefined ? options.title : route.name);

                    let activeIcon = 'grid';
                    let inactiveIcon = 'grid-outline';

                    if (route.name === 'Dashboard' || route.name === 'Home') { activeIcon = 'home'; inactiveIcon = 'home-outline'; }
                    else if (route.name === 'Students') { activeIcon = 'people'; inactiveIcon = 'people-outline'; }
                    else if (route.name === 'Courses' || route.name === 'MyCourses') { activeIcon = 'layers'; inactiveIcon = 'layers-outline'; }
                    else if (route.name === 'Leaderboard') { activeIcon = 'trophy'; inactiveIcon = 'trophy-outline'; }
                    else if (route.name === 'Schedule') { activeIcon = 'calendar'; inactiveIcon = 'calendar-outline'; }
                    else if (route.name === 'Payments') { activeIcon = 'wallet'; inactiveIcon = 'wallet-outline'; }
                    else if (route.name === 'More' || route.name === 'Settings') { activeIcon = 'apps'; inactiveIcon = 'apps-outline'; }

                    const isFocused = state.index === index;
                    const meta = getTabMeta(route.name);

                    return (
                        <TabButton
                            key={route.key}
                            item={{ name: route.name, label, activeIcon, inactiveIcon }}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    // If targeting 'More', reset its stack to the initial route
                                    if (route.name === 'More') {
                                        navigation.navigate('More', {
                                            screen: 'MoreMain',
                                            initial: true,
                                        });
                                    } else {
                                        navigation.navigate(route.name);
                                    }
                                }
                            }}
                            accessibilityState={{ selected: isFocused }}
                            theme={theme}
                            badge={meta.badge}
                            indicator={meta.indicator}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 16
    },
    blurContainer: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 500,
        height: 75,
        borderRadius: 30,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 12,
    },
    tabBtn: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },
    iconContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    activeCircle: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        position: 'absolute',
        bottom: 8,
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'white',
    },
    liveIndicator: {
        position: 'absolute',
        top: 2,
        right: -8,
        backgroundColor: '#FF4C4C',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pulseDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'white',
        marginRight: 2,
    },
    liveText: {
        color: 'white',
        fontSize: 7,
        fontWeight: '800',
    }
});

export default CustomTabBar;

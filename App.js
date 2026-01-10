import React, { useContext } from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES } from './src/constants/theme';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ThemeContext, ThemeProvider } from './src/context/ThemeContext';
import { LanguageContext, LanguageProvider } from './src/context/LanguageContext';
import { SchoolProvider } from './src/context/SchoolContext';
import { UIProvider } from './src/context/UIContext';
import Loader from './src/components/Loader';

// Import Screens (Admin)
import DashboardScreen from './src/screens/DashboardScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import TeachersScreen from './src/screens/TeachersScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StudentDetailScreen from './src/screens/StudentDetailScreen';
import TeacherDetailScreen from './src/screens/TeacherDetailScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';

// Import Screens (Student)
import StudentHomeScreen from './src/screens/student/StudentHomeScreen';
import MyCoursesScreen from './src/screens/student/MyCoursesScreen';
import MyScheduleScreen from './src/screens/student/MyScheduleScreen';
import MyPaymentsScreen from './src/screens/student/MyPaymentsScreen';

// Import Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Admin Tab Navigator
const AdminTabNavigator = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    const tabBarStyle = {
        backgroundColor: theme.surface,
        borderTopColor: theme.border,
        height: Platform.OS === 'ios' ? 88 : 60,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: tabBarStyle,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Students') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Teachers') iconName = focused ? 'school' : 'school-outline';
                    else if (route.name === 'Courses') iconName = focused ? 'book' : 'book-outline';
                    else if (route.name === 'Leads') iconName = focused ? 'magnet' : 'magnet-outline';
                    else if (route.name === 'More') iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t.dashboard }} />
            <Tab.Screen name="Students" component={StudentsScreen} options={{ tabBarLabel: t.students }} />
            <Tab.Screen name="Leads" component={LeadsScreen} options={{ tabBarLabel: t.leads }} />
            <Tab.Screen name="Teachers" component={TeachersScreen} options={{ tabBarLabel: t.teachers }} />
            <Tab.Screen name="Courses" component={CoursesScreen} options={{ tabBarLabel: t.courses }} />
            <Tab.Screen name="More" component={SettingsScreen} options={{ tabBarLabel: t.more }} />
        </Tab.Navigator>
    );
};

// Student Tab Navigator
const StudentTabNavigator = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    const tabBarStyle = {
        backgroundColor: theme.surface,
        borderTopColor: theme.border,
        height: Platform.OS === 'ios' ? 88 : 60,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: tabBarStyle,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Classes') iconName = focused ? 'library' : 'library-outline';
                    else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Payments') iconName = focused ? 'card' : 'card-outline';
                    else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={StudentHomeScreen} options={{ tabBarLabel: t.home }} />
            <Tab.Screen name="Classes" component={MyCoursesScreen} options={{ tabBarLabel: t.classes }} />
            <Tab.Screen name="Schedule" component={MyScheduleScreen} options={{ tabBarLabel: t.schedule }} />
            <Tab.Screen name="Payments" component={MyPaymentsScreen} options={{ tabBarLabel: t.payments }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t.settings }} />
        </Tab.Navigator>
    );
};

const RootNavigator = () => {
    const { userToken, userInfo, isLoading } = useContext(AuthContext);
    const { theme, isDarkMode } = useContext(ThemeContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            </View>
        );
    }

    const navigationTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: theme.background,
            card: theme.surface,
            text: theme.text,
            border: theme.border,
        },
    };

    return (
        <NavigationContainer theme={navigationTheme}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={theme.background}
            />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken === null ? (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : userInfo?.role === 'admin' ? (
                    // Admin Stack
                    <>
                        <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
                        <Stack.Screen name="Schedule" component={ScheduleScreen} />
                        <Stack.Screen name="Finance" component={FinanceScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />

                        {/* Detail Screens */}
                        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
                        <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} />
                        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
                    </>
                ) : userInfo?.role === 'teacher' ? (
                    // Teacher Stack
                    <>
                        <Stack.Screen name="TeacherMain" component={AdminTabNavigator} />
                        <Stack.Screen name="Schedule" component={ScheduleScreen} />
                        <Stack.Screen name="Finance" component={FinanceScreen} />
                        <Stack.Screen name="TeacherSettings" component={SettingsScreen} />

                        {/* Detail Screens */}
                        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
                        <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} />
                        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
                    </>
                ) : (
                    // Student Stack
                    <>
                        <Stack.Screen name="StudentMain" component={StudentTabNavigator} />
                        <Stack.Screen name="StudentSettings" component={SettingsScreen} />
                        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
                    </>
                )}
            </Stack.Navigator>
            <Loader />
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <SafeAreaProvider>
            <UIProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <LanguageProvider>
                            <SchoolProvider>
                                <RootNavigator />
                            </SchoolProvider>
                        </LanguageProvider>
                    </ThemeProvider>
                </AuthProvider>
            </UIProvider>
        </SafeAreaProvider>
    );
}

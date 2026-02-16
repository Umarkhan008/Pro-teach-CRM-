import React, { useContext, useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { COLORS, SIZES } from './src/constants/theme';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ThemeContext, ThemeProvider } from './src/context/ThemeContext';
import { LanguageContext, LanguageProvider } from './src/context/LanguageContext';
import { SchoolContext, SchoolProvider } from './src/context/SchoolContext';
import { UIProvider } from './src/context/UIContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ToastProvider } from './src/context/ToastContext';
import Loader from './src/components/Loader';
import AppLoader from './src/components/AppLoader';
import EnteringAnimation from './src/components/EnteringAnimation';
import ErrorBoundary from './src/components/ErrorBoundary';
import AdminLayout from './src/layouts/AdminLayout';
import { modernSlideTransition, fadeTransition, scaleFromCenterTransition } from './src/utils/navigationAnimations';
import { withAnimation } from './src/components/navigation/withAnimation';
import linking from './src/config/linking';

// Import Screens (Admin)
import DashboardScreen from './src/screens/DashboardScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import TeachersScreen from './src/screens/TeachersScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StudentDetailScreen from './src/screens/StudentDetailScreen';
import TeacherDetailScreen from './src/screens/TeacherDetailScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import MoreScreen from './src/screens/MoreScreen';
import CustomTabBar from './src/components/navigation/CustomTabBar';

// Import Screens (Student)
import StudentHomeScreen from './src/screens/student/StudentHomeScreen';
import MyCoursesScreen from './src/screens/student/MyCoursesScreen';
import MyScheduleScreen from './src/screens/student/MyScheduleScreen';
import MyPaymentsScreen from './src/screens/student/MyPaymentsScreen';
import LeaderboardScreen from './src/screens/student/LeaderboardScreen';
import VideosScreen from './src/screens/common/VideosScreen';

// Import Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const FullWebScreen = (Component) => (props) => (
    <AdminLayout>
        <Component {...props} />
    </AdminLayout>
);

const WebDashboard = FullWebScreen(DashboardScreen);
const WebStudents = FullWebScreen(StudentsScreen);
const WebTeachers = FullWebScreen(TeachersScreen);
const WebCourses = FullWebScreen(CoursesScreen);
const WebRooms = FullWebScreen(RoomsScreen);
const WebSubjects = FullWebScreen(SubjectsScreen);
const WebLeads = FullWebScreen(LeadsScreen);
const WebSchedule = FullWebScreen(ScheduleScreen);
const WebFinance = FullWebScreen(FinanceScreen);
const WebSettings = FullWebScreen(SettingsScreen);
const WebVideos = FullWebScreen(VideosScreen);
const WebStudentHome = FullWebScreen(StudentHomeScreen);
const WebStudentCourses = FullWebScreen(MyCoursesScreen);
const WebStudentLeaderboard = FullWebScreen(LeaderboardScreen);
const WebStudentSchedule = FullWebScreen(MyScheduleScreen);
const WebStudentPayments = FullWebScreen(MyPaymentsScreen);
const WebStudentVideos = FullWebScreen(VideosScreen);
const WebStudentDetail = FullWebScreen(StudentDetailScreen);
const WebTeacherDetail = FullWebScreen(TeacherDetailScreen);
const WebCourseDetail = FullWebScreen(CourseDetailScreen);
const WebAttendance = FullWebScreen(AttendanceScreen);

// Admin Web Navigator (Desktop Sidebar Layout)
const AdminWebNavigator = () => {
    const [currentRoute, setCurrentRoute] = useState('Dashboard');

    return (
        <AdminLayout activeRoute={currentRoute}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animationEnabled: false,
                }}
            >
                <Stack.Screen name="Dashboard" component={DashboardScreen} listeners={{ focus: () => setCurrentRoute('Dashboard') }} />
                <Stack.Screen name="Students" component={StudentsScreen} listeners={{ focus: () => setCurrentRoute('Students') }} />
                <Stack.Screen name="Teachers" component={TeachersScreen} listeners={{ focus: () => setCurrentRoute('Teachers') }} />
                <Stack.Screen name="Courses" component={CoursesScreen} listeners={{ focus: () => setCurrentRoute('Courses') }} />
                <Stack.Screen name="Rooms" component={RoomsScreen} listeners={{ focus: () => setCurrentRoute('Rooms') }} />
                <Stack.Screen name="Subjects" component={SubjectsScreen} listeners={{ focus: () => setCurrentRoute('Subjects') }} />
                <Stack.Screen name="Leads" component={LeadsScreen} listeners={{ focus: () => setCurrentRoute('Leads') }} />
                <Stack.Screen name="Schedule" component={ScheduleScreen} listeners={{ focus: () => setCurrentRoute('Schedule') }} />
                <Stack.Screen name="Finance" component={FinanceScreen} listeners={{ focus: () => setCurrentRoute('Finance') }} />
                <Stack.Screen name="Settings" component={SettingsScreen} listeners={{ focus: () => setCurrentRoute('Settings') }} />
                <Stack.Screen name="Videos" component={VideosScreen} listeners={{ focus: () => setCurrentRoute('Videos') }} />

                {/* Detail Screens with mapped Sidebar highlights */}
                <Stack.Screen name="StudentDetail" component={StudentDetailScreen} listeners={{ focus: () => setCurrentRoute('Students') }} />
                <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} listeners={{ focus: () => setCurrentRoute('Teachers') }} />
                <Stack.Screen name="CourseDetail" component={CourseDetailScreen} listeners={{ focus: () => setCurrentRoute('Courses') }} />
                <Stack.Screen name="Attendance" component={AttendanceScreen} listeners={{ focus: () => setCurrentRoute('Courses') }} />
            </Stack.Navigator>
        </AdminLayout>
    );
};

// Stack for More tab screens to prevent navigation errors
const MoreStack = createStackNavigator();
const AdminMoreStack = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    return (
        <MoreStack.Navigator
            screenOptions={{
                headerShown: false,
                ...modernSlideTransition,
            }}
        >
            <MoreStack.Screen name="MoreMain" component={MoreScreen} />
            <MoreStack.Screen name="Teachers" component={TeachersScreen} />
            <MoreStack.Screen name="Leads" component={LeadsScreen} />
            <MoreStack.Screen name="Subjects" component={SubjectsScreen} />
            <MoreStack.Screen name="Rooms" component={RoomsScreen} />
            <MoreStack.Screen name="Finance" component={FinanceScreen} />
            <MoreStack.Screen name="Settings" component={SettingsScreen} />
            <MoreStack.Screen name="Videos" component={VideosScreen} />
        </MoreStack.Navigator>
    );
};

// Define Animated Components OUTSIDE to prevent re-renders
const AnimatedDashboard = withAnimation(DashboardScreen);
const AnimatedStudents = withAnimation(StudentsScreen);
const AnimatedCourses = withAnimation(CoursesScreen);
const AnimatedSchedule = withAnimation(ScheduleScreen);
const AnimatedMore = withAnimation(AdminMoreStack);

// Student Animated Components
const AnimatedStudentHome = withAnimation(StudentHomeScreen);
const AnimatedMyCourses = withAnimation(MyCoursesScreen);
const AnimatedLeaderboard = withAnimation(LeaderboardScreen);
const AnimatedMySchedule = withAnimation(MyScheduleScreen);
const AnimatedMyPayments = withAnimation(MyPaymentsScreen);
const AnimatedSettings = withAnimation(SettingsScreen);
const AnimatedVideos = withAnimation(VideosScreen);
const AnimatedStudentMore = withAnimation(SettingsScreen); // Pointing More to Settings directly

// Custom Tab Bar component helper to prevent re-renders
const renderCustomTabBar = props => <CustomTabBar {...props} />;

// Admin Mobile Tab Navigator
const AdminTabNavigator = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    return (
        <Tab.Navigator
            tabBar={renderCustomTabBar}
            screenOptions={{
                headerShown: false,
                animationEnabled: false,
                lazy: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={AnimatedDashboard} options={{ tabBarLabel: t.dashboard }} />
            <Tab.Screen name="Students" component={AnimatedStudents} options={{ tabBarLabel: t.students }} />
            <Tab.Screen name="Courses" component={AnimatedCourses} options={{ tabBarLabel: t.groups || 'Guruhlar' }} />
            <Tab.Screen name="Schedule" component={AnimatedSchedule} options={{ tabBarLabel: t.schedule }} />
            <Tab.Screen name="More" component={AnimatedMore} options={{ tabBarLabel: t.more }} />
        </Tab.Navigator>
    );
};



// Student Tab Navigator
const StudentTabNavigator = () => {
    const { t } = useContext(LanguageContext);

    return (
        <Tab.Navigator
            tabBar={renderCustomTabBar}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true
            }}
        >
            <Tab.Screen name="Home" component={AnimatedStudentHome} options={{ tabBarLabel: t.home }} />
            <Tab.Screen name="MyCourses" component={AnimatedMyCourses} options={{ tabBarLabel: t.classes }} />
            <Tab.Screen name="Leaderboard" component={AnimatedLeaderboard} options={{ tabBarLabel: 'Reyting' }} />
            <Tab.Screen name="Schedule" component={AnimatedMySchedule} options={{ tabBarLabel: t.schedule }} />
            <Tab.Screen name="More" component={AnimatedSettings} options={{ tabBarLabel: t.more }} />
        </Tab.Navigator>
    );
};

// Student Web Navigator
// Student Web Navigator
const StudentWebNavigator = () => {
    const [currentRoute, setCurrentRoute] = useState('Dashboard');

    return (
        <AdminLayout activeRoute={currentRoute}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animationEnabled: false,
                }}
            >
                {/* Map Home to Dashboard for Sidebar compatibility */}
                <Stack.Screen name="Home" component={StudentHomeScreen} listeners={{ focus: () => setCurrentRoute('Dashboard') }} />
                <Stack.Screen name="Dashboard" component={StudentHomeScreen} listeners={{ focus: () => setCurrentRoute('Dashboard') }} />

                {/* Map MyCourses to Courses for Sidebar compatibility */}
                <Stack.Screen name="MyCourses" component={MyCoursesScreen} listeners={{ focus: () => setCurrentRoute('Courses') }} />
                <Stack.Screen name="Courses" component={MyCoursesScreen} listeners={{ focus: () => setCurrentRoute('Courses') }} />

                <Stack.Screen name="Leaderboard" component={LeaderboardScreen} listeners={{ focus: () => setCurrentRoute('Leaderboard') }} />
                <Stack.Screen name="Schedule" component={MyScheduleScreen} listeners={{ focus: () => setCurrentRoute('Schedule') }} />
                <Stack.Screen name="Payments" component={MyPaymentsScreen} listeners={{ focus: () => setCurrentRoute('Finance') }} />
                <Stack.Screen name="Videos" component={VideosScreen} listeners={{ focus: () => setCurrentRoute('Videos') }} />

                {/* Detail Screens */}
                <Stack.Screen name="CourseDetail" component={CourseDetailScreen} listeners={{ focus: () => setCurrentRoute('Courses') }} />
            </Stack.Navigator>
        </AdminLayout>
    );
};


const RootNavigator = () => {
    const { userToken, userInfo, isLoading } = useContext(AuthContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { isDataLoaded } = useContext(SchoolContext);
    const { width } = useWindowDimensions();

    const isDesktop = Platform.OS === 'web' && width >= 1280;

    // Show loader until both auth and data are loaded
    if (isLoading || !isDataLoaded) {
        return <AppLoader isDarkMode={isDarkMode} />;
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
        <EnteringAnimation>
            <NavigationContainer
                theme={navigationTheme}
                linking={linking}
            >
                <StatusBar
                    barStyle={isDarkMode ? "light-content" : "dark-content"}
                    backgroundColor={theme.background}
                />
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                        ...(isDesktop ? { animationEnabled: false } : modernSlideTransition),
                    }}
                >
                    {userToken === null ? (
                        <>
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        </>
                    ) : userInfo?.role === 'admin' ? (
                        <>
                            <Stack.Screen
                                name="AdminMain"
                                component={isDesktop ? AdminWebNavigator : AdminTabNavigator}
                            />
                            <Stack.Screen
                                name="StudentDetail"
                                component={isDesktop ? WebStudentDetail : StudentDetailScreen}
                            />
                            <Stack.Screen
                                name="TeacherDetail"
                                component={isDesktop ? WebTeacherDetail : TeacherDetailScreen}
                            />
                            <Stack.Screen
                                name="CourseDetail"
                                component={isDesktop ? WebCourseDetail : CourseDetailScreen}
                            />
                            <Stack.Screen
                                name="Attendance"
                                component={isDesktop ? WebAttendance : AttendanceScreen}
                            />
                        </>
                    ) : userInfo?.role === 'teacher' ? (
                        <>
                            <Stack.Screen
                                name="TeacherMain"
                                component={isDesktop ? AdminWebNavigator : AdminTabNavigator}
                            />
                            {!isDesktop && (
                                <>
                                    <Stack.Screen name="Schedule" component={ScheduleScreen} />
                                    <Stack.Screen name="Finance" component={FinanceScreen} />
                                    <Stack.Screen name="TeacherSettings" component={SettingsScreen} />
                                </>
                            )}
                            <Stack.Screen
                                name="StudentDetail"
                                component={isDesktop ? WebStudentDetail : StudentDetailScreen}
                            />
                            <Stack.Screen
                                name="TeacherDetail"
                                component={isDesktop ? WebTeacherDetail : TeacherDetailScreen}
                            />
                            <Stack.Screen
                                name="CourseDetail"
                                component={isDesktop ? WebCourseDetail : CourseDetailScreen}
                            />
                            <Stack.Screen
                                name="Attendance"
                                component={isDesktop ? WebAttendance : AttendanceScreen}
                            />
                        </>
                    ) : (
                        <>
                            <Stack.Screen
                                name="StudentMain"
                                component={isDesktop ? StudentWebNavigator : StudentTabNavigator}
                            />
                            {!isDesktop && (
                                <Stack.Screen name="StudentSettings" component={SettingsScreen} />
                            )}
                            <Stack.Screen
                                name="CourseDetail"
                                component={isDesktop ? WebCourseDetail : CourseDetailScreen}
                            />
                            <Stack.Screen name="Videos" component={VideosScreen} />
                        </>
                    )}
                </Stack.Navigator>
                <Loader />
            </NavigationContainer>
        </EnteringAnimation>
    );
};


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
    const [fontsLoaded] = useFonts({
        // Preload icon fonts
        ...Ionicons.font,
    });

    // Fix body overflow for web scrolling
    React.useEffect(() => {
        if (Platform.OS === 'web') {
            // Allow scrolling on web by overriding expo-reset
            document.body.style.overflow = 'visible';
        }
    }, []);

    React.useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <ErrorBoundary>
                <UIProvider>
                    <AuthProvider>
                        <NotificationProvider>
                            <ThemeProvider>
                                <ToastProvider>
                                    <LanguageProvider>
                                        <SchoolProvider>
                                            <RootNavigator />
                                        </SchoolProvider>
                                    </LanguageProvider>
                                </ToastProvider>
                            </ThemeProvider>
                        </NotificationProvider>
                    </AuthProvider>
                </UIProvider>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}

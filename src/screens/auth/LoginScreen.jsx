import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../components/Input';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // 'student', 'teacher' or 'admin'
    const { login, isLoading } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    const handleLogin = () => {
        login(email, password, role);
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: COLORS.primary }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="school" size={40} color={COLORS.primary} />
                        </View>
                        <Text style={styles.appName}>Pro Teach</Text>
                        <Text style={styles.appTagline}>Educational Center Management</Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.subtitleText}>Sign in to continue</Text>

                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'student' && styles.activeRoleBtn]}
                                onPress={() => setRole('student')}
                            >
                                <Ionicons name="person" size={18} color={role === 'student' ? COLORS.primary : COLORS.textLight} />
                                <Text style={[styles.roleText, role === 'student' && styles.activeRoleText]}>Student</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'teacher' && styles.activeRoleBtn]}
                                onPress={() => setRole('teacher')}
                            >
                                <Ionicons name="school" size={18} color={role === 'teacher' ? COLORS.primary : COLORS.textLight} />
                                <Text style={[styles.roleText, role === 'teacher' && styles.activeRoleText]}>{t.teachers || "Teacher"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'admin' && styles.activeRoleBtn]}
                                onPress={() => setRole('admin')}
                            >
                                <Ionicons name="settings" size={18} color={role === 'admin' ? COLORS.primary : COLORS.textLight} />
                                <Text style={[styles.roleText, role === 'admin' && styles.activeRoleText]}>Admin</Text>
                            </TouchableOpacity>
                        </View>

                        <Input
                            icon="mail-outline"
                            placeholder={role === 'admin' ? "Admin Email" : t.login || "Login"}
                            value={email}
                            onChangeText={setEmail}
                        />

                        <Input
                            icon="lock-closed-outline"
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity
                            style={styles.forgotBtn}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[globalStyles.button, { marginTop: SIZES.base * 2 }]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={globalStyles.buttonText}>Kirish</Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SIZES.base * 2,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    appName: {
        ...FONTS.h1,
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    appTagline: {
        ...FONTS.body4,
        color: COLORS.surface,
        opacity: 0.8,
        marginTop: 4,
    },
    footer: {
        flex: 2,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: SIZES.padding,
        paddingVertical: 30,
    },
    welcomeText: {
        ...FONTS.h2,
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitleText: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
        marginBottom: SIZES.padding,
    },
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.border, // Using border color as light background
        borderRadius: SIZES.radius,
        padding: 4,
        marginBottom: SIZES.padding,
    },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: SIZES.radius - 4,
    },
    activeRoleBtn: {
        backgroundColor: COLORS.surface,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    roleText: {
        ...FONTS.body4,
        fontWeight: '600',
        color: COLORS.textLight,
        marginLeft: 6,
    },
    activeRoleText: {
        color: COLORS.primary,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotText: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SIZES.padding,
    },
    registerText: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
    },
    registerLink: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: 'bold',
    }
});

export default LoginScreen;

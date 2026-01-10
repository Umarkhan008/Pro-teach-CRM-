import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, Switch, TouchableOpacity, ScrollView, Alert, Image, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';

const SectionItem = ({ icon, title, type = 'link', value, onValueChange, color }) => {
    const { theme } = useContext(ThemeContext);
    const itemColor = color || theme.text;

    return (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.background }]}
            activeOpacity={(type === 'link' || type === 'danger') ? 0.7 : 1}
            onPress={(type === 'link' || type === 'danger') ? onValueChange : null}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name={icon} size={20} color={itemColor} />
                </View>
                <Text style={[styles.itemTitle, { color: type === 'danger' ? COLORS.danger : theme.text }]}>{title}</Text>
            </View>

            {type === 'toggle' ? (
                <Switch
                    trackColor={{ false: theme.border, true: COLORS.primaryLight }}
                    thumbColor={value ? COLORS.primary : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={onValueChange}
                    value={value}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
            )}
        </TouchableOpacity>
    );
};

const SettingsScreen = ({ navigation }) => {
    const { logout, userInfo } = useContext(AuthContext);
    const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { t, changeLanguage } = useContext(LanguageContext);
    const [notifications, setNotifications] = useState(true);

    const handleLanguagePress = () => {
        Alert.alert(
            t.selectLanguage,
            "",
            [
                { text: "English", onPress: () => changeLanguage('en') },
                { text: "Русский", onPress: () => changeLanguage('ru') },
                { text: "O'zbekcha", onPress: () => changeLanguage('uz') },
                { text: t.cancel, style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    const handleFeaturePress = (featureName) => {
        Alert.alert(featureName, "This feature is coming soon!");
    };

    const containerStyle = {
        flex: 1,
        backgroundColor: theme.background,
    };

    return (
        <SafeAreaView style={containerStyle} edges={['top']}>
            <Header title={t.settings} />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[globalStyles.screenPadding, { backgroundColor: theme.background }]}>

                    {/* Profile Section */}
                    <View style={[styles.profileCard, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                        <View style={styles.avatar}>
                            {userInfo?.avatar ? (
                                <Image source={{ uri: userInfo.avatar }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                            ) : (
                                <Ionicons name="person" size={32} color={COLORS.surface} />
                            )}
                        </View>
                        <View>
                            <Text style={[styles.name, { color: theme.text }]}>{userInfo?.name || 'Guest User'}</Text>
                            <Text style={[styles.role, { color: theme.textSecondary }]}>{userInfo?.role === 'admin' ? 'Administrator' : 'Student'}</Text>
                        </View>
                        <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.background }]}>
                            <Ionicons name="pencil" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.preferences}</Text>
                    <View style={[styles.section, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                        <SectionItem
                            icon="notifications-outline"
                            title={t.pushNotifications}
                            type="toggle"
                            value={notifications}
                            onValueChange={setNotifications}
                        />
                        <SectionItem
                            icon="moon-outline"
                            title={t.darkMode}
                            type="toggle"
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                        />
                        <SectionItem
                            icon="language-outline"
                            title={t.language}
                            onValueChange={handleLanguagePress}
                        />
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.support}</Text>
                    <View style={[styles.section, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                        <SectionItem
                            icon="help-circle-outline"
                            title={t.helpCenter}
                            onValueChange={() => handleFeaturePress(t.helpCenter)}
                        />
                        <SectionItem
                            icon="information-circle-outline"
                            title={t.aboutApp}
                            onValueChange={() => Alert.alert('Pro Teach', 'Version 1.0.0\nBuilt for educational excellence.')}
                        />
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.account}</Text>
                    <View style={[styles.section, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                        <SectionItem
                            icon="log-out-outline"
                            title={t.logOut}
                            type="danger"
                            color={COLORS.danger}
                            onValueChange={() => {
                                Alert.alert(t.logOutConfirmTitle, t.logOutConfirmMsg, [
                                    { text: t.cancel, style: 'cancel' },
                                    { text: t.logOut, style: 'destructive', onPress: () => logout() }
                                ]);
                            }}
                        />
                    </View>

                    <Text style={[styles.version, { color: theme.textLight }]}>Version 1.0.0</Text>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.base * 3,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 2,
    },
    name: {
        ...FONTS.h3,
        marginBottom: 4,
    },
    role: {
        ...FONTS.body4,
    },
    editBtn: {
        position: 'absolute',
        top: SIZES.padding,
        right: SIZES.padding,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        ...FONTS.h4,
        marginBottom: SIZES.base,
        marginLeft: 4,
    },
    section: {
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.base,
        marginBottom: SIZES.base * 3,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SIZES.base * 1.5,
        borderBottomWidth: 1,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 1.5,
    },
    itemTitle: {
        ...FONTS.body3,
    },
    version: {
        textAlign: 'center',
        ...FONTS.small,
    }
});

export default SettingsScreen;

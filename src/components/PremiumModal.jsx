import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PremiumModal = ({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = 550,
    height = 'auto',
    showCloseButton = true,
}) => {
    const { width } = useWindowDimensions();
    const { theme, isDarkMode } = useContext(ThemeContext);
    const isDesktop = width >= 1280;

    return (
        <Modal
            visible={visible}
            animationType={isDesktop ? "fade" : "slide"}
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[styles.overlay, isDesktop && styles.overlayCentered]}>
                {/* Background Blur */}
                {Platform.OS !== 'web' ? (
                    <BlurView
                        intensity={isDesktop ? 20 : 40}
                        style={StyleSheet.absoluteFill}
                        tint={isDarkMode ? 'dark' : 'regular'}
                    />
                ) : (
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}
                        onPress={onClose}
                    />
                )}

                {Platform.OS !== 'web' && (
                    <TouchableOpacity
                        activeOpacity={1}
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                    />
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'position' : 'position'}
                    keyboardVerticalOffset={0}
                    style={[
                        isDesktop ? styles.desktopContainer : styles.mobileContainer,
                        { maxWidth: isDesktop ? maxWidth : '100%' }
                    ]}
                >
                    <View style={[
                        styles.content,
                        {
                            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                            borderColor: isDarkMode ? '#333' : 'transparent',
                            borderWidth: isDesktop ? 1 : 0,
                            height: isDesktop ? 'auto' : (height === 'auto' ? undefined : height),
                            maxHeight: isDesktop ? SCREEN_HEIGHT * 0.9 : SCREEN_HEIGHT * 0.92
                        },
                        isDesktop && styles.contentDesktop
                    ]}>

                        {/* Clean Header */}
                        <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
                            <View style={styles.headerTextContainer}>
                                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                                {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
                            </View>
                            {showCloseButton && (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}
                                >
                                    <Ionicons name="close" size={20} color={theme.text} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Scrollable Body */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.body}
                        >
                            {children}
                        </ScrollView>

                        {/* Footer (Actions) */}
                        {footer && (
                            <View style={[styles.footer, { borderTopColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
                                {footer}
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    mobileContainer: {
        width: '100%',
    },
    desktopContainer: {
        width: '100%',
        marginVertical: 40,
        alignItems: 'center',
    },
    content: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        paddingBottom: Platform.OS === 'ios' ? 40 : 25, // Added for safe area
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    contentDesktop: {
        borderRadius: 20,
        elevation: 25,
        shadowOpacity: 0.15,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 10 },
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: -0.4,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        padding: 24,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
    }
});

export default PremiumModal;

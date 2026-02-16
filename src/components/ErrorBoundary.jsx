import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (in production, send to error reporting service)
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error info:', errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // TODO: Send to crash reporting service (Sentry, etc.)
        // if (!__DEV__) {
        //     Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo } = this.state;
            const isDarkMode = this.props.isDarkMode || false;

            return (
                <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
                    <View style={styles.content}>
                        <Ionicons
                            name="warning-outline"
                            size={80}
                            color="#FF6B6B"
                        />

                        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                            Xatolik yuz berdi
                        </Text>

                        <Text style={[styles.message, isDarkMode && styles.messageDark]}>
                            Nimadir noto'g'ri ketdi. Iltimos qaytadan urinib ko'ring.
                        </Text>

                        {/* Show error details in development mode */}
                        {__DEV__ && error && (
                            <View style={styles.debugContainer}>
                                <Text style={styles.debugTitle}>Debug Info:</Text>
                                <Text style={styles.debugText} numberOfLines={5}>
                                    {error.toString()}
                                </Text>
                                {errorInfo && (
                                    <Text style={styles.debugText} numberOfLines={3}>
                                        {errorInfo.componentStack}
                                    </Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.handleReset}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Qayta yuklash</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    containerDark: {
        backgroundColor: '#0A0A0A',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 24,
        marginBottom: 12,
    },
    titleDark: {
        color: '#FFFFFF',
    },
    message: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    messageDark: {
        color: '#AAAAAA',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    debugContainer: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        marginVertical: 16,
        maxWidth: '100%',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B6B',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#424242',
        fontFamily: 'monospace',
        marginBottom: 4,
    },
});

export default ErrorBoundary;

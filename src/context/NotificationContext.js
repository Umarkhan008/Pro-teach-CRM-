import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';
import { AuthContext } from './AuthContext';
import { db } from '../config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export const NotificationContext = createContext();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationProvider = ({ children }) => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();
    const { userInfo } = useContext(AuthContext);

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setExpoPushToken(token);
                saveTokenToFirebase(token);
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
        });

        return () => {
            if (notificationListener.current && notificationListener.current.remove) {
                notificationListener.current.remove();
            }
            if (responseListener.current && responseListener.current.remove) {
                responseListener.current.remove();
            }
        };
    }, []);

    const saveTokenToFirebase = async (token) => {
        if (userInfo && userInfo.id && userInfo.role !== 'admin') {
            try {
                const collectionName = userInfo.role === 'teacher' ? 'teachers' : 'students';
                const userRef = doc(db, collectionName, userInfo.id);
                await updateDoc(userRef, {
                    pushToken: token,
                    lastTokenUpdate: new Date().toISOString()
                });
                console.log('Push token saved to Firebase');
            } catch (error) {
                console.error('Error saving push token to Firebase:', error);
            }
        }
    };

    // Also update token when user logs in if we already have a token
    useEffect(() => {
        if (userInfo && expoPushToken) {
            saveTokenToFirebase(expoPushToken);
        }
    }, [userInfo]);

    return (
        <NotificationContext.Provider value={{ expoPushToken, notification }}>
            {children}
        </NotificationContext.Provider>
    );
};

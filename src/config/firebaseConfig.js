
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCzZ1EJZKnHMcI8Qk47Omxoy46-WxyGios",
    authDomain: "pro-teach-app.firebaseapp.com",
    projectId: "pro-teach-app",
    storageBucket: "pro-teach-app.firebasestorage.app",
    messagingSenderId: "915656557990",
    appId: "1:915656557990:web:dfb7317a8937cab517fb67",
    measurementId: "G-0J00SF151M"
};

// Initialize Firebase
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

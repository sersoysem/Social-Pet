// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth';
// Persistence için AsyncStorage direkt kullan
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "socialpet-b392b.firebaseapp.com",
  projectId: "socialpet-b392b",
  storageBucket: "socialpet-b392b.firebasestorage.app",
  messagingSenderId: "317058416219",
  appId: "1:317058416219:web:93bf1d65c6ced400ef097e",
  measurementId: "G-SD9WXFLMVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with simple config
const auth = getAuth(app);

export const db = getFirestore(app,'socialpet');
export const storage = getStorage(app);

export { auth };
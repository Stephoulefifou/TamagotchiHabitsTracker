
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpXnjVwpuvGOHN92tz102m227pFyen8Rs",
  authDomain: "tamagotchihabitstracker.firebaseapp.com",
  databaseURL: "https://tamagotchihabitstracker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tamagotchihabitstracker",
  storageBucket: "tamagotchihabitstracker.firebasestorage.app",
  messagingSenderId: "82996937796",
  appId: "1:82996937796:web:b07fcea4f143a386306811"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Login. AsyncStorage remembers the user, so they stay logged in after closing the app.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
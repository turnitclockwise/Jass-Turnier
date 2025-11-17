// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// YOUR NEW Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7bqaGx58-riICtQdIRhiMWm-yxUmGfu0",

  authDomain: "jass-turnier.firebaseapp.com",

  databaseURL: "https://jass-turnier-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "jass-turnier",

  storageBucket: "jass-turnier.firebasestorage.app",

  messagingSenderId: "596963595219",

  appId: "1:596963595219:web:1fce6203d781dac2149526",

  measurementId: "G-R0DTQQ275E"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
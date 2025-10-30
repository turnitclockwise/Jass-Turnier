
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUvM9YU7zNrDQhaEPrdowI0J6z3a81zBc",
  authDomain: "jass-turnierplan.firebaseapp.com",
  databaseURL: "https://jass-turnierplan-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jass-turnierplan",
  storageBucket: "jass-turnierplan.firebasestorage.app",
  messagingSenderId: "751293431135",
  appId: "1:751293431135:web:632367007426a3672c0aea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

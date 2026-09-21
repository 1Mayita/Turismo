import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // <--- Cambiar esta importación

const firebaseConfig = {
  apiKey: "AIzaSyD3fyONykL1J_6tWba-QYplrlOVRyRnNMQ",
  authDomain: "turismo-e0465.firebaseapp.com",
  databaseURL: "https://turismo-e0465-default-rtdb.firebaseio.com", // <--- AGREGAR ESTA LÍNEA
  projectId: "turismo-e0465",
  storageBucket: "turismo-e0465.firebasestorage.app",
  messagingSenderId: "671138332563",
  appId: "1:671138332563:web:f7a825448b94951e68f266",
  measurementId: "G-KGNPY0C7E6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); // <--- Exportar Realtime Database
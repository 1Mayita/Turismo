import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3fyONykL1J_6tWba-QYplrlOVRyRnNMQ",
  authDomain: "turismo-e0465.firebaseapp.com",
  projectId: "turismo-e0465",
  storageBucket: "turismo-e0465.firebasestorage.app",
  messagingSenderId: "671138332563",
  appId: "1:671138332563:web:f7a825448b94951e68f266",
  measurementId: "G-KGNPY0C7E6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Modo pruebas: con VITE_USAR_EMULADORES=1 la app usa los emuladores locales
// de Firebase (npm run emuladores) en vez de la base real, para probar
// cuentas, datos y reglas de seguridad sin tocar nada de producción.
const usarEmuladores = import.meta.env?.VITE_USAR_EMULADORES || globalThis.process?.env?.VITE_USAR_EMULADORES;
if (usarEmuladores) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

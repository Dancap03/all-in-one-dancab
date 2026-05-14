import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from "firebase/firestore"; // Importante

// Sustituye estos valores con los que copiaste de tu nueva consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDdds3IQ-S4E59jwP2CSbMJzuJYhseVSIs",
  authDomain: "allinone-superapp-dancab.firebaseapp.com",
  projectId: "allinone-superapp-dancab",
  storageBucket: "allinone-superapp-dancab.firebasestorage.app",
  messagingSenderId: "117993544584",
  appId: "1:117993544584:web:47c782b8d120a7457b783d",
  measurementId: "G-JY534JGLFG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // 2. Exportar esto para que FinanceService lo vea

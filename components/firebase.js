import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA2GlBOi70LiV5ZJegvyop5s_IJrAeu_1M",
  authDomain: "shopez-fcad8.firebaseapp.com",
  projectId: "shopez-fcad8",
  storageBucket: "shopez-fcad8.firebasestorage.app",
  messagingSenderId: "115005371985",
  appId: "1:115005371985:web:a94494df304584e33f6a70",
  measurementId: "G-KE13M7Q4W3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

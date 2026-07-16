import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCNQ2quF_8rXwko9x9ZzpG6XUfClOINz7M",
  authDomain: "paisa-track-e8187.firebaseapp.com",
  projectId: "paisa-track-e8187",
  storageBucket: "paisa-track-e8187.firebasestorage.app",
  messagingSenderId: "657822690851",
  appId: "1:657822690851:web:0415cc5a5bef49ca958b96"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjBDJ0YC9bdrUDKq3TawF3ZGhoFq4Y9zc",
  authDomain: "caderno-financeiro-a62c0.firebaseapp.com",
  projectId: "caderno-financeiro-a62c0",
  storageBucket: "caderno-financeiro-a62c0.firebasestorage.app",
  messagingSenderId: "51209468744",
  appId: "1:51209468744:web:87e06710dc9cd32aa2517d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(() => {});

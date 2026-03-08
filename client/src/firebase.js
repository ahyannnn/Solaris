import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQzZwHExZv_-UHbxnUKJhmxvPJCoLRJRk",
  authDomain: "signin-project-84bee.firebaseapp.com",
  projectId: "signin-project-84bee",
  storageBucket: "signin-project-84bee.firebasestorage.app",
  messagingSenderId: "1017190029341",
  appId: "1:1017190029341:web:34165eb71c8ece198ccef4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();

// Facebook Provider
export const facebookProvider = new FacebookAuthProvider();

// Optional: Add scopes for Facebook
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
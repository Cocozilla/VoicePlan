
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// This config is hardcoded for server-side initialization.
// In a real-world scenario, you would load this from a secure server-side environment variable.
const serverFirebaseConfig = {
  "projectId": "voiceplan-h14be",
  "appId": "1:433704363107:web:07a60c5803b4c816a78456",
  "storageBucket": "voiceplan-h14be.appspot.com",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  "authDomain": "voiceplan-h14be.firebaseapp.com",
  "messagingSenderId": "433704363107",
};


function initializeServerFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
} {
  const app = getApps().length ? getApp() : initializeApp(serverFirebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
  };
}

export const { auth } = initializeServerFirebase();


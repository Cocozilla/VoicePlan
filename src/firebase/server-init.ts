
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

function initializeServerFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
} {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
  };
}

export const { auth } = initializeServerFirebase();

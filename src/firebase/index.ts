
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// This function should only be called on the client side.
function getFirebaseConfig() {
  const configStr = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;
  if (!configStr) {
    throw new Error("Missing Firebase web app configuration. Please check your environment variables.");
  }

  try {
    const config = JSON.parse(configStr);
    if (!config.apiKey) {
      throw new Error("apiKey is missing in the Firebase web app configuration.");
    }
    return config;
  } catch (e) {
    console.error("Failed to parse Firebase web app configuration:", e);
    throw new Error("Invalid Firebase web app configuration provided.");
  }
}

// This function initializes Firebase and returns the SDKs.
// It's safe to call multiple times, as it checks if an app is already initialized.
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  // Force a new build by adding a comment.
  const firebaseConfig = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';

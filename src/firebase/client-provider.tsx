
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // useMemo ensures this expensive initialization only runs once on the client,
  // after the component has mounted. The 'use client' directive guarantees
  // this component and its hooks only run in the browser.
  const firebaseServices = useMemo(() => {
    // This check is a safeguard, but useMemo in a client component
    // effectively ensures this only runs in the browser.
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return null;
  }, []);

  // If Firebase services are not yet available (e.g., during the initial server render),
  // we render null. The actual content will render on the client once Firebase is initialized.
  if (!firebaseServices) {
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

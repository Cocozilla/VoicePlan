'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuth = (): AuthState => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { auth } = initializeFirebase();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        const { auth } = initializeFirebase();
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error during sign-in:", error);
        }
    };

    const signOut = async () => {
        const { auth } = initializeFirebase();
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Error during sign-out:", error);
        }
    };

    return { user, loading, signIn, signOut };
};

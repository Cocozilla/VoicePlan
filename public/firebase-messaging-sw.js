
// Import the Firebase app and messaging libraries
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// This is the config from the Web App. It's safe to expose this.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// This is the magic part that will listen for background notifications
// In a real app, you'd likely want to do more here, but for now,
// just logging the message is enough to confirm it's working.
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Received push event: ', event);
  const payload = event.data?.json();
  if (payload && payload.notification) {
    const { title, body, icon } = payload.notification;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
      })
    );
  }
});

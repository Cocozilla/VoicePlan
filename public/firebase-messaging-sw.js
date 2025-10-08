// Import the Firebase app and messaging libraries
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// This is the config from the Web App. It's safe to expose this.
const firebaseConfig = {
  apiKey: "AIzaSyCvZmCXnU6C98ztdhHPqqH0QRfndqEQGXI",
  authDomain: "voiceplan-h14be.firebaseapp.com",
  projectId: "voiceplan-h14be",
  storageBucket: "voiceplan-h14be.firebasestorage.app",
  messagingSenderId: "433704363107",
  appId: "1:433704363107:web:07a60c5803b4c816a78456",
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

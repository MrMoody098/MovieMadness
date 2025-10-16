import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcgD5VPvHhYa-xTSYmQGdSjx3qAhoHADc",
  authDomain: "moviemadness-2330c.firebaseapp.com",
  projectId: "moviemadness-2330c",
  storageBucket: "moviemadness-2330c.firebasestorage.app",
  messagingSenderId: "548638586276",
  appId: "1:548638586276:web:305d42f5c89384a255bd31",
  measurementId: "G-GTWZJD7RTK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

export const ensureAnonymousAuth = () =>
  new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsub();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsub();
          resolve(cred.user);
        } catch (err) {
          unsub();
          reject(err);
        }
      }
    });
  });

// Force new anonymous user for each session
export const createNewAnonymousUser = () =>
  new Promise((resolve, reject) => {
    // Sign out first to ensure we get a new user
    auth.signOut().then(() => {
      signInAnonymously(auth)
        .then((cred) => {
          console.log('Created new anonymous user:', cred.user.uid);
          resolve(cred.user);
        })
        .catch((err) => {
          console.error('Error creating new anonymous user:', err);
          reject(err);
        });
    }).catch((err) => {
      console.error('Error signing out:', err);
      reject(err);
    });
  });

export default app;



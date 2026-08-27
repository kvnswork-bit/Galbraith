import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestoreInstance: Firestore | null = null;

export function getDb(): Firestore | null {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (!firestoreInstance) {
      if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
        firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      } else {
        firestoreInstance = getFirestore(app);
      }
    }
    return firestoreInstance;
  } catch (err) {
    console.warn('Could not initialize Firebase Firestore:', err);
    return null;
  }
}

export { doc, getDoc, setDoc, onSnapshot };
export type { Unsubscribe };

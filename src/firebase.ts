import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBRi-46l3LtTDY1lXLlhOImDiGVwfNKk5U",
  authDomain: "fastplayer-f116c.firebaseapp.com",
  databaseURL: "https://fastplayer-f116c-default-rtdb.firebaseio.com",
  projectId: "fastplayer-f116c",
  storageBucket: "fastplayer-f116c.firebasestorage.app",
  messagingSenderId: "1069215413731",
  appId: "1:1069215413731:web:a6f054930a15fd73a6dcd6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();

// Standard operation types for the required Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

/**
 * Required Firebase error handler that logs diagnostic context.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

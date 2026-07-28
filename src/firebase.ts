import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBj6m8yjUnv3jmnkAFemTMs7hhbi1te9HQ",
  authDomain: "fast-player-55570.firebaseapp.com",
  projectId: "fast-player-55570",
  storageBucket: "fast-player-55570.firebasestorage.app",
  messagingSenderId: "359742862381",
  appId: "1:359742862381:web:894ce6ad0d3ae3abecf4a4"
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

/**
 * Recursively removes all keys with undefined values from an object.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

import { safeLocalStorage } from './utils/safeStorage';

/**
 * Resolves the API URL dynamically depending on the deployment environment.
 * If running on a static host like GitHub Pages, it routes requests to the running Cloud Run backend.
 */
export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '3000';
    // If we are NOT in the active development workspace (e.g. running inside APK, file://, or on external hosts),
    // we must route the request to the live Cloud Run backend server.
    const isStaticOrWebView = !isLocalDev;
                         
    if (isStaticOrWebView) {
      // The Cloud Run live preview URL acting as the API backend
      const fallbackBackend = 'https://ais-dev-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app';
      let savedBackend = safeLocalStorage.getItem('backend_api_url') || fallbackBackend;
      
      // Auto-migrate old pre-url to dev-url
      if (savedBackend.includes('ais-pre-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app')) {
        savedBackend = fallbackBackend;
        safeLocalStorage.setItem('backend_api_url', fallbackBackend);
      }
      
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${savedBackend}${cleanPath}`;
    }
  }
  return path;
}


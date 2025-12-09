// src/firebase.ts
// ---------------------------------------------------------
//                FIREBASE + GLOBAL HELPERS
// ---------------------------------------------------------

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously,
  User as FirebaseAuthUser,
} from "firebase/auth";
import {
  getFirestore,
  setLogLevel,
  Firestore,
  doc,
  getDoc,
  // ADDED IMPORTS from user request (already implicitly covered by Firestore type, but good practice for completeness)
  collection,
  CollectionReference,
} from "firebase/firestore";

// -------------------- PDFMAKE --------------------
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// -------------------- LOGGING --------------------
setLogLevel("warn");

// -------------------- GLOBAL CONSTANTS --------------------
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// -------------------- VITE FALLBACK CONFIG --------------------
const VITE_CONFIG = {
  apiKey: "AIzaSyC5SIYgmsFIYb7Uly9a1JU5Le0wOZGKeqo",
  authDomain: "staff-tracker-main.firebaseapp.com",
  projectId: "staff-tracker-main",
  storageBucket: "staff-tracker-main.firebasestorage.app",
  messagingSenderId: "270776261064",
  appId: "1:270776261064:web:f26b6eb3aedddc1232c8fd",
  measurementId: "G-BL11HEZ3GW",
};

// -------------------- APP ID --------------------
export const APP_ID: string =
  typeof __app_id !== "undefined" && __app_id
    ? __app_id
    : VITE_CONFIG.appId;

// -------------------- FIREBASE CONFIG --------------------
export const firebaseConfig =
  typeof __firebase_config !== "undefined" && __firebase_config
    ? JSON.parse(__firebase_config)
    : VITE_CONFIG;

// -------------------- INITIALIZE FIREBASE --------------------
export let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  try {
    app = getApp();
  } catch {
    app = getApps()[0];
  }
}

// -------------------- PDFMAKE --------------------
if (pdfFonts) {
  // @ts-ignore
  pdfMake.vfs = pdfFonts.pdfMake
    ? pdfFonts.pdfMake.vfs
    : pdfFonts.vfs || pdfFonts;
}

// -------------------- FIREBASE SERVICES --------------------
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// ---------------------------------------------------------
//                    USER HELPERS
// ---------------------------------------------------------
export const getUserDisplayName = (identifier?: string | null): string => {
  if (!identifier) return "Unknown";
  if (identifier.length > 20)
    return `Staff (${identifier.substring(0, 5)})`;
  return identifier;
};

export const getUserInfo = (user: FirebaseAuthUser) => ({
  identifier: user.uid,
  name: user.displayName || getUserDisplayName(user.uid),
});

// (Merged helper) - Fetch user profile from /users/{uid}
export const fetchUserInfo = async (uid: string) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

// ---------------------------------------------------------
//                    ROLE SYSTEM
// ---------------------------------------------------------
export type UserRole = "admin" | "staff" | "viewer" | "unauthenticated";

// Main role logic (real)
export const getRole = (user: FirebaseAuthUser | null): UserRole => {
  if (user && !user.isAnonymous) return "admin";
  if (user && user.isAnonymous) return "staff";
  return "unauthenticated";
};

// Fallback role helper (merged version)
export const mockGetRole = (user: any): string => {
  return "admin"; // Your original mock logic
};

// ---------------------------------------------------------
//              AUTH INITIALIZATION SYSTEM
// ---------------------------------------------------------
export const initializeAuth = async (): Promise<void> => {
  const token =
    typeof __initial_auth_token !== "undefined"
      ? __initial_auth_token
      : "";

  if (auth.currentUser) return;

  try {
    if (token) {
      await signInWithCustomToken(auth, token); // ADMIN
    } else {
      await signInAnonymously(auth); // STAFF
    }
  } catch (err) {
    console.error("Firebase Auth Initialization Error:", err);
  }
};

// ---------------------------------------------------------
//               COLLECTION PATH SYSTEM
// ---------------------------------------------------------
export type CollectionSegments = readonly [
  string,
  string,
  string,
  string,
  string
];

const BASE_PATH = ["artifacts", APP_ID, "public", "data"] as const;

const getPath = (name: string): CollectionSegments =>
  [...BASE_PATH, name] as CollectionSegments;

// MAIN COLLECTIONS
export const CUSTOMERS_COLLECTION_SEGMENTS = getPath("customers");
export const SALES_COLLECTION_SEGMENTS = getPath("sales");
export const INVENTORY_COLLECTION_SEGMENTS = getPath("inventory");
export const SUPPLIERS_COLLECTION_SEGMENTS = getPath("suppliers");

// Merged from user request, using the existing path logic:
export const LEDGER_COLLECTION_SEGMENTS = getPath("ledger"); 
// Note: The original file had 'customerLedger', this overwrites it based on your input:
// export const LEDGER_COLLECTION_SEGMENTS = getPath("customerLedger");

export const SUPPLIER_LEDGER_COLLECTION_SEGMENTS = getPath("supplierLedger");

export const DUESALES_COLLECTION_SEGMENTS = getPath("dueSales");
export const PAYMENTMETHODS_COLLECTION_SEGMENTS = getPath("paymentRecords");
export const REPORTS_COLLECTION_SEGMENTS = getPath("reports");

// EXTRA SIMPLE COLLECTION NAMES (from merge)
export const CUSTOMERS_COLLECTION = "customers";
export const LEDGER_COLLECTION = "ledger";

// ---------------------------------------------------------
export { onAuthStateChanged, collection, CollectionReference };
export type { FirebaseAuthUser as User };
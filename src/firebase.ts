// src/firebase.ts
// ---------------------------------------------------------
//           FIREBASE + GLOBAL HELPERS (MODULAR V9)
// ---------------------------------------------------------

import {
    initializeApp,
    getApps,
    getApp,
    FirebaseApp,
} from "firebase/app";
import {
    getAuth,
    onAuthStateChanged as onAuthV9,
    signOut as signOutV9,
    signInWithCustomToken,
    signInAnonymously,
    signInWithEmailAndPassword as signInWithEmailAndPasswordV9,
    User as FirebaseAuthUser,
    Auth, 
} from "firebase/auth";
import * as Firestore from "firebase/firestore";

// Destructure common Firestore functions for cleaner usage/export
const {
    getFirestore,
    setLogLevel,
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    endBefore,
} = Firestore;

// Corrected type definitions: Firestore.Firestore is the service TYPE
type FirestoreType = Firestore.Firestore; 
type CollectionReferenceType = Firestore.CollectionReference;

// -------------------- PDFMAKE --------------------
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// -------------------- LOGGING --------------------
setLogLevel("warn");

// -------------------- GLOBAL CONSTANTS / CONFIG --------------------
// These are environment/build system specific declarations
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

/**
 * VITE_CONFIG represents the detailed, environment-based configuration.
 * It is used as a fallback if build-time variables are not present.
 */
const VITE_CONFIG = {
    apiKey: "AIzaSyC5SIYgmsFIYb7Uly9a1JU5Le0wOZGKeqo",
    authDomain: "staff-tracker-main.firebaseapp.com",
    projectId: "staff-tracker-main",
    storageBucket: "staff-tracker-main.firebasestorage.app", // Using the storageBucket from the detailed config
    messagingSenderId: "270776261064",
    appId: "1:270776261064:web:f26b6eb3aedddc1232c8fd",
    measurementId: "G-BL11HEZ3GW",
};

// -------------------- APP ID --------------------
const APP_ID: string =
    typeof __app_id !== "undefined" && __app_id
        ? __app_id
        : VITE_CONFIG.appId;

// -------------------- FIREBASE CONFIG (Final object used for initialization) --------------------
const firebaseConfig =
    typeof __firebase_config !== "undefined" && __firebase_config
        ? JSON.parse(__firebase_config)
        : VITE_CONFIG;

// -------------------- INITIALIZE FIREBASE --------------------
let app: FirebaseApp;

/**
 * Safely initializes or retrieves the Firebase App instance (Singleton Pattern).
 */
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    // Relying on getApp() to retrieve the default app if one exists
    app = getApp();
}

// -------------------- PDFMAKE --------------------
if (pdfFonts) {
    // @ts-ignore
    pdfMake.vfs = pdfFonts.pdfMake
        ? pdfFonts.pdfMake.vfs
        : pdfFonts.vfs || pdfFonts;
}

// -------------------- FIREBASE SERVICES --------------------
const auth: Auth = getAuth(app);
const db: FirestoreType = getFirestore(app);

// ---------------------------------------------------------
//         V9 MODULAR COMPAT WRAPPERS (FOR LEGACY USAGE)
// ---------------------------------------------------------

/**
 * Compatibility wrapper for onAuthStateChanged.
 * NOTE: The V9 function expects (auth, listener), but this wrapper only exposes the listener.
 */
const onAuthStateChanged = (
    nextOrObserver: (user: FirebaseAuthUser | null) => void
) => {
    return onAuthV9(auth, nextOrObserver);
};

/**
 * Compatibility wrapper for signOut.
 */
const signOut = () => {
    return signOutV9(auth);
};

/**
 * Compatibility wrapper for signInWithEmailAndPassword.
 */
const signInWithEmailAndPassword = (email: string, pass: string) => {
    return signInWithEmailAndPasswordV9(auth, email, pass);
};


// ---------------------------------------------------------
//                   USER HELPERS
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

// Fetch user profile from /users/{uid}
export const fetchUserInfo = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
};

// ---------------------------------------------------------
//                      ROLE SYSTEM
// ---------------------------------------------------------
export type UserRole = "admin" | "staff" | "viewer" | "unauthenticated";

// Main role logic (real)
export const getRole = (user: FirebaseAuthUser | null): UserRole => {
    if (user && !user.isAnonymous) return "admin";
    if (user && user.isAnonymous) return "staff";
    return "unauthenticated";
};

// Fallback role helper
export const mockGetRole = (user: any): string => {
    return "admin"; // Original mock logic
};

// ---------------------------------------------------------
//             AUTH INITIALIZATION SYSTEM
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
//                COLLECTION PATH SYSTEM
// ---------------------------------------------------------
export type CollectionSegments = readonly [
    string,
    string,
    string,
    string,
    string
];

// Base path structure: artifacts/APP_ID/public/data/{collectionName}
const BASE_PATH = ["artifacts", APP_ID, "public", "data"] as const;

export const getPath = (name: string): CollectionSegments =>
    [...BASE_PATH, name] as CollectionSegments;

// MAIN COLLECTIONS (Segments for use with `collection(db, ...segments)`)
export const CUSTOMERS_COLLECTION_SEGMENTS = getPath("customers");
export const SALES_COLLECTION_SEGMENTS = getPath("sales");
export const INVENTORY_COLLECTION_SEGMENTS = getPath("inventory");
export const SUPPLIERS_COLLECTION_SEGMENTS = getPath("suppliers");
export const LEDGER_COLLECTION_SEGMENTS = getPath("ledger");
export const SUPPLIER_LEDGER_COLLECTION_SEGMENTS = getPath("supplierLedger");
export const DUESALES_COLLECTION_SEGMENTS = getPath("dueSales");
export const PAYMENTMETHODS_COLLECTION_SEGMENTS = getPath("paymentRecords");
export const REPORTS_COLLECTION_SEGMENTS = getPath("reports");

// EXTRA SIMPLE COLLECTION NAMES (for use with `collection(db, collectionName)`)
export const CUSTOMERS_COLLECTION = "customers";
export const LEDGER_COLLECTION = "ledger";

// ---------------------------------------------------------
// FINAL EXPORTS (V9 Modular Functions and Compat Wrappers)
// ---------------------------------------------------------
export {
    // Services
    app,
    auth,
    db,

    // Auth helpers (V9 compat wrappers)
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,

    // Firestore Functions
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    endBefore,
    doc,
    getDoc,
    
    // Config/Constants
    APP_ID,
    firebaseConfig,
};
// Use 'export type' to fix 'isolatedModules' warning (code 1205)
export type { 
    CollectionReferenceType as CollectionReference, 
    FirebaseAuthUser as User 
};
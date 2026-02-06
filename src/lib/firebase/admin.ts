import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!rawKey) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
}

const normalized = rawKey.trim().replace(/^['"]|['"]$/g, "");
const serviceAccount = JSON.parse(normalized);

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

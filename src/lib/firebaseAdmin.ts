
// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Check if the service account credentials are provided in the environment
const hasAdminConfig = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

if (!hasAdminConfig) {
  console.warn(
    'Firebase Admin SDK credentials are not complete or missing. Server-side authentication features will fail. Please provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
  );
}

// A function to initialize the app, ensuring it's only done once.
export const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return; // Already initialized
    }
    
    if (!hasAdminConfig) {
        throw new Error("Missing Firebase Admin credentials. Cannot initialize.");
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines from the environment variable
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        console.error('Firebase Admin initialization error:', error.stack);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
};

export { admin };

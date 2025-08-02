// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Check if the service account credentials are provided
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.warn(
    'Firebase Admin SDK credentials are not complete or missing. Server-side authentication features will fail. Please provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
  );
} else {
  // Initialize the app only if it hasn't been initialized yet
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines from the environment variable
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      console.error('Firebase Admin initialization error:', error.stack);
    }
  }
}

export { admin };

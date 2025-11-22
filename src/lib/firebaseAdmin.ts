import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Safely optional chain it

const hasAdminConfig = projectId && clientEmail && privateKey;

if (!hasAdminConfig) {
  console.warn(`
❗ Firebase Admin SDK credentials are missing or incomplete.
.env must include:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY (with escaped \\n)
`);
}

export const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return;
  }

  if (!hasAdminConfig) {
    throw new Error("Missing Firebase Admin credentials. Cannot initialize.");
  }
  
  try {
    const cred = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    });

    admin.initializeApp({ credential: cred });
    
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Firebase Admin initialized successfully.");
    }
  } catch (error: any) {
    console.error("Firebase Admin initialization failed. Please check your credentials.");
    throw new Error("Could not initialize Firebase Admin SDK.");
  }
};

export { admin };

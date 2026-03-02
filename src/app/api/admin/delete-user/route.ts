import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin, admin } from '@/lib/firebaseAdmin';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ADMIN_DASHBOARD_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/admin/delete-user
 *
 * Allows an admin to permanently delete a user account and all associated data.
 *
 * Request headers:
 *   Authorization: Bearer <admin-id-token>
 *
 * Request body:
 *   { "userId": "<uid>" }
 *
 * Responses:
 *   200  { message: "User deleted successfully", userId }
 *   400  { error: "Missing required field: userId" }
 *   401  { error: "Unauthorized" | "Invalid or expired token" }
 *   403  { error: "Forbidden: admin access required" }
 *   500  { error: "<message>" }
 */
export async function POST(request: NextRequest) {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken: admin.auth.DecodedIdToken;
  try {
    initializeFirebaseAdmin();
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401, headers: CORS_HEADERS });
  }

  // ── 2. Authorise (admin-only) ─────────────────────────────────────────────
  const adminUid = process.env.ADMIN_UID;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const isAdmin =
    (adminUid && decodedToken.uid === adminUid) ||
    (adminEmail && decodedToken.email === adminEmail);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403, headers: CORS_HEADERS });
  }

  // ── 3. Validate request body ──────────────────────────────────────────────
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS });
  }

  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing required field: userId' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // ── 4. Delete user data and auth account ─────────────────────────────────
  try {
    const db = admin.firestore();

    // Helper to delete all documents in a collection
    const deleteCollection = async (collectionPath: string) => {
      const snapshot = await db.collection(collectionPath).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      if (snapshot.size > 0) await batch.commit();
    };

    // Delete all subcollections and the user document
    await Promise.all([
      deleteCollection(`users/${userId}/resumes`),
      deleteCollection(`users/${userId}/portfolios`),
      deleteCollection(`users/${userId}/coverletters`),
      deleteCollection(`users/${userId}/subscription`),
      deleteCollection(`users/${userId}/profile`),
    ]);

    // Delete the top-level user document
    await db.doc(`users/${userId}`).delete();

    // Delete the Firebase Auth account
    await admin.auth().deleteUser(userId);

    return NextResponse.json(
      { message: 'User deleted successfully', userId },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin delete-user error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

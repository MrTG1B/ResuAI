import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin, admin } from '@/lib/firebaseAdmin';

const VALID_PLAN_IDS = ['free', 'medium', 'pro', 'ultra_pro'] as const;
type PlanId = (typeof VALID_PLAN_IDS)[number];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ADMIN_DASHBOARD_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/admin/update-subscription
 *
 * Allows an admin to upgrade or downgrade any user's subscription plan.
 *
 * Request headers:
 *   Authorization: Bearer <admin-id-token>
 *
 * Request body:
 *   { "userId": "<uid>", "planId": "free" | "medium" | "pro" | "ultra_pro" }
 *
 * Responses:
 *   200  { message: "Subscription updated successfully", userId, planId }
 *   400  { error: "Missing required fields: userId and planId" }
 *   400  { error: "Invalid planId. Must be one of: free, medium, pro, ultra_pro" }
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
  let body: { userId?: string; planId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS });
  }

  const { userId, planId } = body;

  if (!userId || !planId) {
    return NextResponse.json(
      { error: 'Missing required fields: userId and planId' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!VALID_PLAN_IDS.includes(planId as PlanId)) {
    return NextResponse.json(
      { error: `Invalid planId. Must be one of: ${VALID_PLAN_IDS.join(', ')}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // ── 4. Update Firestore ───────────────────────────────────────────────────
  try {
    const db = admin.firestore();
    const now = new Date().toISOString();

    await Promise.all([
      // Top-level user document (plan field used by some parts of the app)
      db.doc(`users/${userId}`).set({ plan: planId }, { merge: true }),

      // Canonical subscription document
      db.doc(`users/${userId}/subscription/current`).set(
        {
          planId,
          status: planId === 'free' ? 'inactive' : 'active',
          updatedAt: now,
        },
        { merge: true }
      ),
    ]);

    return NextResponse.json(
      { message: 'Subscription updated successfully', userId, planId },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin update-subscription error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

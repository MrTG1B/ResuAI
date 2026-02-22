import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeFirebaseAdmin, admin } from '@/lib/firebaseAdmin';
import type { PlanId } from '@/types/subscription';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Webhook error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  initializeFirebaseAdmin();
  const adminDb = admin.firestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId as PlanId;

        if (userId && planId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const periodEnd = sub.items.data[0]?.current_period_end;
          await adminDb
            .doc(`users/${userId}/subscription/current`)
            .set({
              planId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: sub.status,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

          await adminDb.doc(`users/${userId}`).set({ plan: planId }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const planId = sub.metadata?.planId as PlanId;

        if (userId) {
          const periodEnd = sub.items.data[0]?.current_period_end;
          await adminDb
            .doc(`users/${userId}/subscription/current`)
            .set(
              {
                status: sub.status,
                currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                ...(planId && { planId }),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

          const effectivePlan: PlanId =
            sub.status === 'active' || sub.status === 'trialing' ? (planId ?? 'free') : 'free';
          await adminDb.doc(`users/${userId}`).set({ plan: effectivePlan }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;

        if (userId) {
          await adminDb
            .doc(`users/${userId}/subscription/current`)
            .set(
              { status: 'canceled', cancelAtPeriodEnd: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );
          await adminDb.doc(`users/${userId}`).set({ plan: 'free' }, { merge: true });
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

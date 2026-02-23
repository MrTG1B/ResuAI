'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type Subscription, type PlanId, type Plan } from '@/types/subscription';
import { getPlan, getLimit, isFeatureAvailable, applyPlanConfigOverrides } from '@/lib/plans';

interface UseSubscriptionReturn {
  planId: PlanId;
  plan: Plan;
  subscription: Subscription | null;
  isLoading: boolean;
  isPremium: boolean;
  canAccess: (feature: keyof Plan['features']) => boolean;
  getFeatureLimit: (feature: keyof Plan['features']) => number | 'unlimited';
}

// Singleton promise to ensure plan-config overrides are loaded only once,
// even when multiple hook instances mount simultaneously.
let _overridesPromise: Promise<void> | null = null;

function getOverridesPromise(): Promise<void> {
  if (_overridesPromise) return _overridesPromise;
  _overridesPromise = (async () => {
    if (!db) return;
    try {
      const snap = await getDoc(doc(db, 'config', 'plans'));
      if (snap.exists()) {
        applyPlanConfigOverrides(snap.data() as Partial<Record<PlanId, Partial<Plan['features']>>>);
      }
    } catch {
      // Silently fall back to static defaults if Firestore is unreachable
    }
  })();
  return _overridesPromise;
}

// Kick off override loading once at module load (non-blocking, client-side only)
if (typeof window !== 'undefined') {
  getOverridesPromise();
}

export function useSubscription(): UseSubscriptionReturn {
  const [planId, setPlanId] = useState<PlanId>('free');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setIsLoading(false);
      return;
    }

    const firestore = db;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPlanId('free');
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const subRef = doc(firestore, 'users', user.uid, 'subscription', 'current');
      const unsubSnap = onSnapshot(subRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Subscription;
          setSubscription(data);
          if (data.status === 'active' || data.status === 'trialing') {
            setPlanId(data.planId);
          } else {
            setPlanId('free');
          }
        } else {
          setPlanId('free');
          setSubscription(null);
        }
        setIsLoading(false);
      });

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, []);

  const plan = getPlan(planId);
  const isPremium = planId !== 'free';

  const canAccess = useCallback(
    (feature: keyof Plan['features']) => isFeatureAvailable(planId, feature),
    [planId]
  );

  const getFeatureLimit = useCallback(
    (feature: keyof Plan['features']) => getLimit(planId, feature),
    [planId]
  );

  return { planId, plan, subscription, isLoading, isPremium, canAccess, getFeatureLimit };
}

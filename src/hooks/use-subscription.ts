'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type Subscription, type PlanId, type Plan } from '@/types/subscription';
import { getPlan, getLimit, isFeatureAvailable } from '@/lib/plans';

interface UseSubscriptionReturn {
  planId: PlanId;
  plan: Plan;
  subscription: Subscription | null;
  isLoading: boolean;
  isPremium: boolean;
  canAccess: (feature: keyof Plan['features']) => boolean;
  getFeatureLimit: (feature: keyof Plan['features']) => number | 'unlimited';
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

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPlanId('free');
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const subRef = doc(db!, 'users', user.uid, 'subscription', 'current');
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

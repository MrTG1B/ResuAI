import type { Plan, PlanId } from '@/types/subscription';

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    stripePriceId: '',
    stripeAnnualPriceId: '',
    description: 'Perfect for getting started with AI-powered career tools',
    color: 'slate',
    features: {
      resumeBuilds: 2,
      portfolios: 1,
      coverLetters: 3,
      aiRequests: 10,
      atsScans: 3,
      interviewPrep: false,
      mentorChat: false,
      aptitudeTests: false,
      certificateAnalysis: false,
      prioritySupport: false,
      customDomain: false,
      teamCollaboration: false,
      apiAccess: false,
      exportFormats: ['PDF'],
    },
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    price: 9.99,
    annualPrice: 7.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MEDIUM_PRICE_ID || '',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_MEDIUM_ANNUAL_PRICE_ID || '',
    description: 'For professionals actively searching for their next opportunity',
    color: 'blue',
    features: {
      resumeBuilds: 10,
      portfolios: 5,
      coverLetters: 20,
      aiRequests: 100,
      atsScans: 20,
      interviewPrep: true,
      mentorChat: false,
      aptitudeTests: true,
      certificateAnalysis: true,
      prioritySupport: false,
      customDomain: false,
      teamCollaboration: false,
      apiAccess: false,
      exportFormats: ['PDF', 'DOCX'],
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    annualPrice: 15.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || '',
    description: 'For power users who want the full career acceleration experience',
    color: 'violet',
    popular: true,
    features: {
      resumeBuilds: 50,
      portfolios: 20,
      coverLetters: 'unlimited',
      aiRequests: 500,
      atsScans: 100,
      interviewPrep: true,
      mentorChat: true,
      aptitudeTests: true,
      certificateAnalysis: true,
      prioritySupport: true,
      customDomain: false,
      teamCollaboration: false,
      apiAccess: false,
      exportFormats: ['PDF', 'DOCX', 'HTML'],
    },
  },
  ultra_pro: {
    id: 'ultra_pro',
    name: 'Ultra Pro',
    price: 39.99,
    annualPrice: 31.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRO_PRICE_ID || '',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRO_ANNUAL_PRICE_ID || '',
    description: 'The ultimate suite for teams and career coaches',
    color: 'amber',
    features: {
      resumeBuilds: 'unlimited',
      portfolios: 'unlimited',
      coverLetters: 'unlimited',
      aiRequests: 'unlimited',
      atsScans: 'unlimited',
      interviewPrep: true,
      mentorChat: true,
      aptitudeTests: true,
      certificateAnalysis: true,
      prioritySupport: true,
      customDomain: true,
      teamCollaboration: true,
      apiAccess: true,
      exportFormats: ['PDF', 'DOCX', 'HTML', 'JSON'],
    },
  },
};

export const PLANS_LIST: Plan[] = Object.values(PLANS);

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.free;
}

export function isFeatureAvailable(planId: PlanId, feature: keyof Plan['features']): boolean {
  const plan = getPlan(planId);
  const value = plan.features[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (value === 'unlimited') return true;
  return false;
}

export function getLimit(planId: PlanId, feature: keyof Plan['features']): number | 'unlimited' {
  const plan = getPlan(planId);
  const value = plan.features[feature];
  if (typeof value === 'number') return value;
  if (value === 'unlimited') return 'unlimited';
  return 0;
}

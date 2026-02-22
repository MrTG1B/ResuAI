export type PlanId = 'free' | 'medium' | 'pro' | 'ultra_pro';

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // monthly USD
  annualPrice: number; // annual USD (per month equivalent)
  stripePriceId: string; // env var name for the price ID
  stripeAnnualPriceId: string;
  description: string;
  color: string; // tailwind color class
  popular?: boolean;
  features: {
    resumeBuilds: number | 'unlimited';
    portfolios: number | 'unlimited';
    coverLetters: number | 'unlimited';
    aiRequests: number | 'unlimited';
    atsScans: number | 'unlimited';
    interviewPrep: boolean;
    mentorChat: boolean;
    aptitudeTests: boolean;
    certificateAnalysis: boolean;
    prioritySupport: boolean;
    customDomain: boolean;
    teamCollaboration: boolean;
    apiAccess: boolean;
    exportFormats: string[];
  };
}

export interface Subscription {
  planId: PlanId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

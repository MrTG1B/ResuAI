
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, TrendingUp, Users, FileText, MessageSquare,
  RefreshCw, Loader2, Activity, CreditCard,
} from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, collectionGroup, query, orderBy } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User, PlanId } from '@/types/user';

const PLAN_LABELS: Record<PlanId, string> = { free: 'Free', medium: 'Medium', pro: 'Pro', ultra_pro: 'Ultra Pro' };
const PLAN_PRICES: Record<PlanId, number> = { free: 0, medium: 9.99, pro: 19.99, ultra_pro: 39.99 };
const PLAN_COLORS: Record<PlanId, string> = {
  free: 'bg-slate-400',
  medium: 'bg-blue-500',
  pro: 'bg-violet-500',
  ultra_pro: 'bg-amber-500',
};
const PLAN_TEXT: Record<PlanId, string> = {
  free: 'text-slate-600 dark:text-slate-400',
  medium: 'text-blue-600 dark:text-blue-400',
  pro: 'text-violet-600 dark:text-violet-400',
  ultra_pro: 'text-amber-600 dark:text-amber-400',
};

interface Analytics {
  totalUsers: number;
  totalResumes: number;
  totalPortfolios: number;
  totalCoverLetters: number;
  totalFeedbacks: number;
  planCounts: Record<PlanId, number>;
  avgResumesPerUser: number;
  avgPortfoliosPerUser: number;
  premiumRate: number;
  estimatedMRR: number;
}

// Simple horizontal bar chart
function BarChart({ data }: { data: { label: string; value: number; color: string; max: number }[] }) {
  return (
    <div className="space-y-2.5">
      {data.map(({ label, value, color, max }) => (
        <div key={label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{label}</span>
            <span className="font-bold tabular-nums text-foreground">{value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${color} transition-all duration-700`}
              style={{ width: `${max > 0 ? Math.round((value / max) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut chart (CSS-based)
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;

  const gradientParts: string[] = [];
  segments.forEach(seg => {
    const pct = (seg.value / total) * 100;
    const from = cumulative;
    const to = cumulative + pct;
    gradientParts.push(`${seg.color} ${from.toFixed(1)}% ${to.toFixed(1)}%`);
    cumulative = to;
  });

  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="flex items-center gap-6">
      <div
        className="shrink-0 w-24 h-24 rounded-full"
        style={{
          background: conicGradient,
          mask: 'radial-gradient(transparent 36px, black 37px)',
          WebkitMask: 'radial-gradient(transparent 36px, black 37px)',
        }}
      />
      <div className="space-y-1.5">
        {segments.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold ml-auto tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const profilesSnapshot = await getDocs(collectionGroup(db, 'profile'));
      let totalResumes = 0, totalPortfolios = 0, totalCoverLetters = 0;
      const planCounts: Record<PlanId, number> = { free: 0, medium: 0, pro: 0, ultra_pro: 0 };

      const users: User[] = await Promise.all(
        profilesSnapshot.docs
          .filter(d => d.id === 'data' && d.ref.parent.parent?.path.startsWith('users/'))
          .map(async profileDoc => {
            const uid = profileDoc.ref.parent.parent!.id;
            const pd = profileDoc.data();
            const user: User = { id: uid, name: pd.name || 'N/A', email: pd.email || 'N/A', resumes: 0, portfolios: 0, plan: 'free' };
            try {
              const [ports, resumes, covers, subSnap] = await Promise.all([
                getDocs(collection(db, 'users', uid, 'portfolios')),
                getDocs(collection(db, 'users', uid, 'resumes')),
                getDocs(collection(db, 'users', uid, 'coverletters')),
                getDoc(doc(db, 'users', uid, 'subscription', 'current')),
              ]);
              user.portfolios = ports.size;
              user.resumes = resumes.size;
              user.coverLetters = covers.size;
              totalResumes += resumes.size;
              totalPortfolios += ports.size;
              totalCoverLetters += covers.size;
              if (subSnap.exists()) {
                user.plan = subSnap.data().planId ?? 'free';
              } else {
                const uDoc = await getDoc(doc(db, 'users', uid));
                if (uDoc.exists()) user.plan = uDoc.data()?.plan ?? 'free';
              }
              planCounts[user.plan ?? 'free']++;
            } catch {
              planCounts['free']++;
            }
            return user;
          })
      );

      const fbSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      const totalUsers = users.length || 1;
      const premiumUsers = users.filter(u => u.plan && u.plan !== 'free').length;
      const estimatedMRR = planCounts.medium * PLAN_PRICES.medium + planCounts.pro * PLAN_PRICES.pro + planCounts.ultra_pro * PLAN_PRICES.ultra_pro;

      setAnalytics({
        totalUsers: users.length,
        totalResumes,
        totalPortfolios,
        totalCoverLetters,
        totalFeedbacks: fbSnap.size,
        planCounts,
        avgResumesPerUser: parseFloat((totalResumes / totalUsers).toFixed(1)),
        avgPortfoliosPerUser: parseFloat((totalPortfolios / totalUsers).toFixed(1)),
        premiumRate: parseFloat(((premiumUsers / totalUsers) * 100).toFixed(1)),
        estimatedMRR: parseFloat(estimatedMRR.toFixed(2)),
      });
    } catch {
      toast({ title: "Error", description: "Failed to load analytics.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) return null;

  const maxPlanCount = Math.max(...Object.values(analytics.planCounts), 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform usage and subscription metrics.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
          { label: 'Est. MRR', value: `$${analytics.estimatedMRR}`, icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
          { label: 'Premium Rate', value: `${analytics.premiumRate}%`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
          { label: 'Total Feedback', value: analytics.totalFeedbacks, icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={`border ${border} ${bg}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold tabular-nums">{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan distribution donut */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Subscription Distribution
            </CardTitle>
            <CardDescription className="text-xs">How users are distributed across plans</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              segments={(Object.keys(PLAN_LABELS) as PlanId[]).map(id => ({
                label: PLAN_LABELS[id],
                value: analytics.planCounts[id],
                color: PLAN_COLORS[id],
              }))}
            />
          </CardContent>
        </Card>

        {/* Content generated */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Content Generated
            </CardTitle>
            <CardDescription className="text-xs">Total content created by all users</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { label: 'Resumes', value: analytics.totalResumes, color: 'bg-violet-500', max: Math.max(analytics.totalResumes, analytics.totalPortfolios, analytics.totalCoverLetters, 1) },
                { label: 'Cover Letters', value: analytics.totalCoverLetters, color: 'bg-emerald-500', max: Math.max(analytics.totalResumes, analytics.totalPortfolios, analytics.totalCoverLetters, 1) },
                { label: 'Portfolios', value: analytics.totalPortfolios, color: 'bg-orange-500', max: Math.max(analytics.totalResumes, analytics.totalPortfolios, analytics.totalCoverLetters, 1) },
              ]}
            />
          </CardContent>
        </Card>

        {/* Plan user counts bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Users per Plan
            </CardTitle>
            <CardDescription className="text-xs">User count breakdown by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={(Object.keys(PLAN_LABELS) as PlanId[]).map(id => ({
                label: PLAN_LABELS[id],
                value: analytics.planCounts[id],
                color: PLAN_COLORS[id],
                max: maxPlanCount,
              }))}
            />
          </CardContent>
        </Card>

        {/* Average usage metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Usage Averages</CardTitle>
            <CardDescription className="text-xs">Average content per user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Avg. Resumes / User', value: analytics.avgResumesPerUser, max: 10, color: 'bg-violet-500' },
              { label: 'Avg. Portfolios / User', value: analytics.avgPortfoliosPerUser, max: 5, color: 'bg-orange-500' },
              { label: 'Premium Conversion Rate', value: analytics.premiumRate, max: 100, color: 'bg-emerald-500', suffix: '%' },
            ].map(({ label, value, max, color, suffix }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-xs">{label}</span>
                  <span className="font-bold text-sm tabular-nums">{value}{suffix ?? ''}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Revenue breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Revenue Breakdown (Monthly)
          </CardTitle>
          <CardDescription className="text-xs">Estimated monthly recurring revenue per plan tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.keys(PLAN_LABELS) as PlanId[]).map(id => {
              const revenue = (analytics.planCounts[id] * PLAN_PRICES[id]).toFixed(2);
              return (
                <div key={id} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">{PLAN_LABELS[id]}</div>
                  <div className={`text-2xl font-extrabold tabular-nums ${PLAN_TEXT[id]}`}>${revenue}</div>
                  <div className="text-xs text-muted-foreground">{analytics.planCounts[id]} users × ${PLAN_PRICES[id]}</div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PLAN_COLORS[id]}`}
                      style={{
                        width: analytics.estimatedMRR > 0
                          ? `${(analytics.planCounts[id] * PLAN_PRICES[id] / analytics.estimatedMRR) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Estimated MRR
            </span>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">${analytics.estimatedMRR}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

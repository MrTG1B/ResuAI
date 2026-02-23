
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, FileText, LayoutTemplate, MessageSquare, NotebookPen,
  CreditCard, TrendingUp, Activity, ArrowUpRight, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, collection, getDocs, doc, getDoc, query, orderBy, collectionGroup } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User, PlanId } from '@/types/user';
import type { Feedback } from '@/types/feedback';

const PLAN_LABELS: Record<PlanId, string> = { free: 'Free', medium: 'Medium', pro: 'Pro', ultra_pro: 'Ultra Pro' };
const PLAN_PRICES: Record<PlanId, number> = { free: 0, medium: 9.99, pro: 19.99, ultra_pro: 39.99 };
const PLAN_COLORS: Record<PlanId, { bar: string; badge: string; dot: string }> = {
  free: { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
  medium: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', dot: 'bg-blue-500' },
  pro: { bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300', dot: 'bg-violet-500' },
  ultra_pro: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', dot: 'bg-amber-500' },
};

const STAT_CONFIG = [
  { key: 'users', label: 'Total Users', icon: Users, gradient: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500', borderColor: 'border-blue-200 dark:border-blue-800' },
  { key: 'resumes', label: 'Total Resumes', icon: FileText, gradient: 'from-violet-500/10 to-violet-600/5', iconColor: 'text-violet-500', borderColor: 'border-violet-200 dark:border-violet-800' },
  { key: 'coverLetters', label: 'Cover Letters', icon: NotebookPen, gradient: 'from-emerald-500/10 to-emerald-600/5', iconColor: 'text-emerald-500', borderColor: 'border-emerald-200 dark:border-emerald-800' },
  { key: 'portfolios', label: 'Portfolios', icon: LayoutTemplate, gradient: 'from-orange-500/10 to-orange-600/5', iconColor: 'text-orange-500', borderColor: 'border-orange-200 dark:border-orange-800' },
  { key: 'feedbacks', label: 'Feedbacks', icon: MessageSquare, gradient: 'from-pink-500/10 to-pink-600/5', iconColor: 'text-pink-500', borderColor: 'border-pink-200 dark:border-pink-800' },
];

interface Stats {
  users: number;
  resumes: number;
  portfolios: number;
  feedbacks: number;
  coverLetters: number;
}

export default function OverviewPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, resumes: 0, portfolios: 0, feedbacks: 0, coverLetters: 0 });

  const fetchData = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const profilesSnapshot = await getDocs(collectionGroup(db, 'profile'));
      let totalCoverLetters = 0;
      const fetchedUsers: User[] = await Promise.all(
        profilesSnapshot.docs
          .filter(d => d.id === 'data' && d.ref.parent.parent?.path.startsWith('users/'))
          .map(async (profileDoc) => {
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
              totalCoverLetters += covers.size;
              if (subSnap.exists()) {
                user.plan = subSnap.data().planId ?? 'free';
              } else {
                const uDoc = await getDoc(doc(db, 'users', uid));
                if (uDoc.exists()) user.plan = uDoc.data()?.plan ?? 'free';
              }
            } catch {}
            return user;
          })
      );

      const fbSnapshot = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      const fetchedFeedback: Feedback[] = fbSnapshot.docs.slice(0, 5).map(d => {
        const data = d.data();
        return {
          id: d.id,
          feedback: data.feedback,
          userId: data.userId,
          userName: data.userName || 'N/A',
          userEmail: data.userEmail || 'N/A',
          createdAt: data.createdAt.toDate().toISOString(),
        };
      });

      setUsers(fetchedUsers);
      setRecentFeedback(fetchedFeedback);
      setStats({
        users: fetchedUsers.length,
        resumes: fetchedUsers.reduce((s, u) => s + (u.resumes || 0), 0),
        portfolios: fetchedUsers.reduce((s, u) => s + (u.portfolios || 0), 0),
        feedbacks: fbSnapshot.size,
        coverLetters: totalCoverLetters,
      });
    } catch {
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Plan distribution data
  const planCounts: Record<PlanId, number> = { free: 0, medium: 0, pro: 0, ultra_pro: 0 };
  users.forEach(u => { planCounts[u.plan ?? 'free']++; });
  const total = users.length || 1;
  const revenue = (
    planCounts.medium * PLAN_PRICES.medium +
    planCounts.pro * PLAN_PRICES.pro +
    planCounts.ultra_pro * PLAN_PRICES.ultra_pro
  ).toFixed(2);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, here&apos;s what&apos;s happening.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_CONFIG.map(({ key, label, icon: Icon, gradient, iconColor, borderColor }, i) => (
          <Card
            key={key}
            className={`border ${borderColor} bg-gradient-to-br ${gradient} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-background/70 ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
              <div className={`text-2xl font-bold tabular-nums ${isLoading ? 'animate-pulse bg-muted rounded w-12 h-7' : ''}`}>
                {!isLoading && stats[key as keyof Stats]}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Plan Distribution</CardTitle>
              <Badge variant="outline" className="text-xs gap-1.5">
                <CreditCard className="h-3 w-3" />
                ${revenue}/mo est.
              </Badge>
            </div>
            <CardDescription className="text-xs">Subscription breakdown across all plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(PLAN_LABELS) as PlanId[]).map(planId => {
              const count = planCounts[planId];
              const pct = Math.round((count / total) * 100);
              const colors = PLAN_COLORS[planId];
              return (
                <div key={planId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                      <span className="font-medium">{PLAN_LABELS[planId]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{count} users</span>
                      <span className="font-semibold tabular-nums w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border/60">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>Premium users</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {users.filter(u => u.plan && u.plan !== 'free').length} / {users.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent feedback */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Feedback</CardTitle>
              <a href="/dashboard/feedback" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <CardDescription className="text-xs">Latest 5 user submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              ))
            ) : recentFeedback.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No feedback yet.</p>
            ) : (
              recentFeedback.map(fb => (
                <div key={fb.id} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{fb.userName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{fb.feedback}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Platform Activity Summary
          </CardTitle>
          <CardDescription className="text-xs">Total content generated by all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Resumes Built', value: stats.resumes, color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Cover Letters', value: stats.coverLetters, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Portfolios', value: stats.portfolios, color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Feedback Items', value: stats.feedbacks, color: 'text-pink-600 dark:text-pink-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center space-y-1 p-3 rounded-xl bg-muted/40">
                <div className={`text-3xl font-extrabold tabular-nums ${color}`}>
                  {isLoading ? '—' : value}
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

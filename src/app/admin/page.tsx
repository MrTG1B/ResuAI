"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, FileText, LayoutTemplate, MessageSquare, NotebookPen, Activity, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';
import { AdminUser } from '@/types/admin/user';
import { AdminFeedback } from '@/types/admin/feedback';
import { AnalyticsData } from '@/types/admin/analytics';
import type { PlanId } from '@/types/subscription';
import { PLANS } from '@/lib/plans';
import { AdminUserTable } from '@/components/admin/user-table';
import { AdminFeedbackTable } from '@/components/admin/feedback-table';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { db, auth, collection, getDocs, doc, getDoc, query, orderBy } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: React.ElementType; trend?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground mt-1">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

// Helper function to detect permission issues based on data patterns
const hasPermissionIssue = (analytics: AnalyticsData): boolean => {
  return analytics.totalUsers > 0 && 
         analytics.totalResumes === 0 && 
         analytics.totalPortfolios === 0 && 
         analytics.totalCoverLetters === 0 && 
         analytics.totalFeedbacks > 0;
};

const PLAN_COLORS: Record<PlanId, string> = {
  free: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  pro: 'bg-violet-100 text-violet-700',
  ultra_pro: 'bg-amber-100 text-amber-700',
};

function PlanStatsCard({ users }: { users: AdminUser[] }) {
  const planCounts: Record<PlanId, number> = { free: 0, medium: 0, pro: 0, ultra_pro: 0 };
  users.forEach((u) => { planCounts[u.plan ?? 'free']++; });
  const total = users.length || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan &amp; Subscription Overview</CardTitle>
        <CardDescription>Distribution of users across subscription plans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(PLANS) as PlanId[]).map((planId) => {
            const plan = PLANS[planId];
            const count = planCounts[planId];
            const pct = Math.round((count / total) * 100);
            return (
              <div key={planId} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{plan.name}</span>
                  <Badge className={PLAN_COLORS[planId]}>{planId === 'free' ? 'Free' : `$${plan.price}/mo`}</Badge>
                </div>
                <div className="text-3xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{pct}% of users</div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Revenue Estimate (Monthly)</span>
          </div>
          <div className="text-2xl font-bold">
            ${(
              planCounts.medium * PLANS.medium.price +
              planCounts.pro * PLANS.pro.price +
              planCounts.ultra_pro * PLANS.ultra_pro.price
            ).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on current plan distribution at monthly rates</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalResumes: 0,
    totalPortfolios: 0,
    totalCoverLetters: 0,
    totalFeedbacks: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    userGrowth: [],
  });

  const fetchData = async () => {
    if (!db) {
      toast({ title: "Firestore Error", description: "Firestore is not initialized.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    if (!auth?.currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to view admin data.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch users and their subcollection counts
      const usersCollectionRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      let totalCoverLetters = 0;
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const fetchedUsers: AdminUser[] = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
        const user: AdminUser = { 
          id: userDoc.id, 
          name: 'N/A', 
          email: 'N/A', 
          resumes: 0, 
          portfolios: 0,
          coverLetters: 0,
          isBlocked: false,
        };
        
        try {
          if (!db) return user;
          
          const profileDocRef = doc(db, 'users', user.id, 'profile', 'data');
          const profileSnap = await getDoc(profileDocRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            user.name = profileData.name || 'N/A';
            user.email = profileData.email || 'N/A';
          }

          // Get admin settings
          const adminDocRef = doc(db, 'users', user.id, 'admin', 'settings');
          const adminSnap = await getDoc(adminDocRef);
          if (adminSnap.exists()) {
            const adminData = adminSnap.data();
            user.isBlocked = adminData.isBlocked || false;
            user.disabledTools = adminData.disabledTools || [];
          }

          const portfoliosCollectionRef = collection(db, 'users', user.id, 'portfolios');
          const portfoliosSnapshot = await getDocs(portfoliosCollectionRef);
          user.portfolios = portfoliosSnapshot.size;

          const resumesCollectionRef = collection(db, 'users', user.id, 'resumes');
          const resumesSnapshot = await getDocs(resumesCollectionRef);
          user.resumes = resumesSnapshot.size;

          const coverLettersCollectionRef = collection(db, 'users', user.id, 'coverletters');
          const coverLettersSnapshot = await getDocs(coverLettersCollectionRef);
          user.coverLetters = coverLettersSnapshot.size;
          totalCoverLetters += coverLettersSnapshot.size;

          // Get subscription/plan data
          const subDocRef = doc(db, 'users', user.id, 'subscription', 'current');
          const subSnap = await getDoc(subDocRef);
          if (subSnap.exists()) {
            const subData = subSnap.data();
            user.plan = subData.planId || 'free';
          } else {
            // Fall back to top-level plan field
            const userDocData = userDoc.data();
            user.plan = userDocData?.plan || 'free';
          }

        } catch (error) {
          console.error(`Failed to fetch details for user ${user.id}`, error);
          // If this is a permission error, it might indicate admin UID mismatch
          if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
            console.warn('Permission denied - check if your UID matches the admin UID in firestore.rules');
          }
        }
        return user;
      }));
      
      // Fetch feedback
      const feedbackCollectionRef = collection(db, 'feedback');
      const feedbackQuery = query(feedbackCollectionRef, orderBy('createdAt', 'desc'));
      const feedbackSnapshot = await getDocs(feedbackQuery);

      const fetchedFeedback: AdminFeedback[] = feedbackSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          feedback: data.feedback,
          userId: data.userId,
          userName: data.userName || 'N/A',
          userEmail: data.userEmail || 'N/A',
          createdAt: data.createdAt.toDate().toISOString(),
        }
      });

      setUsers(fetchedUsers);
      setFeedback(fetchedFeedback);

      const totalResumes = fetchedUsers.reduce((sum, user) => sum + (user.resumes || 0), 0);
      const totalPortfolios = fetchedUsers.reduce((sum, user) => sum + (user.portfolios || 0), 0);

      // Calculate new users this month (simplified - in production, use actual creation dates)
      const newUsersThisMonth = Math.floor(fetchedUsers.length * 0.15); // Mock 15% as new

      // Generate user growth data (last 7 days)
      const days = eachDayOfInterval({ start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), end: new Date() });
      const userGrowth = days.map((day, index) => ({
        date: format(day, 'MMM dd'),
        count: Math.max(0, fetchedUsers.length - (days.length - index - 1) * Math.floor(fetchedUsers.length / 30)),
      }));

      setAnalytics({
        totalUsers: fetchedUsers.length,
        totalResumes,
        totalPortfolios,
        totalCoverLetters,
        totalFeedbacks: fetchedFeedback.length,
        activeUsers: fetchedUsers.filter(u => !u.isBlocked).length,
        newUsersThisMonth,
        userGrowth,
      });

    } catch (error: any) {
      console.error("Failed to fetch admin data:", error);
      let errorMessage = "Failed to load admin data. Please check your permissions.";
      
      // Check for permission-denied error
      if (error && error.code === 'permission-denied') {
        errorMessage = "Permission denied. Your UID may not match the admin UID in Firestore rules. Check the console for your current UID.";
        console.log("Current user UID:", auth?.currentUser?.uid);
        console.log("Current user email:", auth?.currentUser?.email);
        console.log("Update the isAdmin() function in firestore.rules with your UID");
      }
      
      toast({
        title: "Data Fetch Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin-auth') === 'true';
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    setIsAuthorized(true);
    fetchData();
  }, [router, toast]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AdminHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Admin Dashboard</h1>
        </div>
        
        {hasPermissionIssue(analytics) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Issue Detected</AlertTitle>
            <AlertDescription>
              You can see feedback but not user data. This indicates a Firestore permission issue. 
              Check the browser console for your UID and update the isAdmin() function in firestore.rules. 
              See <code className="text-xs">docs/ADMIN_SETUP.md</code> for setup instructions.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <StatCard 
            title="Total Users" 
            value={analytics.totalUsers} 
            icon={Users}
            trend={`${analytics.newUsersThisMonth} new this month`}
          />
          <StatCard 
            title="Active Users" 
            value={analytics.activeUsers} 
            icon={Activity}
            trend={analytics.totalUsers > 0 ? `${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total` : '0% of total'}
          />
          <StatCard title="Total Resumes" value={analytics.totalResumes} icon={FileText} />
          <StatCard title="Total Portfolios" value={analytics.totalPortfolios} icon={LayoutTemplate} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          <StatCard title="Total Cover Letters" value={analytics.totalCoverLetters} icon={NotebookPen} />
          <StatCard title="Total Feedbacks" value={analytics.totalFeedbacks} icon={MessageSquare} />
        </div>

        <AnalyticsCharts analytics={analytics} />

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users ({analytics.totalUsers})</TabsTrigger>
            <TabsTrigger value="plans">Plans &amp; Subscriptions</TabsTrigger>
            <TabsTrigger value="feedback">Feedbacks ({analytics.totalFeedbacks})</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <AdminUserTable users={users} onUserUpdated={fetchData} />
          </TabsContent>
          <TabsContent value="plans">
            <PlanStatsCard users={users} />
          </TabsContent>
          <TabsContent value="feedback">
            <AdminFeedbackTable feedback={feedback} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

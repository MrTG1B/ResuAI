"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileText, LayoutTemplate, MessageSquare, NotebookPen, Activity, TrendingUp } from 'lucide-react';
import { AdminUser } from '@/types/admin/user';
import { AdminFeedback } from '@/types/admin/feedback';
import { AnalyticsData } from '@/types/admin/analytics';
import { AdminUserTable } from '@/components/admin/user-table';
import { AdminFeedbackTable } from '@/components/admin/feedback-table';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, collection, getDocs, doc, getDoc, query, orderBy } from '@/lib/firebase';
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

        } catch (error) {
          console.error(`Failed to fetch details for user ${user.id}`, error);
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
      toast({
        title: "Data Fetch Error",
        description: "Failed to load admin data. Please check your permissions.",
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
            trend={`${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total`}
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
            <TabsTrigger value="feedback">Feedbacks ({analytics.totalFeedbacks})</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <AdminUserTable users={users} onUserUpdated={fetchData} />
          </TabsContent>
          <TabsContent value="feedback">
            <AdminFeedbackTable feedback={feedback} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

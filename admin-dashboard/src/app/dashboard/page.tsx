
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, FileText, LayoutTemplate, MessageSquare, NotebookPen, CreditCard } from 'lucide-react';
import { User, type PlanId } from '@/types/user';
import { Feedback } from '@/types/feedback';
import { UserTable } from '@/components/user-table';
import { FeedbackTable } from '@/components/feedback-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { db, collection, getDocs, doc, getDoc, query, orderBy, collectionGroup } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const PLAN_LABELS: Record<PlanId, string> = { free: 'Free', medium: 'Medium', pro: 'Pro', ultra_pro: 'Ultra Pro' };
const PLAN_PRICES: Record<PlanId, number> = { free: 0, medium: 9.99, pro: 19.99, ultra_pro: 39.99 };
const PLAN_COLORS: Record<PlanId, string> = {
  free: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  pro: 'bg-violet-100 text-violet-700',
  ultra_pro: 'bg-amber-100 text-amber-700',
};

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

function PlanOverviewCard({ users }: { users: User[] }) {
    const planCounts: Record<PlanId, number> = { free: 0, medium: 0, pro: 0, ultra_pro: 0 };
    users.forEach((u) => { planCounts[u.plan ?? 'free']++; });
    const total = users.length || 1;
    const revenue = (planCounts.medium * PLAN_PRICES.medium + planCounts.pro * PLAN_PRICES.pro + planCounts.ultra_pro * PLAN_PRICES.ultra_pro).toFixed(2);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>User subscription breakdown &amp; estimated revenue</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {(Object.keys(PLAN_LABELS) as PlanId[]).map((planId) => {
                        const count = planCounts[planId];
                        const pct = Math.round((count / total) * 100);
                        return (
                            <div key={planId} className="rounded-lg border p-3 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium">{PLAN_LABELS[planId]}</span>
                                    <Badge className={`text-xs ${PLAN_COLORS[planId]}`}>
                                        {planId === 'free' ? 'Free' : `$${PLAN_PRICES[planId]}`}
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold">{count}</div>
                                <div className="text-xs text-muted-foreground">{pct}%</div>
                                <div className="h-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Estimated Monthly Revenue:</span>
                    <span className="text-lg font-bold">${revenue}</span>
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
    const [users, setUsers] = useState<User[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [stats, setStats] = useState({ users: 0, resumes: 0, portfolios: 0, feedbacks: 0, coverLetters: 0 });

    const fetchData = useCallback(async () => {
        if (!db) {
            toast({ title: "Firestore Error", description: "Firestore is not initialized.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        try {
            // Use collectionGroup to find all user profiles, since the main app stores
            // user data in subcollections (users/{uid}/profile/data) without creating
            // explicit top-level users/{uid} documents.
            const profilesSnapshot = await getDocs(collectionGroup(db, 'profile'));
            let totalCoverLetters = 0;

            const fetchedUsers: User[] = await Promise.all(
                profilesSnapshot.docs
                    .filter(profileDoc => profileDoc.id === 'data' && profileDoc.ref.parent.parent?.path.startsWith('users/'))
                    .map(async (profileDoc) => {
                        const uid = profileDoc.ref.parent.parent!.id;
                        const profileData = profileDoc.data();
                        const user: User = {
                            id: uid,
                            name: profileData.name || 'N/A',
                            email: profileData.email || 'N/A',
                            resumes: 0,
                            portfolios: 0,
                            plan: 'free',
                        };
                        try {
                            const portfoliosSnapshot = await getDocs(collection(db, 'users', uid, 'portfolios'));
                            user.portfolios = portfoliosSnapshot.size;
                            const resumesSnapshot = await getDocs(collection(db, 'users', uid, 'resumes'));
                            user.resumes = resumesSnapshot.size;
                            const coverLettersSnapshot = await getDocs(collection(db, 'users', uid, 'coverletters'));
                            user.coverLetters = coverLettersSnapshot.size;
                            totalCoverLetters += coverLettersSnapshot.size;

                            // Load subscription/plan
                            const subSnap = await getDoc(doc(db, 'users', uid, 'subscription', 'current'));
                            if (subSnap.exists()) {
                                user.plan = subSnap.data().planId ?? 'free';
                            } else {
                                // Fallback to top-level user doc plan field if it exists
                                const userDocSnap = await getDoc(doc(db, 'users', uid));
                                if (userDocSnap.exists()) {
                                    user.plan = userDocSnap.data()?.plan ?? 'free';
                                }
                            }
                        } catch (error) {
                            console.error(`Failed to fetch details for user ${uid}`, error);
                        }
                        return user;
                    })
            );
            
            const feedbackCollectionRef = collection(db, 'feedback');
            const feedbackQuery = query(feedbackCollectionRef, orderBy('createdAt', 'desc'));
            const feedbackSnapshot = await getDocs(feedbackQuery);

            const fetchedFeedback: Feedback[] = feedbackSnapshot.docs.map(feedbackDoc => {
                const data = feedbackDoc.data();
                return {
                    id: feedbackDoc.id,
                    feedback: data.feedback,
                    userId: data.userId,
                    userName: data.userName || 'N/A',
                    userEmail: data.userEmail || 'N/A',
                    createdAt: data.createdAt.toDate().toISOString(),
                };
            });

            setUsers(fetchedUsers);
            setFeedback(fetchedFeedback);
            setStats({
                users: fetchedUsers.length,
                resumes: fetchedUsers.reduce((sum, u) => sum + (u.resumes || 0), 0),
                portfolios: fetchedUsers.reduce((sum, u) => sum + (u.portfolios || 0), 0),
                feedbacks: fetchedFeedback.length,
                coverLetters: totalCoverLetters,
            });
        } catch (error: any) {
            console.error("Failed to fetch admin data:", error);
            toast({
                title: "Data Fetch Error",
                description: "Could not load data. Check Firestore permissions.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('admin-auth') === 'true';
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        setIsAuthorized(true);
        fetchData();
    }, [router, fetchData]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <h1 className="text-3xl font-bold tracking-tight font-heading">Admin Dashboard</h1>
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
                    <StatCard title="Total Users" value={stats.users} icon={Users} />
                    <StatCard title="Total Resumes" value={stats.resumes} icon={FileText} />
                    <StatCard title="Total Cover Letters" value={stats.coverLetters} icon={NotebookPen} />
                    <StatCard title="Total Portfolios" value={stats.portfolios} icon={LayoutTemplate} />
                    <StatCard title="Total Feedbacks" value={stats.feedbacks} icon={MessageSquare} />
                </div>
                <PlanOverviewCard users={users} />
                <Tabs defaultValue="users">
                    <TabsList>
                        <TabsTrigger value="users">Users ({stats.users})</TabsTrigger>
                        <TabsTrigger value="feedback">Feedbacks ({stats.feedbacks})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users">
                         <UserTable users={users} onRefresh={fetchData} />
                    </TabsContent>
                    <TabsContent value="feedback">
                        <FeedbackTable feedback={feedback} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

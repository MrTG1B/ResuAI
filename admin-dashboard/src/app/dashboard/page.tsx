
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileText, LayoutTemplate, MessageSquare } from 'lucide-react';
import { User } from '@/types/user';
import { Feedback } from '@/types/feedback';
import { UserTable } from '@/components/user-table';
import { FeedbackTable } from '@/components/feedback-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, collection, getDocs, doc, getDoc, query, orderBy } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [stats, setStats] = useState({ users: 0, resumes: 0, portfolios: 0, feedbacks: 0 });

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('admin-auth') === 'true';
        if (!isAdmin) {
            router.push('/login');
            return;
        }
        setIsAuthorized(true);

        async function fetchData() {
            if (!db) {
                toast({ title: "Firestore Error", description: "Firestore is not initialized.", variant: "destructive" });
                setIsLoading(false);
                return;
            }
            try {
                // Fetch users and their subcollection counts
                const usersCollectionRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollectionRef);

                const fetchedUsers: User[] = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
                    const user: User = { id: userDoc.id, name: 'N/A', email: 'N/A', resumes: 0, portfolios: 0 };
                    try {
                        const profileDocRef = doc(db, 'users', user.id, 'profile', 'data');
                        const profileSnap = await getDoc(profileDocRef);
                        if (profileSnap.exists()) {
                            const profileData = profileSnap.data();
                            user.name = profileData.name || 'N/A';
                            user.email = profileData.email || 'N/A';
                        }
                        const portfoliosCollectionRef = collection(db, 'users', user.id, 'portfolios');
                        const portfoliosSnapshot = await getDocs(portfoliosCollectionRef);
                        user.portfolios = portfoliosSnapshot.size;

                        const resumesCollectionRef = collection(db, 'users', user.id, 'resumes');
                        const resumesSnapshot = await getDocs(resumesCollectionRef);
                        user.resumes = resumesSnapshot.size;
                    } catch (error) {
                        console.error(`Failed to fetch details for user ${user.id}`, error);
                    }
                    return user;
                }));
                
                // Fetch feedback
                const feedbackCollectionRef = collection(db, 'feedback');
                const feedbackQuery = query(feedbackCollectionRef, orderBy('createdAt', 'desc'));
                const feedbackSnapshot = await getDocs(feedbackQuery);

                const fetchedFeedback: Feedback[] = feedbackSnapshot.docs.map(doc => {
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

                setStats({
                    users: fetchedUsers.length,
                    resumes: totalResumes,
                    portfolios: totalPortfolios,
                    feedbacks: fetchedFeedback.length,
                });

            } catch (error: any) {
                console.error("Failed to fetch admin data:", error);
                toast({
                    title: "Data Fetch Error",
                    description: "You might not have permission to view this data. Ensure you are logged in as the admin and your UID is set correctly in Firestore rules.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }

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
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <h1 className="text-3xl font-bold tracking-tight font-heading">Admin Dashboard</h1>
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <StatCard title="Total Users" value={stats.users} icon={Users} />
                    <StatCard title="Total Resumes" value={stats.resumes} icon={FileText} />
                    <StatCard title="Total Portfolios" value={stats.portfolios} icon={LayoutTemplate} />
                    <StatCard title="Total Feedbacks" value={stats.feedbacks} icon={MessageSquare} />
                </div>
                <Tabs defaultValue="users">
                    <TabsList>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="feedback">Feedbacks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users">
                         <UserTable users={users} />
                    </TabsContent>
                    <TabsContent value="feedback">
                        <FeedbackTable feedback={feedback} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

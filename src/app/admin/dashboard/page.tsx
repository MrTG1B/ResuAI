
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileText, LayoutTemplate } from 'lucide-react';
import { User } from '@/types/user';
import { getUsers } from '@/app/actions';
import { UserTable } from '@/components/admin/user-table';

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
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({ users: 0, resumes: 0, portfolios: 0 });

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('admin-auth') === 'true';
        if (!isAdmin) {
            router.push('/admin/login');
            return;
        }

        async function fetchData() {
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);

                const totalResumes = fetchedUsers.reduce((sum, user) => sum + (user.resumes || 0), 0);
                const totalPortfolios = fetchedUsers.reduce((sum, user) => sum + (user.portfolios || 0), 0);

                setStats({
                    users: fetchedUsers.length,
                    resumes: totalResumes,
                    portfolios: totalPortfolios,
                });
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [router]);

    const handleUserDeleted = (userId: string) => {
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
        // Also update stats
        setStats(prev => ({
            ...prev,
            users: prev.users - 1
            // A more complex implementation would re-calculate resume/portfolio counts
        }));
    };

    if (isLoading) {
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
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                    <StatCard title="Total Users" value={stats.users} icon={Users} />
                    <StatCard title="Total Resumes" value={stats.resumes} icon={FileText} />
                    <StatCard title="Total Portfolios" value={stats.portfolios} icon={LayoutTemplate} />
                </div>
                <div>
                    <UserTable users={users} onUserDeleted={handleUserDeleted} />
                </div>
            </main>
        </div>
    );
}

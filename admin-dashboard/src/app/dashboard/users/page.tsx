
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Search, RefreshCw, Users, Crown, Loader2 } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, setDoc, collectionGroup } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User, PlanId } from '@/types/user';

const PLAN_LABELS: Record<PlanId, string> = { free: 'Free', medium: 'Medium', pro: 'Pro', ultra_pro: 'Ultra Pro' };
const PLAN_BADGE: Record<PlanId, string> = {
  free: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pro: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  ultra_pro: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

export default function UsersPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanId | 'all'>('all');
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const profilesSnapshot = await getDocs(collectionGroup(db, 'profile'));
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
      setUsers(fetchedUsers);
    } catch {
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handlePlanChange = async (userId: string, newPlan: PlanId) => {
    if (!db) return;
    setChangingPlan(userId);
    try {
      await setDoc(doc(db, 'users', userId), { plan: newPlan }, { merge: true });
      await setDoc(doc(db, 'users', userId, 'subscription', 'current'), {
        planId: newPlan,
        status: newPlan === 'free' ? 'inactive' : 'active',
      }, { merge: true });
      toast({ title: "Plan Updated", description: `Plan changed to ${PLAN_LABELS[newPlan]}.` });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update plan.", variant: "destructive" });
    } finally {
      setChangingPlan(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const premiumCount = users.filter(u => u.plan && u.plan !== 'free').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all registered users and their subscriptions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500' },
          { label: 'Premium', value: premiumCount, icon: Crown, color: 'text-amber-500' },
          { label: 'Free Plan', value: users.filter(u => !u.plan || u.plan === 'free').length, icon: Users, color: 'text-slate-500' },
          { label: 'Showing', value: filtered.length, icon: Search, color: 'text-primary' },
        ] as const).map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-3">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <div>
                <div className="text-lg font-bold tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Users</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {filtered.length} of {users.length} users shown
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-52"
                />
              </div>
              {/* Plan filter */}
              <select
                className="h-8 text-xs border border-border rounded-md px-2 bg-background"
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as PlanId | 'all')}
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="medium">Medium</option>
                <option value="pro">Pro</option>
                <option value="ultra_pro">Ultra Pro</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Resumes</TableHead>
                    <TableHead className="text-center">Portfolios</TableHead>
                    <TableHead className="text-center">Cover Letters</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(user => {
                    const planId: PlanId = user.plan ?? 'free';
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium pl-4">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-xs px-1.5 py-0 ${PLAN_BADGE[planId]}`}>
                              {PLAN_LABELS[planId]}
                            </Badge>
                            <select
                              className="text-xs border border-border/60 rounded px-1 py-0.5 bg-background ml-1 focus:outline-none focus:ring-1 focus:ring-primary"
                              value={planId}
                              disabled={changingPlan === user.id}
                              onChange={e => handlePlanChange(user.id, e.target.value as PlanId)}
                            >
                              <option value="free">Free</option>
                              <option value="medium">Medium</option>
                              <option value="pro">Pro</option>
                              <option value="ultra_pro">Ultra Pro</option>
                            </select>
                            {changingPlan === user.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{user.resumes}</TableCell>
                        <TableCell className="text-center tabular-nums">{user.portfolios}</TableCell>
                        <TableCell className="text-center tabular-nums">{user.coverLetters ?? 0}</TableCell>
                        <TableCell className="text-right pr-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Deleting {user.name} requires the Firebase Admin SDK via a server-side API route (not yet wired up). User data deletion cannot be performed from the client side for security reasons.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {search || planFilter !== 'all' ? 'No users match your filters.' : 'No users found.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

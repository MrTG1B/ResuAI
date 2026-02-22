
"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Ban, CheckCircle } from "lucide-react";
import { User, type PlanId } from "@/types/user";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { db, doc, setDoc } from '@/lib/firebase';

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free', medium: 'Medium', pro: 'Pro', ultra_pro: 'Ultra Pro',
};
const PLAN_COLORS: Record<PlanId, string> = {
  free: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  pro: 'bg-violet-100 text-violet-700',
  ultra_pro: 'bg-amber-100 text-amber-700',
};

interface UserTableProps {
  users: User[];
  onRefresh?: () => void;
}

export function UserTable({ users, onRefresh }: UserTableProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const handleDeleteUser = async (userId: string) => {
        toast({ title: "Note", description: "User deletion requires Firebase Admin SDK.", variant: "default" });
    };

    const handlePlanChange = async (userId: string, newPlan: PlanId) => {
        if (!db) {
            toast({ title: "Error", description: "Firebase not initialized.", variant: "destructive" });
            return;
        }
        setLoading(`plan-${userId}`);
        try {
            await setDoc(doc(db, 'users', userId), { plan: newPlan }, { merge: true });
            await setDoc(doc(db, 'users', userId, 'subscription', 'current'), {
                planId: newPlan,
                status: newPlan === 'free' ? 'inactive' : 'active',
            }, { merge: true });
            toast({ title: "Plan Updated", description: `Plan changed to ${PLAN_LABELS[newPlan]}.` });
            onRefresh?.();
        } catch (e) {
            toast({ title: "Error", description: "Failed to update plan.", variant: "destructive" });
        } finally {
            setLoading(null);
        }
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>All registered users with their plan and usage statistics.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Resumes</TableHead>
              <TableHead>Portfolios</TableHead>
              <TableHead>Cover Letters</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const planId: PlanId = user.plan ?? 'free';
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-xs ${PLAN_COLORS[planId]}`}>{PLAN_LABELS[planId]}</Badge>
                      <select
                        className="text-xs border rounded px-1 py-0.5 bg-background ml-1"
                        value={planId}
                        disabled={loading === `plan-${user.id}`}
                        onChange={(e) => handlePlanChange(user.id, e.target.value as PlanId)}
                      >
                        <option value="free">Free</option>
                        <option value="medium">Medium</option>
                        <option value="pro">Pro</option>
                        <option value="ultra_pro">Ultra Pro</option>
                      </select>
                    </div>
                  </TableCell>
                  <TableCell>{user.resumes}</TableCell>
                  <TableCell>{user.portfolios}</TableCell>
                  <TableCell>{user.coverLetters ?? 0}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user's account and all of their data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {users.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No users found.
            </div>
        )}
      </CardContent>
    </Card>
  );
}

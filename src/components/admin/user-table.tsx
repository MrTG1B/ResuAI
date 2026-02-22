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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, MoreHorizontal, Ban, CheckCircle, Settings, CreditCard } from "lucide-react";
import { AdminUser } from "@/types/admin/user";
import type { PlanId } from "@/types/subscription";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, doc, updateDoc, setDoc, collection, serverTimestamp } from '@/lib/firebase';
import { ToolAccessDialog } from './tool-access-dialog';

const PLAN_COLORS: Record<PlanId, string> = {
  free: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  pro: 'bg-violet-100 text-violet-700 border-violet-200',
  ultra_pro: 'bg-amber-100 text-amber-700 border-amber-200',
};

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free',
  medium: 'Medium',
  pro: 'Pro',
  ultra_pro: 'Ultra Pro',
};

interface UserTableProps {
  users: AdminUser[];
  onUserUpdated: () => void;
}

export function AdminUserTable({ users, onUserUpdated }: UserTableProps) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toolAccessDialog, setToolAccessDialog] = useState<{ userId: string; userName: string } | null>(null);

  const handleDeleteUser = async (userId: string) => {
    toast({ 
      title: "Note", 
      description: "User deletion requires admin privileges and Firebase Admin SDK.", 
      variant: "default" 
    });
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    if (!db) {
      toast({ title: "Error", description: "Firebase not initialized.", variant: "destructive" });
      return;
    }

    setActionLoading(userId);
    try {
      const userRef = doc(db, 'users', userId, 'admin', 'settings');
      await updateDoc(userRef, {
        isBlocked: !isBlocked,
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: `User ${isBlocked ? 'unblocked' : 'blocked'} successfully.`,
      });
      onUserUpdated();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: PlanId) => {
    if (!db) {
      toast({ title: "Error", description: "Firebase not initialized.", variant: "destructive" });
      return;
    }

    setActionLoading(`plan-${userId}`);
    try {
      // Update the user document with the new plan
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { plan: newPlan }, { merge: true });

      // Update the subscription subcollection
      const subRef = doc(db, 'users', userId, 'subscription', 'current');
      await setDoc(subRef, {
        planId: newPlan,
        status: newPlan === 'free' ? 'inactive' : 'active',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "Plan Updated",
        description: `User plan changed to ${PLAN_LABELS[newPlan]}.`,
      });
      onUserUpdated();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description: "Failed to update user plan.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage all registered users, their access, and activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Resumes</TableHead>
              <TableHead className="text-right">Portfolios</TableHead>
              <TableHead className="text-right">Cover Letters</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.isBlocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.plan ?? 'free'}
                    onValueChange={(val) => handlePlanChange(user.id, val as PlanId)}
                    disabled={actionLoading === `plan-${user.id}`}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">{user.resumes}</TableCell>
                <TableCell className="text-right">{user.portfolios}</TableCell>
                <TableCell className="text-right">{user.coverLetters || 0}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(user.id)}
                      >
                        Copy user ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setToolAccessDialog({ userId: user.id, userName: user.name })}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage tool access
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBlockUser(user.id, user.isBlocked || false)}
                        disabled={actionLoading === user.id}
                      >
                        {user.isBlocked ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Unblock user
                          </>
                        ) : (
                          <>
                            <Ban className="mr-2 h-4 w-4" />
                            Block user
                          </>
                        )}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete user
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user's account and all of their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            No users found.
          </div>
        )}
      </CardContent>
      {toolAccessDialog && (
        <ToolAccessDialog
          userId={toolAccessDialog.userId}
          userName={toolAccessDialog.userName}
          isOpen={true}
          onClose={() => setToolAccessDialog(null)}
          onUpdated={onUserUpdated}
        />
      )}
    </Card>
  );
}

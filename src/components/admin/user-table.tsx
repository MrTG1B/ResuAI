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
import { Trash2, MoreHorizontal, Ban, CheckCircle, Settings } from "lucide-react";
import { AdminUser } from "@/types/admin/user";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, doc, updateDoc } from '@/lib/firebase';
import { ToolAccessDialog } from './tool-access-dialog';

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

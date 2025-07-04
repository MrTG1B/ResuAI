"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Logo } from './logo';

export function Header({ pageActions }: { pageActions?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  }

  return (
    <header className="py-2 px-4 sm:px-6 lg:px-8 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <Logo className="h-8 w-auto" />
          </Link>
        </div>
        <nav className="flex items-center gap-4">
            <div className="flex items-center gap-2 justify-end flex-grow">
                {pageActions}
            </div>
            {loading ? (
                <Skeleton className="h-9 w-24" />
            ) : user ? (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                                <AvatarFallback className="text-sm font-semibold">
                                    {getInitials(user.displayName) || <UserIcon />}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/portfolio')} className="cursor-pointer">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>My Portfolio</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            ) : (
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" asChild size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </div>
            )}
        </nav>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, FileText, LayoutTemplate, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      router.push('/login');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Welcome, {user.displayName || 'User'}!
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    What would you like to create today?
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-2xl">AI Resume Builder</CardTitle>
                  <CardDescription className="text-center">
                    Craft a professional, job-winning resume from scratch with the help of our AI assistant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button asChild>
                    <Link href="/resume-builder">Build a Resume <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                    <div className="flex justify-center items-center mb-4">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <LayoutTemplate className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">AI Portfolio Generator</CardTitle>
                    <CardDescription className="text-center">
                        Upload your resume to instantly generate a beautiful, personalized portfolio website.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button asChild>
                        <Link href="/build">Create a Portfolio <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </CardContent>
              </Card>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

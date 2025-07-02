"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Construction } from 'lucide-react';

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) {
        router.push('/login');
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
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
        <p className="mt-4 text-muted-foreground">Verifying your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-2xl text-center shadow-2xl">
          <CardHeader>
            <div className="flex justify-center items-center mb-4">
              <Construction className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">
              AI Resume Builder Coming Soon!
            </CardTitle>
            <CardDescription className="mt-2 text-lg">
              We're hard at work creating a powerful AI-driven resume building experience for you. Stay tuned!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              In the meantime, you can create a stunning portfolio from your existing resume.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ResumeForm } from "@/components/resume-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BuildPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      toast({
        title: "Configuration Error",
        description: "Firebase is not configured. Please provide API keys in your .env file.",
        variant: "destructive",
      });
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
  }, [router, toast]);

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
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                AI-Powered Career Tools
              </h1>
              <CardDescription className="mt-2 text-lg">
                Upload your resume to instantly generate a stunning portfolio. More AI resume-building tools are coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

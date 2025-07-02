
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, PenSquare, ArrowRight } from 'lucide-react';

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
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              AI-Powered Resume Builder
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Choose how you want to create your professional, job-winning resume.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <UploadCloud className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Update Existing Resume</CardTitle>
                <CardDescription className="text-center">
                  Upload your current resume and let our AI help you refine and improve its content and formatting.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/resume-builder/editor">Upload Resume <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                  <div className="flex justify-center items-center mb-4">
                      <div className="bg-primary/10 p-4 rounded-full">
                          <PenSquare className="h-10 w-10 text-primary" />
                      </div>
                  </div>
                  <CardTitle className="text-center text-2xl">Create from Scratch</CardTitle>
                  <CardDescription className="text-center">
                      Start with a blank canvas and let our AI guide you through building a powerful resume step-by-step.
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                  <Button asChild disabled>
                      <Link href="#">Start from Scratch <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
              </CardContent>
            </Card>
          </div>
           <div className="text-center">
            <Button variant="link" onClick={() => router.push('/dashboard')}>
              &larr; Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

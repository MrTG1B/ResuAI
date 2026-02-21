
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UploadCloud, PenSquare, ArrowRight } from 'lucide-react';
import { BrandLoader } from '@/components/brand-loader';

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

  const handleStartFromScratch = () => {
    router.push('/resume-builder/editor?from=scratch');
  };

  const handleUploadResume = () => {
    router.push('/resume-builder/editor?from=upload');
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <BrandLoader size="lg" />
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
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
              AI-Powered Resume Builder
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Let AI create a professional, ATS-friendly resume for you in seconds.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <PenSquare className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Start from Scratch</CardTitle>
                <CardDescription className="text-center">
                  AI reads your profile data and instantly generates a complete, single-page professional resume. Refine it further using the chat assistant.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={handleStartFromScratch}>
                    Generate My Resume <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
             <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                  <div className="flex justify-center items-center mb-4">
                      <div className="bg-primary/10 p-4 rounded-full">
                           <UploadCloud className="h-10 w-10 text-primary" />
                      </div>
                  </div>
                  <CardTitle className="text-center text-2xl">Upload Existing Resume</CardTitle>
                  <CardDescription className="text-center">
                      Upload your current resume (PDF). AI extracts all content and regenerates it as a polished, ATS-optimized resume. Chat to make any further changes.
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                  <Button onClick={handleUploadResume}>
                      Upload &amp; Regenerate <ArrowRight className="ml-2 h-5 w-5" />
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
    </div>
  );
}

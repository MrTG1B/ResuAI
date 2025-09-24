
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ResumeForm } from "@/components/resume-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { BrandLoader } from '@/components/brand-loader';
import { CreativeLoader } from "@/components/creative-loader";


const analysisTexts = [
  "Analyzing resume...",
  "Extracting skills & experience...",
  "Generating a professional design...",
  "Building your portfolio...",
  "Finalizing...",
];


export default function BuildPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <BrandLoader size="lg" />
        <p className="mt-4 text-muted-foreground">Verifying your session...</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col h-screen bg-muted/20">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center h-full text-center">
          <CreativeLoader texts={analysisTexts} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen parallax-bg">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in-down">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl overflow-hidden border-t-4 border-primary" style={{
              borderImageSlice: 1,
              borderImageSource: 'linear-gradient(to left, hsl(var(--primary)), #45B8AC)'
            }}>
            <CardHeader className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
                Create Your AI-Powered Portfolio
              </h1>
              <CardDescription className="mt-2 text-lg">
                Upload your resume, and our AI will instantly generate a stunning, professional portfolio website for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeForm user={currentUser} setIsProcessing={setIsProcessing} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

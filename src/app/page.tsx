
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowRight, Bot, PenSquare, Eye, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/build');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32 bg-gradient-to-b from-background to-muted/40 animate-fade-in-down">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-primary mb-4">
              Your Career Story, Reimagined
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              ResuAI transforms your resume into a stunning, professional portfolio website in seconds. Land your dream job with a portfolio that stands out.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="text-lg text-muted-foreground mt-2">A simple, powerful, and fast three-step process.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-8 rounded-lg border bg-card shadow-sm animate-fade-in-up transition-transform duration-300 hover:-translate-y-2">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Upload & Analyze</h3>
                <p className="text-muted-foreground">
                  Simply upload your resume. Our AI analyzes your skills, experience, and projects to create a structured draft.
                </p>
              </div>
              <div className="p-8 rounded-lg border bg-card shadow-sm animate-fade-in-up transition-transform duration-300 hover:-translate-y-2" style={{ animationDelay: '200ms' }}>
                 <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <PenSquare className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Customize & Refine</h3>
                <p className="text-muted-foreground">
                  Easily edit any section of your portfolio. Update text, upload project images, and add your personal touch.
                </p>
              </div>
              <div className="p-8 rounded-lg border bg-card shadow-sm animate-fade-in-up transition-transform duration-300 hover:-translate-y-2" style={{ animationDelay: '400ms' }}>
                 <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Publish & Share</h3>
                <p className="text-muted-foreground">
                  Your professional portfolio is ready! Share the link with recruiters and on your social profiles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

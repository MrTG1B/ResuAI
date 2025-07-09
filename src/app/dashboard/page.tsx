
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, FileText, LayoutTemplate, ArrowRight, SearchCheck } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-fade-in-down">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-heading">
                    Welcome back, {user.displayName || 'Creator'}!
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Let's build something amazing today.
                </p>
            </div>
            
            <Card className="shadow-xl border-none animate-fade-in-up">
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        <Link href="/resume-builder/editor" className="group block p-8 hover:bg-primary/5 transition-colors duration-300 rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold font-heading">AI Resume Editor</h2>
                            </div>
                            <p className="mt-3 text-muted-foreground">
                                Upload and enhance your resume with AI-powered suggestions, formatting, and content improvements.
                            </p>
                            <div className="mt-4 font-semibold text-primary flex items-center gap-2">
                                Start Editing
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                        
                        <Link href="/resume-analyzer" className="group block p-8 hover:bg-primary/5 transition-colors duration-300 border-y md:border-y-0 md:border-x">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <SearchCheck className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold font-heading">AI Resume Analyzer</h2>
                            </div>
                            <p className="mt-3 text-muted-foreground">
                                Get instant feedback on how well your resume matches a specific job description to boost your chances.
                            </p>
                            <div className="mt-4 font-semibold text-primary flex items-center gap-2">
                                Analyze Resume
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                        
                        <Link href="/build" className="group block p-8 hover:bg-primary/5 transition-colors duration-300 rounded-b-lg md:rounded-r-lg md:rounded-bl-none">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <LayoutTemplate className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold font-heading">AI Portfolio Generator</h2>
                            </div>
                            <p className="mt-3 text-muted-foreground">
                                Instantly transform your resume into a stunning, professional portfolio website to showcase your work.
                            </p>
                            <div className="mt-4 font-semibold text-primary flex items-center gap-2">
                                Create Portfolio
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <Card className="flex flex-col shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Portfolio</CardTitle>
                        <CardDescription>View, edit, and share your generated portfolio.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Once you've generated a portfolio, you can access it here at any time to make edits or get a shareable link.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/portfolio">Go to My Portfolio <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col shadow-lg">
                    <CardHeader>
                        <CardTitle>Career Hub</CardTitle>
                        <CardDescription>Learn more about us and our mission.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Discover how our AI tools can help you accelerate your career journey and stand out to recruiters.</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" asChild>
                            <Link href="/about">About ResuAI</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

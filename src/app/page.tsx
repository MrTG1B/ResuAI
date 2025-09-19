"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowRight, Bot, PenSquare, Eye, Loader2, Star, Quote, FileText, LayoutTemplate, SearchCheck, NotebookPen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [offsetY, setOffsetY] = useState(0);

  const handleScroll = () => setOffsetY(window.pageYOffset);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
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
        <section className="relative text-center py-20 md:py-32 bg-background animate-fade-in-down overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/10 blur-[100px] -z-10" />
          <div 
            className="container mx-auto px-4 relative z-10"
            style={{ transform: `translateY(${offsetY * 0.4}px)` }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 font-heading text-primary">
              Craft Your Future with AI-Powered Career Tools
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
             Build the perfect resume, write compelling cover letters, and ace your interviews. ResuAI is your personal career assistant.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="font-bold">
                <Link href="/signup">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card/40">
          <div className="container mx-auto px-4">
            <div 
              className="text-center mb-16"
              style={{ transform: `translateY(${Math.min(offsetY * 0.2, 50)}px)` }}
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">Simple, Powerful, and Fast</h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">Our AI streamlines the entire process, from analyzing your experience to designing a beautiful final product.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div 
                className="p-8 rounded-lg border bg-card shadow-lg animate-fade-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30"
                style={{ transform: `translateY(${offsetY * 0.1}px)` }}
              >
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">1. Provide Your Info</h3>
                <p className="text-muted-foreground">
                  Simply upload your resume. Our AI analyzes your info to create a structured draft for a resume or portfolio.
                </p>
              </div>
              <div 
                className="p-8 rounded-lg border bg-card shadow-lg animate-fade-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30" 
                style={{ animationDelay: '200ms', transform: `translateY(${offsetY * 0.15}px)` }}
              >
                 <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <PenSquare className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">2. Customize & Refine</h3>
                <p className="text-muted-foreground">
                  Easily edit any section. Get AI suggestions, apply professional templates, and customize the design to match your style.
                </p>
              </div>
              <div 
                className="p-8 rounded-lg border bg-card shadow-lg animate-fade-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30" 
                style={{ animationDelay: '400ms', transform: `translateY(${offsetY * 0.2}px)` }}
              >
                 <div className="flex justify-center items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">3. Publish & Share</h3>
                <p className="text-muted-foreground">
                  Download a professional resume or share your portfolio with a unique link. Impress recruiters and land your dream job.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Toolkit Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Your AI-Powered Career Toolkit</h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">Everything you need to analyze, edit, and showcase your professional story.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="animate-fade-in-up group" style={{ animationDelay: '0ms' }}>
                <Card className="p-6 rounded-lg border bg-card shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:border-primary/30 flex flex-col h-full text-center">
                  <div className="flex-shrink-0 flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-heading">AI Resume Editor</h3>
                  <p className="text-muted-foreground flex-grow mb-6">
                    Upload your existing resume and let our AI assistant help you refine content, fix typos, and even redesign the entire layout with professional templates.
                  </p>
                </Card>
              </div>
              <div className="animate-fade-in-up group" style={{ animationDelay: '150ms' }}>
                <Card className="p-6 rounded-lg border bg-card shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:border-primary/30 flex flex-col h-full text-center">
                  <div className="flex-shrink-0 flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <NotebookPen className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-heading">AI Cover Letter Generator</h3>
                  <p className="text-muted-foreground flex-grow mb-6">
                    Create a professional cover letter tailored to any job description in seconds, using your profile data to highlight your strengths.
                  </p>
                </Card>
              </div>
              <div className="animate-fade-in-up group" style={{ animationDelay: '300ms' }}>
                <Card className="p-6 rounded-lg border bg-card shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:border-primary/30 flex flex-col h-full text-center">
                  <div className="flex-shrink-0 flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <SearchCheck className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-heading">AI Resume ATS Checker</h3>
                  <p className="text-muted-foreground flex-grow mb-6">
                    Get instant, detailed feedback. Our AI coach analyzes your resume against a job description to identify strengths, weaknesses, and actionable steps.
                  </p>
                </Card>
              </div>
              <div className="animate-fade-in-up group" style={{ animationDelay: '450ms' }}>
                <Card className="p-6 rounded-lg border bg-card shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:border-primary/30 flex flex-col h-full text-center">
                  <div className="flex-shrink-0 flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <LayoutTemplate className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-heading">AI Portfolio Generator</h3>
                  <p className="text-muted-foreground flex-grow mb-6">
                    Transform your resume into a stunning, professional portfolio website in seconds. Choose from beautiful themes and share your unique link.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-card/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">Why Professionals Love ResuAI</h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">Don't just take our word for it. Here's what our users are saying.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-8 bg-card flex flex-col items-center text-center animate-fade-in-up transition-transform duration-300 hover:scale-105">
                <Quote className="h-10 w-10 text-primary mb-4" />
                <p className="text-muted-foreground mb-6 flex-grow">"I created a portfolio in under 5 minutes that looked better than what I spent weeks trying to build myself. Truly magical!"</p>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="font-semibold">Sarah L.</p>
                <p className="text-sm text-muted-foreground">UX Designer</p>
              </Card>
               <Card className="p-8 bg-card flex flex-col items-center text-center animate-fade-in-up transition-transform duration-300 hover:scale-105" style={{ animationDelay: '200ms' }}>
                <Quote className="h-10 w-10 text-primary mb-4" />
                <p className="text-muted-foreground mb-6 flex-grow">"The AI Resume Analyzer gave me the exact feedback I needed to land three interviews. It's like having a personal career coach."</p>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="font-semibold">Michael B.</p>
                <p className="text-sm text-muted-foreground">Software Engineer</p>
              </Card>
               <Card className="p-8 bg-card flex flex-col items-center text-center animate-fade-in-up transition-transform duration-300 hover:scale-105" style={{ animationDelay: '400ms' }}>
                <Quote className="h-10 w-10 text-primary mb-4" />
                <p className="text-muted-foreground mb-6 flex-grow">"As a recent graduate, this tool was a lifesaver. It helped me create a resume that got noticed and felt professional."</p>
                 <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="font-semibold">Jessica R.</p>
                <p className="text-sm text-muted-foreground">Marketing Graduate</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 bg-background">
           <div className="container mx-auto px-4 text-center">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 font-heading bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Ready to Build Your Future?</h2>
             <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
               Join thousands of professionals who are taking their careers to the next level. Get started today and see the difference AI can make.
             </p>
             <div className="flex justify-center gap-4">
               <Button asChild size="lg" className="font-bold">
                 <Link href="/signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
               </Button>
             </div>
           </div>
         </section>
      </main>
      <Footer />
    </div>
  );
}

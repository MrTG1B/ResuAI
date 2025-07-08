
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnalyzerChatPanel } from '@/components/analyzer-chat-panel';

export default function CoachPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const [initialAnalysis, setInitialAnalysis] = useState<string | null>(null);
  const [resumeDataUri, setResumeDataUri] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        if (typeof window !== "undefined") {
            const analysis = sessionStorage.getItem('analysisResult');
            const resumeUri = sessionStorage.getItem('analysisResumeDataUri');
            const jobDesc = sessionStorage.getItem('analysisJobDescription');
            const fileName = sessionStorage.getItem('analysisResumeFileName');

            if (!analysis || !resumeUri || !jobDesc || !fileName) {
                toast({ title: "Session Expired", description: "Analysis data not found. Please start again.", variant: "destructive" });
                router.push('/resume-analyzer');
            } else {
                setInitialAnalysis(analysis);
                setResumeDataUri(resumeUri);
                setJobDescription(jobDesc);
                setResumeFileName(fileName);
            }
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not load analysis session.", variant: "destructive" });
        router.push('/resume-analyzer');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleApplySuggestionsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!resumeDataUri || !initialAnalysis || !resumeFileName) {
        toast({ title: "Error", description: "Missing data to apply suggestions.", variant: "destructive" });
        return;
    }
    sessionStorage.setItem('resumeForEditingDataUri', resumeDataUri);
    sessionStorage.setItem('resumeForEditingSuggestions', initialAnalysis);
    sessionStorage.setItem('resumeForEditingFileName', resumeFileName);
    router.push('/resume-builder/editor');
  };


  if (isLoading || !initialAnalysis || !resumeDataUri || !jobDescription) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your coaching session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/20">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-2 h-full min-h-0">
                <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-6 border-b flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2"><Bot className="text-primary h-5 w-5" /> Initial AI Analysis</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/resume-analyzer"><ArrowLeft className="mr-2 h-4 w-4" /> Start Over</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 sm:p-6 bg-muted/30 overflow-auto">
                        <div className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                            <ReactMarkdown
                                rehypePlugins={[rehypeRaw]}
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    a: ({node, children, href, ...rest}) => {
                                        if (href === '/resume-builder/editor') {
                                            return <a href={href} onClick={handleApplySuggestionsClick} {...rest}>{children}</a>;
                                        }
                                        if (href && href.startsWith('/')) {
                                            return <Link href={href} {...rest}>{children}</Link>;
                                        }
                                        return <a href={href} {...rest} target="_blank" rel="noopener noreferrer">{children}</a>;
                                    }
                                }}
                            >
                                {initialAnalysis}
                            </ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 h-full min-h-0">
                <AnalyzerChatPanel 
                    initialAnalysis={initialAnalysis}
                    resumeDataUri={resumeDataUri}
                    jobDescription={jobDescription}
                />
            </div>
        </div>
      </main>
    </div>
  );
}

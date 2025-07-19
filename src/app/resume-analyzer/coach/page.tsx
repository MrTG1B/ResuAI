
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { type JobMatchAnalysis } from '@/types/resume';

function getProgressColor(score: number) {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
}

export default function CoachPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [resumeDataUri, setResumeDataUri] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        if (typeof window !== "undefined") {
            const analysisString = sessionStorage.getItem('analysisResult');
            const resumeUri = sessionStorage.getItem('analysisResumeDataUri');
            const fileName = sessionStorage.getItem('analysisResumeFileName');

            if (!analysisString || !resumeUri || !fileName) {
                toast({ title: "Session Expired", description: "Analysis data not found. Please start again.", variant: "destructive" });
                router.push('/resume-analyzer');
            } else {
                setAnalysis(JSON.parse(analysisString));
                setResumeDataUri(resumeUri);
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
    if (!resumeDataUri || !analysis?.detailedAnalysis || !resumeFileName) {
        toast({ title: "Error", description: "Missing data to apply suggestions.", variant: "destructive" });
        return;
    }
    sessionStorage.setItem('resumeForEditingDataUri', resumeDataUri);
    sessionStorage.setItem('resumeForEditingSuggestions', analysis.detailedAnalysis);
    sessionStorage.setItem('resumeForEditingFileName', resumeFileName);
    router.push('/resume-builder/editor');
  };


  if (isLoading || !analysis || !resumeDataUri) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your analysis report...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader className="text-center border-b pb-6">
                    <CardTitle className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
                        AI Resume Analysis Report
                    </CardTitle>
                    <div className="max-w-xl mx-auto pt-4">
                        <p className="text-xl font-semibold mb-2">{analysis.matchScore}% Match</p>
                        <Progress value={analysis.matchScore} className="h-3" indicatorClassName={getProgressColor(analysis.matchScore)} />
                        <CardDescription className="mt-3 text-base">
                            {analysis.matchSummary}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:font-heading prose-headings:text-primary">
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
                            {analysis.detailedAnalysis}
                        </ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-6 text-center">
                 <Button variant="outline" onClick={() => router.push('/resume-analyzer')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Analyze Another Resume
                </Button>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

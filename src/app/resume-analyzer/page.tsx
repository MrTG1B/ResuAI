
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Bot, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { atsAnalyzeAction } from '@/app/actions';
import { CreativeLoader } from '@/components/creative-loader';
import { AtsResult } from '@/components/ats-result';
import { type AtsAnalyzerOutput } from '@/ai/flows/job-match-analyzer';
import { BrandLoader } from '@/components/brand-loader';

const analysisTexts = [
    "Simulating ATS scan...",
    "Checking for parsing errors...",
    "Analyzing keyword alignment...",
    "Evaluating resume structure...",
    "Compiling your report...",
    "Just a moment...",
];

export default function ResumeAnalyzerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [analysisResult, setAnalysisResult] = useState<AtsAnalyzerOutput | null>(null);

  useEffect(() => {
    // Clear session storage on initial load to prevent carrying over old data
    sessionStorage.removeItem('resumeForAnalysisDataUri');
    sessionStorage.removeItem('resumeForAnalysisFileName');
    sessionStorage.removeItem('resumeSuggestions');

    if (!auth) {
      toast({
        title: "Configuration Error",
        description: "Firebase is not configured.",
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
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.type !== 'application/pdf') {
            toast({
              title: "Invalid File Type",
              description: "Please upload a PDF file.",
              variant: "destructive",
            });
            return;
        }
        setResumeFile(selectedFile);
        setResumeFileName(selectedFile.name);
    }
  };

  const handleStartNewAnalysis = () => {
    setAnalysisResult(null);
    setResumeFile(null);
    setResumeFileName("");
    setJobDescription("");
    sessionStorage.removeItem('resumeForAnalysisDataUri');
    sessionStorage.removeItem('resumeForAnalysisFileName');
    sessionStorage.removeItem('resumeSuggestions');
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resumeFile) {
      toast({ title: "No resume selected", description: "Please upload your resume.", variant: "destructive" });
      return;
    }
    if (!jobDescription.trim()) {
      toast({ title: "No job description", description: "Please paste the job description.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    const performAnalysis = async (dataUri: string) => {
        try {
            // Store the resume data in session storage before analysis
            sessionStorage.setItem('resumeForAnalysisDataUri', dataUri);
            sessionStorage.setItem('resumeForAnalysisFileName', resumeFileName);

            const result = await atsAnalyzeAction({ resumeDataUri: dataUri, jobDescription });

            if (result.success && result.data) {
                setAnalysisResult(result.data);
            } else {
                throw new Error(result.error || "Failed to analyze resume.");
            }
        } catch (error: any) {
            toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    if (resumeFile) {
        const reader = new FileReader();
        reader.readAsDataURL(resumeFile);
        reader.onload = async () => performAnalysis(reader.result as string);
        reader.onerror = () => {
          setIsAnalyzing(false);
          toast({ title: "File Read Error", description: "There was an error reading your resume file.", variant: "destructive" });
        }
    }
  };

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
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {isAnalyzing ? (
                <Card className="shadow-2xl">
                    <CardContent className="p-8 h-96 flex items-center justify-center">
                        <CreativeLoader texts={analysisTexts} />
                    </CardContent>
                </Card>
            ) : analysisResult ? (
                <AtsResult result={analysisResult} onTryAgain={handleStartNewAnalysis} />
            ) : (
                <Card className="shadow-2xl">
                    <CardHeader className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
                            AI-Powered ATS Resume Checker
                        </h1>
                        <CardDescription className="mt-2 text-lg">
                            Upload your resume and paste a job description to see if you can beat the bots.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6 items-stretch">
                                <Card className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                                        <FileText className="h-5 w-5 text-[#45B8AC]" />
                                        <CardTitle className="text-lg">Your Resume</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <label
                                            htmlFor="resume-upload"
                                            className="relative flex flex-col items-center justify-center w-full h-full min-h-[160px] border-2 border-dashed rounded-lg cursor-pointer bg-background/30 hover:bg-background/70 transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                <UploadCloud className="w-8 h-8 mb-2 text-[#45B8AC]" />
                                                <p className="text-sm text-foreground">
                                                <span className="font-semibold">Click to upload</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                                                {resumeFileName && <p className="mt-2 text-xs font-medium text-primary truncate max-w-full px-2">{resumeFileName}</p>}
                                            </div>
                                            <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" disabled={isAnalyzing}/>
                                        </label>
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/30 flex flex-col">
                                     <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                                        <FileText className="h-5 w-5 text-[#45B8AC]" />
                                        <CardTitle className="text-lg">Job Description</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <Textarea
                                            id="job-description"
                                            placeholder="Paste the full job description here..."
                                            className="h-full min-h-[160px] resize-none bg-background/30"
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            disabled={isAnalyzing}
                                            required
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                            <Button type="submit" className="w-full text-lg" size="lg" disabled={isAnalyzing} style={{backgroundColor: '#45B8AC', color: 'white'}}>
                                <Bot className="mr-2 h-5 w-5" />
                                Scan My Resume
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
      </main>
    </div>
  );
}

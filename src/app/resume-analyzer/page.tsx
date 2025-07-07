
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jobMatchAnalyzeAction } from '@/app/actions';
import { CreativeLoader } from '@/components/creative-loader';

const analysisTexts = [
    "Reading your resume...",
    "Scanning the job description...",
    "Comparing skills and experience...",
    "Identifying keywords and gaps...",
    "Formulating coaching advice...",
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

  useEffect(() => {
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
      setResumeFile(selectedFile);
      setResumeFileName(selectedFile.name);
    }
  };

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

    const reader = new FileReader();
    reader.readAsDataURL(resumeFile);
    reader.onload = async () => {
        try {
            const resumeDataUri = reader.result as string;
            const result = await jobMatchAnalyzeAction({ resumeDataUri, jobDescription });

            if (result.success && result.data) {
                if (typeof window !== "undefined") {
                    sessionStorage.setItem('analysisResult', result.data.analysis);
                    sessionStorage.setItem('analysisResumeDataUri', resumeDataUri);
                    sessionStorage.setItem('analysisJobDescription', jobDescription);
                }
                router.push('/resume-analyzer/coach');
            } else {
                throw new Error(result.error || "Failed to analyze resume.");
            }
        } catch (error: any) {
            toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
            setIsAnalyzing(false);
        }
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      toast({ title: "File Read Error", description: "There was an error reading your resume file.", variant: "destructive" });
    }
  };

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
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <Card className="shadow-2xl">
                <CardHeader className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                        AI Resume Analyzer
                    </h1>
                    <CardDescription className="mt-2 text-lg">
                        Upload your resume and paste a job description to get personalized coaching from our AI.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isAnalyzing ? (
                        <div className="h-64">
                            <CreativeLoader texts={analysisTexts} className="flex flex-col items-center justify-center h-full text-center"/>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="resume-upload" className="text-lg font-semibold">Your Resume</Label>
                                    <label
                                        htmlFor="resume-upload"
                                        className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                            <UploadCloud className="w-8 h-8 mb-2 text-primary" />
                                            <p className="text-sm text-foreground">
                                            <span className="font-semibold">Click to upload</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">PDF or DOCX (MAX. 5MB)</p>
                                            {resumeFileName && <p className="mt-2 text-xs font-medium text-primary truncate max-w-full px-2">{resumeFileName}</p>}
                                        </div>
                                        <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx" disabled={isAnalyzing}/>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="job-description" className="text-lg font-semibold">Job Description</Label>
                                    <Textarea
                                        id="job-description"
                                        placeholder="Paste the full job description here..."
                                        className="h-40 resize-none"
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        disabled={isAnalyzing}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full text-lg" size="lg" disabled={isAnalyzing}>
                                {isAnalyzing ? (
                                    <>
                                        <Bot className="mr-2 h-5 w-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    "Start AI Coaching Session"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

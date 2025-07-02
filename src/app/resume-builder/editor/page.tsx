
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, setDoc } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, Download, LayoutTemplate, Paperclip } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { parseResumeAction, analyzeResumeAction } from '@/app/actions';
import { type ParsedResume } from '@/types/resume';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from 'jspdf';

export default function ResumeEditorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const [resumeData, setResumeData] = useState<ParsedResume | null>(() => {
        if (typeof window !== "undefined") {
            const storedResume = sessionStorage.getItem('resumeData');
            if (storedResume) return JSON.parse(storedResume);
        }
        return null;
    });

    const [previewUri, setPreviewUri] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem('resumePreviewUri') || null;
        }
        return null;
    });

    const [resumeDataUri, setResumeDataUri] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem('resumeDataUri') || null;
        }
        return null;
    });
    
    const [fileName, setFileName] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem('resumeFileName') || "";
        }
        return "";
    });
    
    const hiddenPreviewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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

    const generatePdfPreview = useCallback(async (htmlContent: string) => {
        if (!hiddenPreviewRef.current) return;
        setIsGeneratingPdf(true);
        
        hiddenPreviewRef.current.innerHTML = htmlContent;

        try {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4'
            });
            
            await pdf.html(hiddenPreviewRef.current, {
                autoPaging: 'text',
                margin: [40, 30, 40, 30],
            });
            
            const newPreviewUri = pdf.output('datauristring');
            setPreviewUri(newPreviewUri);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('resumePreviewUri', newPreviewUri);
            }
        } catch(error) {
            console.error("PDF generation failed:", error);
            toast({ title: "Preview Failed", description: "Could not generate the text-based PDF preview.", variant: "destructive" });
        } finally {
            if (hiddenPreviewRef.current) {
                hiddenPreviewRef.current.innerHTML = '';
            }
            setIsGeneratingPdf(false);
        }
    }, [toast]);
    
    const handleResumeUpdate = (newResumeData: ParsedResume) => {
        setResumeData(newResumeData);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('resumeData', JSON.stringify(newResumeData));
        }
        generatePdfPreview(newResumeData.htmlContent);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);
        setResumeData(null);
        setPreviewUri(null);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const uploadedResumeDataUri = reader.result as string;

                setPreviewUri(uploadedResumeDataUri);
                setResumeDataUri(uploadedResumeDataUri);
                sessionStorage.setItem('resumePreviewUri', uploadedResumeDataUri);
                sessionStorage.setItem('resumeDataUri', uploadedResumeDataUri);
                sessionStorage.setItem('resumeFileName', file.name);

                const result = await parseResumeAction({ resumeDataUri: uploadedResumeDataUri });

                if (result.success && result.data) {
                    setResumeData(result.data);
                    sessionStorage.setItem('resumeData', JSON.stringify(result.data));
                    toast({ title: "Resume Uploaded", description: "You can now edit your resume with AI." });
                } else {
                    throw new Error(result.error || "Failed to parse resume.");
                }
            } catch (error: any) {
                toast({ title: "Parsing Failed", description: error.message, variant: "destructive" });
                setFileName("");
                setResumeDataUri(null);
                setPreviewUri(null);
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
          setIsParsing(false);
          setFileName("");
          setResumeDataUri(null);
          setPreviewUri(null);
          toast({ title: "File Read Error", description: "There was an error reading the file.", variant: "destructive" });
        }
    };

    const handleDownload = () => {
        if (!previewUri) {
             toast({ title: "Nothing to download", description: "Please upload or generate a resume first.", variant: "destructive" });
             return;
        }
        const link = document.createElement('a');
        link.href = previewUri;
        link.download = 'resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConvertToPortfolio = async () => {
        if (!resumeDataUri) {
            toast({
                title: "File Not Found",
                description: "The original resume file is needed to create a portfolio. Please re-upload.",
                variant: "destructive",
            });
            return;
        }

        if (!auth?.currentUser || !db) {
            toast({
                title: "Authentication Error",
                description: "Please log in to create a portfolio.",
                variant: "destructive",
            });
            return;
        }

        setIsConverting(true);
        const user = auth.currentUser;

        try {
            const result = await analyzeResumeAction({ resumeDataUri });

            if (result.success && result.data) {
                await setDoc(doc(db, "portfolios", user.uid), result.data);
                toast({
                    title: "Portfolio Created!",
                    description: "Redirecting you to your new portfolio page.",
                });
                router.push("/portfolio");
            } else {
                throw new Error(result.error || "Analysis failed");
            }
        } catch (error: any) {
            toast({
                title: "Failed to build portfolio",
                description: error.message || "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsConverting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Editor...</p>
            </div>
        );
    }
    
    if (!isAuthenticated) return null;

    const editorActions = (
        <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="outline" disabled={!previewUri || isGeneratingPdf || isParsing}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
            <Button onClick={handleConvertToPortfolio} disabled={!resumeDataUri || isConverting || isParsing}>
                {isConverting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <LayoutTemplate className="mr-2 h-4 w-4" />
                )}
                Create Portfolio
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-muted/20">
            <Header pageActions={editorActions} />
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-hidden">
                {isParsing ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
                        <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                        <p className="text-sm text-foreground">Analyzing your document...</p>
                    </div>
                ) : (resumeData || previewUri) ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        <div className="lg:col-span-2 h-full min-h-0">
                           <Card className="h-full flex flex-col overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-xl font-medium">Resume Preview</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow p-4 sm:p-6 bg-muted/30 flex justify-center items-center min-h-0 relative">
                                    {(isGeneratingPdf) && (
                                        <div className="absolute inset-0 bg-background/80 z-20 flex flex-col items-center justify-center text-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                            <p className="mt-4 font-medium text-muted-foreground">
                                                Generating preview...
                                            </p>
                                        </div>
                                    )}
                                    {previewUri ? (
                                        <iframe 
                                          src={`${previewUri}#toolbar=0&navpanes=0`} 
                                          title="Resume Preview"
                                          width="100%" 
                                          height="100%" 
                                          className="z-10 border-none"
                                        />
                                    ) : (
                                        !isGeneratingPdf && (
                                            <div className="text-center text-destructive">
                                                <p>Could not load preview.</p>
                                                <p className="text-xs text-muted-foreground">Please try uploading the file again.</p>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 h-full min-h-0">
                             {resumeData ? (
                                <ResumeChatPanel resume={resumeData} setResume={handleResumeUpdate} />
                            ) : (
                                <Card className="h-full flex items-center justify-center">
                                    <div className="text-center text-muted-foreground p-4">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                        <p>Analyzing resume for AI editing...</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">AI Resume Editor</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Upload your resume to start making improvements with AI.</p>
                         <div className="mt-8 w-full">
                            <label
                            htmlFor="resume-upload"
                            className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-3 text-primary" />
                                    <p className="mb-2 text-sm text-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">PDF or DOCX (MAX. 5MB)</p>
                                    {fileName && <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>}
                                </div>
                                <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx" disabled={isParsing} />
                            </label>
                        </div>
                    </div>
                )}
            </main>
            {/* Hidden div for jsPDF to render into */}
            <div ref={hiddenPreviewRef} className="absolute -left-[9999px] top-0 bg-white text-black w-[8.27in] min-h-[11.69in] font-serif"></div>
        </div>
    );
}

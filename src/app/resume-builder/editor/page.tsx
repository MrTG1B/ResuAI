
'use client';
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, setDoc } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { parseResumeAction, analyzeResumeAction } from '@/app/actions';
import { type AnalyzeResumeInput } from '@/ai/flows/resume-analysis';
import { type ParsedResume, type ChatMessage } from '@/types/resume';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from 'jspdf';
import { CreativeLoader } from '@/components/creative-loader';

const parsingTexts = [
    "Reading your document...",
    "Parsing structure and style...",
    "Preparing the editor...",
    "Just a moment...",
];

const generatingPdfTexts = [
    "Rebuilding your resume as a PDF...",
    "Applying formatting...",
    "Generating high-fidelity preview...",
    "Finalizing document...",
];

const applyingSuggestionsTexts = [
    "Applying AI suggestions...",
    "Reworking your resume content...",
    "Implementing improvements...",
    "This may take a moment...",
];


export default function ResumeEditorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isApplyingSuggestions, setIsApplyingSuggestions] = useState(false);
    
    const [initialPreviewUri, setInitialPreviewUri] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem('resumePreviewUri') || null;
        }
        return null;
    });

    const [resumeData, setResumeData] = useState<ParsedResume | null>(() => {
        if (typeof window !== "undefined") {
            const storedResume = sessionStorage.getItem('resumeData');
            if (storedResume) return JSON.parse(storedResume);
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

    const [isLivePreview, setIsLivePreview] = useState(false);
    const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
    
    const livePreviewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        });

        if (typeof window !== "undefined") {
            if (sessionStorage.getItem('isLivePreview') === 'true') {
                setIsLivePreview(true);
            }
        }

        const applySuggestions = async () => {
            const resumeUri = sessionStorage.getItem('resumeForEditingDataUri');
            const suggestions = sessionStorage.getItem('resumeForEditingSuggestions');
            const name = sessionStorage.getItem('resumeForEditingFileName');
    
            if (resumeUri && suggestions && name) {
                sessionStorage.removeItem('resumeForEditingDataUri');
                sessionStorage.removeItem('resumeForEditingSuggestions');
                sessionStorage.removeItem('resumeForEditingFileName');
    
                setIsApplyingSuggestions(true);
                setFileName(name);
                setResumeDataUri(resumeUri);
                setInitialPreviewUri(resumeUri);
    
                try {
                    const parseResult = await parseResumeAction({ resumeDataUri: resumeUri });
                    if (!parseResult.success || !parseResult.data) {
                        throw new Error(parseResult.error || "Failed to parse resume.");
                    }
                    const originalHtml = parseResult.data.htmlContent;
                    
                    const userPromptMessage: ChatMessage = { role: 'user', content: `Based on the previous analysis, please apply the suggestions to my resume.` };
                    setInitialMessages([userPromptMessage]);
    
                    sessionStorage.setItem('resumePreviewUri', resumeUri);
                    sessionStorage.setItem('resumeDataUri', resumeUri);
                    sessionStorage.setItem('resumeFileName', name);
                    sessionStorage.setItem('isLivePreview', 'true');
    
                    toast({ title: "Suggestions Applied", description: "The AI has updated your resume with the suggested improvements." });
    
                } catch (error: any) {
                    toast({ title: "Failed to Apply Suggestions", description: error.message, variant: "destructive" });
                    setFileName("");
                    setResumeDataUri(null);
                    setInitialPreviewUri(null);
                } finally {
                    setIsApplyingSuggestions(false);
                }
            }
        };
        
        if (typeof window !== "undefined") {
            // applySuggestions();
        }

        return () => unsubscribe();
    }, [router, toast]);


    const handleResumeUpdate = (newResumeData: ParsedResume) => {
        setResumeData(newResumeData);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('resumeData', JSON.stringify(newResumeData));
        }
        if (!isLivePreview) {
            setIsLivePreview(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('isLivePreview', 'true');
            }
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);
        setResumeData(null);
        setInitialPreviewUri(null);
        setIsLivePreview(false);
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const uploadedResumeDataUri = reader.result as string;
                
                setInitialPreviewUri(uploadedResumeDataUri); 
                setResumeDataUri(uploadedResumeDataUri);
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('resumePreviewUri', uploadedResumeDataUri);
                    sessionStorage.setItem('resumeDataUri', uploadedResumeDataUri);
                    sessionStorage.setItem('resumeFileName', file.name);
                }

                const result = await parseResumeAction({ resumeDataUri: uploadedResumeDataUri });

                if (result.success && result.data) {
                    setResumeData(result.data);
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('resumeData', JSON.stringify(result.data));
                    }
                    toast({ title: "Resume Ready", description: "You can now edit your resume with AI." });
                } else {
                    throw new Error(result.error || "Failed to parse resume.");
                }
            } catch (error: any) {
                toast({ title: "Parsing Failed", description: error.message, variant: "destructive" });
                setFileName("");
                setResumeDataUri(null);
                setInitialPreviewUri(null);
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
          setIsParsing(false);
          setFileName("");
          setResumeDataUri(null);
          setInitialPreviewUri(null);
          toast({ title: "File Read Error", description: "There was an error reading the file.", variant: "destructive" });
        }
    };

    const handleDownload = async () => {
        const sourceElement = livePreviewRef.current;
        if (!sourceElement) {
            toast({ title: "Nothing to download", description: "The resume preview is not available.", variant: "destructive" });
            return;
        }
    
        setIsGeneratingPdf(true);
        try {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4',
            });
    
            await pdf.html(sourceElement, {
                callback: function (doc) {
                    doc.save('resume.pdf');
                },
                autoPaging: 'text',
                width: pdf.internal.pageSize.getWidth(),
            });
        } catch (error) {
            console.error('PDF Download error:', error);
            toast({ title: "Download failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    const handleConvertToPortfolio = async () => {
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
            let analysisInput: AnalyzeResumeInput;

            if (resumeData?.htmlContent) {
                const htmlDataUri = `data:text/html;base64,${btoa(unescape(encodeURIComponent(resumeData.htmlContent)))}`;
                analysisInput = { resumeDataUri: htmlDataUri };
            } else if (resumeDataUri) {
                analysisInput = { resumeDataUri: resumeDataUri };
            } else {
                throw new Error("No resume content available to create a portfolio.");
            }

            const result = await analyzeResumeAction(analysisInput);
    
            if (result.success && result.data) {
                await setDoc(doc(db, "portfolios", user.uid), result.data);
                toast({
                    title: "Portfolio Created!",
                    description: "Redirecting you to your new portfolio page.",
                });
                router.push("/portfolio");
            } else {
                throw new Error(result.error || "Failed to analyze resume. Please check the file format and try again.");
            }
        } catch (error: any) {
            toast({
                title: "Failed to build portfolio",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsConverting(false);
        }
    };
    
    const handleAnalyzeResume = () => {
        if (!resumeData?.htmlContent) {
            toast({
                title: "No Resume Content",
                description: "There is no resume content to analyze. Please upload or create a resume first.",
                variant: "destructive",
            });
            return;
        }
        setIsAnalyzing(true);
        try {
            const encodedHtml = btoa(unescape(encodeURIComponent(resumeData.htmlContent)));
            const dataUri = `data:text/html;base64,${encodedHtml}`;
            
            sessionStorage.setItem('resumeForAnalysisDataUri', dataUri);
            sessionStorage.setItem('resumeForAnalysisFileName', fileName || 'Edited Resume');
            
            router.push('/resume-analyzer');

        } catch (error) {
            console.error("Error preparing resume for analysis:", error);
            toast({
                title: "Error",
                description: "Could not prepare the resume for analysis.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
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
    
    if (isApplyingSuggestions) {
        return (
            <div className="flex flex-col h-screen bg-muted/20">
                <Header />
                <main className="flex-grow flex flex-col items-center justify-center h-full text-center">
                    <CreativeLoader texts={applyingSuggestionsTexts} />
                </main>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const editorActions = (
        <div className="flex items-center justify-end gap-2 flex-grow">
            <Button onClick={handleAnalyzeResume} variant="outline" size="sm" disabled={!resumeData || isGeneratingPdf || isParsing || isAnalyzing || isConverting}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Analyze Resume"}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" disabled={!resumeData || isGeneratingPdf || isParsing || !isLivePreview || isAnalyzing || isConverting}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Download PDF"}
            </Button>
            <Button onClick={handleConvertToPortfolio} size="sm" disabled={!resumeData?.htmlContent && !resumeDataUri || isConverting || isParsing || isAnalyzing}>
                {isConverting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    "Create Portfolio"
                )}
            </Button>
        </div>
    );

    const showEditor = (initialPreviewUri || resumeData) && !isParsing;

    return (
        <div className="flex flex-col h-screen bg-muted/20">
            <Header pageActions={showEditor ? editorActions: undefined} />
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-hidden">
                { !showEditor ? (
                     <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
                        {isParsing ? (
                            <CreativeLoader texts={parsingTexts} />
                        ) : (
                             <>
                                <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">AI Resume Editor</h1>
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
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        <div className="lg:col-span-2 h-full min-h-0">
                           <Card className="h-full flex flex-col overflow-hidden">
                                <CardHeader className="py-2 px-6">
                                    <CardTitle className="text-lg font-normal">{isLivePreview ? 'Live Resume Preview' : 'Resume Preview'}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow p-4 sm:p-6 bg-muted/30 flex justify-center items-start overflow-auto">
                                    {isLivePreview && resumeData ? (
                                        <div
                                            ref={livePreviewRef}
                                            className="bg-white text-black shadow-lg"
                                            style={{
                                                width: '8.27in',
                                                minHeight: '11.69in',
                                                padding: '0.75in',
                                                boxSizing: 'border-box',
                                            }}
                                            dangerouslySetInnerHTML={{ __html: resumeData.htmlContent || '' }}
                                        />
                                    ) : (
                                        initialPreviewUri ? (
                                            <iframe 
                                              src={`${initialPreviewUri}#toolbar=0&navpanes=0`} 
                                              title="Resume Preview"
                                              width="100%" 
                                              height="100%" 
                                              className="border-none"
                                            />
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                <p>Loading preview...</p>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 h-full min-h-0">
                             {resumeData ? (
                                <ResumeChatPanel resume={resumeData} setResume={handleResumeUpdate} disabledRoutes={['/resume-analyzer', '/build']} initialMessages={initialMessages}/>
                             ) : (
                                 <Card className="h-full flex items-center justify-center">
                                     <CreativeLoader texts={parsingTexts} />
                                 </Card>
                             )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

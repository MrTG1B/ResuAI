
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, UploadCloud } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { parseResumeAction } from '@/app/actions';
import { type SavedEditorState } from '@/types/resume';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreativeLoader } from '@/components/creative-loader';
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import htmlToPdfmake from "html-to-pdfmake";


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
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [editorState, setEditorState] = useState<SavedEditorState | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [isApplyingSuggestions, setIsApplyingSuggestions] = useState(false);
    
    const livePreviewRef = useRef<HTMLDivElement>(null);
    
    // Function to save state to Firestore
    const saveStateToFirestore = useCallback(async (stateToSave: SavedEditorState, currentResumeId: string | null) => {
        if (!currentUser || !db) return;
        try {
            let docId = currentResumeId;
            const dataToSave = { ...stateToSave, lastModified: serverTimestamp() };

            if (docId) {
                await setDoc(doc(db, "users", currentUser.uid, "resumes", docId), dataToSave, { merge: true });
            } else {
                const newDocRef = await addDoc(collection(db, "users", currentUser.uid, "resumes"), dataToSave);
                setResumeId(newDocRef.id);
                router.replace(`/resume-builder/editor?id=${newDocRef.id}`, { scroll: false });
            }
        } catch (error) {
            console.error("Failed to save resume state:", error);
            toast({
                title: "Sync Error",
                description: "Could not save changes to the cloud.",
                variant: "destructive",
            });
        }
    }, [currentUser, toast, router]);

    // Handle updates to editor state
    const handleEditorStateUpdate = useCallback((newState: SavedEditorState) => {
        setEditorState(newState);
        saveStateToFirestore(newState, resumeId);
    }, [saveStateToFirestore, resumeId]);

    // Initial load effect
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const idFromUrl = searchParams.get('id');
                setResumeId(idFromUrl);

                if (idFromUrl) {
                    try {
                        const resumeDoc = await getDoc(doc(db, "users", user.uid, "resumes", idFromUrl));
                        if (resumeDoc.exists()) {
                            setEditorState(resumeDoc.data() as SavedEditorState);
                        } else {
                            toast({ title: "Not Found", description: "This resume session does not exist.", variant: "destructive" });
                            router.push('/dashboard');
                        }
                    } catch (error) {
                        console.error("Failed to load state from Firestore:", error);
                    }
                }
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [router, searchParams, toast]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        setIsParsing(true);
    
        const reader = new FileReader();
        reader.readAsDataURL(file);
    
        reader.onload = async () => {
            try {
                const uploadedResumeDataUri = reader.result as string;
    
                const result = await parseResumeAction({ resumeDataUri: uploadedResumeDataUri });
    
                if (result.success && result.data) {
                    const finalState: SavedEditorState = {
                        htmlContent: result.data.htmlContent,
                        chatHistory: [],
                        fileName: file.name,
                        initialPreviewUri: uploadedResumeDataUri,
                    };
                    // Instead of updating, this will now create a new document
                    await saveStateToFirestore(finalState, null);
                } else {
                    throw new Error(result.error || "Failed to parse resume.");
                }
            } catch (error: any) {
                toast({ title: "Parsing Failed", description: error.message, variant: "destructive" });
            } finally {
                setIsParsing(false);
            }
        };
    
        reader.onerror = () => {
            setIsParsing(false);
            toast({ title: "File Read Error", description: "There was an error reading the file.", variant: "destructive" });
        };
    };

    const handleDownload = async () => {
        const sourceElement = livePreviewRef.current;
        if (!sourceElement) {
            toast({ title: "Nothing to download", description: "The resume preview is not available.", variant: "destructive" });
            return;
        }
    
        setIsGeneratingPdf(true);
        try {
            // Correctly assign the virtual file system for fonts
            if (pdfMake.vfs === undefined || Object.keys(pdfMake.vfs).length === 0) {
              pdfMake.vfs = vfsFonts.pdfMake.vfs;
            }

            const html = sourceElement.innerHTML;
            const content = htmlToPdfmake(html);
            const docDefinition = {
                content: content,
                pageSize: 'A4',
                pageMargins: [ 40, 60, 40, 60 ],
            };
            pdfMake.createPdf(docDefinition).download(editorState?.fileName?.replace(/\.[^/.]+$/, "") || 'resume' + '.pdf');

        } catch (error) {
            console.error('PDF Download error:', error);
            toast({ title: "Download failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    const handleConvertToPortfolio = async () => {
      if (!currentUser || !editorState) {
        toast({
          title: "Error",
          description: "Cannot create portfolio. Missing user or resume data.",
          variant: "destructive",
        });
        return;
      }
    
      setIsConverting(true);
    
      try {
        // Use the initial uploaded URI for the highest fidelity analysis
        const analysisInput = { resumeDataUri: editorState.initialPreviewUri || '' };
        if (!analysisInput.resumeDataUri) {
          throw new Error("No resume file has been uploaded to create a portfolio from.");
        }
    
        const result = await analyzeResumeAction(currentUser.uid, analysisInput);
    
        if (result.success && result.data?.id) {
          toast({
            title: "Portfolio Created!",
            description: "Redirecting you to your new portfolio page.",
          });
          router.push(`/portfolio?id=${result.data.id}`);
        } else {
          throw new Error(result.error || "Failed to create portfolio.");
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
        if (!editorState?.htmlContent) {
            toast({
                title: "No Resume Content",
                description: "There is no resume content to analyze. Please upload or create a resume first.",
                variant: "destructive",
            });
            return;
        }
        setIsAnalyzing(true);
        try {
            const encodedHtml = btoa(unescape(encodeURIComponent(editorState.htmlContent)));
            const dataUri = `data:text/html;base64,${encodedHtml}`;
            
            sessionStorage.setItem('resumeForAnalysisDataUri', dataUri);
            sessionStorage.setItem('resumeForAnalysisFileName', editorState.fileName || 'Edited Resume');
            
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

    if (!currentUser) return null;

    const editorActions = (
        <div className="flex items-center justify-end gap-2 flex-grow">
            <Button onClick={handleAnalyzeResume} variant="outline" size="sm" disabled={!editorState?.htmlContent || isGeneratingPdf || isParsing || isAnalyzing || isConverting}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Analyze Resume"}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" disabled={!editorState?.htmlContent || isGeneratingPdf || isParsing || isAnalyzing || isConverting}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Download PDF"}
            </Button>
            <Button onClick={handleConvertToPortfolio} size="sm" disabled={!editorState || isConverting || isParsing || isAnalyzing}>
                {isConverting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    "Create Portfolio"
                )}
            </Button>
        </div>
    );

    const showEditor = (editorState) && !isParsing;

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
                                            {editorState?.fileName && <p className="mt-4 text-sm font-medium text-primary">{editorState.fileName}</p>}
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
                                    <CardTitle className="text-lg font-normal">
                                        {editorState.htmlContent ? `Editing: ${editorState.fileName || 'Untitled'}` : "Original Resume Preview"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow p-4 sm:p-6 bg-muted/30 flex justify-center items-start overflow-auto">
                                    {editorState.htmlContent ? (
                                        <div
                                            ref={livePreviewRef}
                                            className="bg-white text-black shadow-lg"
                                            style={{
                                                width: '8.27in',
                                                minHeight: '11.69in',
                                                padding: '0.75in',
                                                boxSizing: 'border-box',
                                            }}
                                            dangerouslySetInnerHTML={{ __html: editorState.htmlContent || '' }}
                                        />
                                    ) : (
                                        editorState.initialPreviewUri ? (
                                            <iframe 
                                              src={`${editorState.initialPreviewUri}#toolbar=0&navpanes=0`} 
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
                             {editorState ? (
                                <ResumeChatPanel 
                                    editorState={editorState}
                                    setEditorState={handleEditorStateUpdate} 
                                    disabledRoutes={['/resume-analyzer', '/build']} 
                                />
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

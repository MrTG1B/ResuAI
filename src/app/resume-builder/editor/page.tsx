
'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, doc, setDoc, getDoc, addDoc, collection, serverTimestamp, getDocs } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, UploadCloud } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { parseResumeAction, analyzeResumeAction } from '@/app/actions';
import { type SavedEditorState } from '@/types/resume';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreativeLoader } from '@/components/creative-loader';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
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


function ResumeEditorPageContent() {
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
    const MAX_RESUMES = 10;
    
    // Function to save state to Firestore
    const saveStateToFirestore = useCallback(async (stateToSave: SavedEditorState, currentResumeId: string | null) => {
        if (!currentUser || !db) return;
        try {
            let docId = currentResumeId;
            const dataToSave = { ...stateToSave, lastModified: serverTimestamp() };

            if (docId) {
                await setDoc(doc(db, "users", currentUser.uid, "resumes", docId), dataToSave, { merge: true });
            } else {
                 const resumeCollectionRef = collection(db, "users", currentUser.uid, "resumes");
                 const resumeSnapshot = await getDocs(resumeCollectionRef);
                 if (resumeSnapshot.size >= MAX_RESUMES) {
                     toast({
                         title: "Limit Reached",
                         description: `You have reached the limit of ${MAX_RESUMES} free resumes.`,
                         variant: "destructive",
                     });
                     // prevent saving and redirect or show error state
                     setIsParsing(false); // Make sure to stop loading state
                     router.push('/dashboard');
                     return;
                 }
                const newDocRef = await addDoc(resumeCollectionRef, dataToSave);
                docId = newDocRef.id;
                setResumeId(docId);
                // Update URL without a full page reload
                window.history.replaceState(null, '', `/resume-builder/editor?id=${docId}`);
            }
            return docId;
        } catch (error) {
            console.error("Failed to save resume state:", error);
            toast({
                title: "Sync Error",
                description: "Could not save changes to the cloud.",
                variant: "destructive",
            });
        }
        return null;
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
                
                if (idFromUrl) {
                    setResumeId(idFromUrl);
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
                } else {
                    // This is a new session, create an initial state from profile
                    const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
                    const docSnap = await getDoc(profileDocRef);
                    if (docSnap.exists()) {
                        const profile = docSnap.data();
                        const socialLinksHtml = (profile.socials || [])
                            .map((s: { platform: string; url: string; }) => `<span><a href="${s.url}" target="_blank" style="color: #007bff; text-decoration: none;">${s.platform}</a></span>`)
                            .join(' | ');

                        const initialHtml = `
                          <div style="font-family: 'Roboto', sans-serif; color: #333;">
                            <header style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
                              <h1 style="font-size: 2.5em; margin: 0; color: #1a1a1a;">${profile.name || 'Your Name'}</h1>
                              <p style="font-size: 1.2em; margin: 5px 0 0;">${profile.title || 'Your Title'}</p>
                            </header>
                            <section style="margin-bottom: 20px;">
                              <div style="display: flex; justify-content: center; gap: 20px; font-size: 0.9em; color: #555;">
                                ${profile.email ? `<span><a href="mailto:${profile.email}" style="color: #007bff; text-decoration: none;">${profile.email}</a></span>` : ''}
                                ${profile.phone ? `<span>${profile.phone}</span>` : ''}
                                ${profile.website ? `<span><a href="${profile.website}" target="_blank" style="color: #007bff; text-decoration: none;">${profile.website}</a></span>` : ''}
                              </div>
                              <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 0.9em;">
                                ${socialLinksHtml}
                              </div>
                            </section>
                            <section>
                              <h2 style="font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;">Summary</h2>
                              <p>A brief professional summary here.</p>
                            </section>
                          </div>
                        `;
                        const newId = await saveStateToFirestore({
                            htmlContent: initialHtml,
                            chatHistory: [],
                            fileName: `${profile.name || 'User'}'s Resume.html`,
                            initialPreviewUri: '',
                        }, null);
                         if (newId) {
                            setResumeId(newId);
                        }

                    }
                }
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [router, searchParams, toast, saveStateToFirestore]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;
    
        setIsParsing(true);
        
        // Check limit before proceeding
        const resumeCollectionRef = collection(db, "users", currentUser.uid, "resumes");
        const resumeSnapshot = await getDocs(resumeCollectionRef);
        if (resumeSnapshot.size >= MAX_RESUMES) {
            toast({
                title: "Limit Reached",
                description: `You have reached the limit of ${MAX_RESUMES} free resumes. Please manage your existing resumes from the dashboard.`,
                variant: "destructive",
            });
            setIsParsing(false);
            return;
        }

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
                    const newId = await saveStateToFirestore(finalState, null);
                    if (newId) {
                       setEditorState(finalState);
                       setResumeId(newId);
                    }
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
            // Assign the virtual file system for fonts.
            pdfMake.vfs = pdfFonts.vfs;
            
            // Define fonts for pdfmake. Roboto is included in vfs_fonts.
            pdfMake.fonts = {
                Roboto: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                }
            };
            
            // Sanitize HTML: replace all font-family declarations with Roboto
            const sanitizedHtml = sourceElement.innerHTML.replace(/font-family: ([^;]*?);/g, "font-family: Roboto;");
    
            const content = htmlToPdfmake(sanitizedHtml);
    
            const docDefinition = {
                content: content,
                pageSize: 'A4',
                pageMargins: [ 40, 60, 40, 60 ],
                defaultStyle: {
                    font: 'Roboto' // Ensure Roboto is the fallback font.
                }
            };
    
            pdfMake.createPdf(docDefinition).download(editorState?.fileName?.replace(/\.[^/.]+$/, "") || 'resume' + '.pdf');

        } catch (error) {
            console.error('PDF Download error:', error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Download failed", description: `Could not generate PDF. Error: ${errorMessage}`, variant: "destructive" });
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
            <Button onClick={handleConvertToPortfolio} size="sm" disabled={!editorState || isConverting || isParsing || isAnalyzing || !editorState.initialPreviewUri}>
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
                                <p className="mt-2 text-lg text-muted-foreground">Upload a resume to edit with AI, or we'll start one for you from your profile.</p>
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
                                    {editorState.initialPreviewUri && !editorState.htmlContent ? (
                                        <iframe 
                                            src={`${editorState.initialPreviewUri}#toolbar=0&navpanes=0`} 
                                            title="Resume Preview"
                                            width="100%" 
                                            height="100%" 
                                            className="border-none"
                                        />
                                    ) : (
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

export default function ResumeEditorPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Editor...</p>
            </div>
        }>
            <ResumeEditorPageContent />
        </Suspense>
    )
}

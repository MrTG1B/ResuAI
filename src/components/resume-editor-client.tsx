

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, doc, setDoc, getDoc, addDoc, collection, serverTimestamp, getDocs } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, UploadCloud, Download, Search, Briefcase } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { type SavedEditorState } from '@/types/resume';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreativeLoader } from '@/components/creative-loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { cn } from '@/lib/utils';
import { type PersonalInfo } from '@/types/portfolio';
import { parseResumeAction } from "@/ai/flows/parse-resume";
import { editResumeFlow as editResumeAction } from "@/ai/flows/edit-resume";
import { analyzeResumeForPortfolioAction } from "@/ai/flows/resume-analysis";


const parsingTexts = [
    "Reading your document...",
    "Parsing structure and style...",
    "Preparing the editor...",
    "Just a moment...",
];

const generatingPdfTexts = [
    "Connecting to rendering service...",
    "Building your high-fidelity PDF...",
    "Applying professional formatting...",
    "Finalizing document...",
];

const applyingSuggestionsTexts = [
    "Applying AI suggestions...",
    "Reworking your resume content...",
    "Implementing improvements...",
    "This may take a moment...",
];


export default function ResumeEditorClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [editorState, setEditorState] = useState<SavedEditorState | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<Partial<PersonalInfo>>({});

    const [isApplyingSuggestions, setIsApplyingSuggestions] = useState(false);
    const [flow, setFlow] = useState<'upload' | 'scratch' | 'edit' | 'loading' | 'analysis'>('loading');
    
    const livePreviewRef = useRef<HTMLDivElement>(null);
    const MAX_RESUMES = 10;
    
    // Function to save state to Firestore
    const saveStateToFirestore = useCallback(async (stateToSave: SavedEditorState, currentResumeId: string | null) => {
        if (!currentUser || !db) return null;
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
                     router.push('/dashboard');
                     return null;
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

    // Debounced auto-save effect
    useEffect(() => {
        if (!editorState || !resumeId) return; // Don't save if no state or not yet saved once

        const handler = setTimeout(() => {
            saveStateToFirestore(editorState, resumeId);
        }, 1500); // Debounce for 1.5 seconds

        return () => {
            clearTimeout(handler);
        };
    }, [editorState, resumeId, saveStateToFirestore]);

    const applyAtsSuggestions = useCallback(async (resumeDataUri: string, suggestions: string) => {
        setIsApplyingSuggestions(true);
    
        try {
            if (!currentUser) throw new Error("User not authenticated.");
            
            const parseResult = await parseResumeAction({ resumeDataUri });
            if (!parseResult.success || !parseResult.data) {
                throw new Error(parseResult.error || "Failed to parse resume for editing.");
            }
    
            const initialHtmlContent = parseResult.data.htmlContent;
    
            const editPrompt = `Based on the following analysis and suggestions, please apply the necessary changes to my resume. Focus on improving ATS compatibility by adjusting keywords, formatting, and structure as recommended.\n\nANALYSIS:\n${suggestions}`;
            
            const editResult = await editResumeAction({
                htmlContent: initialHtmlContent,
                prompt: editPrompt,
                history: [],
                userProfile: userProfile
            });
    
            if (editResult.success && editResult.data) {
                const finalState: SavedEditorState = {
                    htmlContent: editResult.data.newHtmlContent,
                    chatHistory: [
                        { role: 'user', content: "Apply the ATS suggestions." },
                        { role: 'assistant', content: editResult.data.response }
                    ],
                    fileName: (sessionStorage.getItem('resumeForAnalysisFileName') || "Edited Resume").replace(/\.[^/.]+$/, ""),
                    initialPreviewUri: resumeDataUri,
                };
    
                const newId = await saveStateToFirestore(finalState, null);
                if (newId) {
                    setEditorState(finalState);
                    setResumeId(newId);
                    setFlow('edit');
                }
            } else {
                throw new Error(editResult.error || "Failed to apply suggestions.");
            }
    
        } catch (error: any) {
            toast({ title: "Failed to Apply Suggestions", description: error.message, variant: "destructive" });
            router.push('/resume-analyzer'); // Go back if it fails
        } finally {
            setIsApplyingSuggestions(false);
            // Clean up session storage
            sessionStorage.removeItem('resumeSuggestions');
            sessionStorage.removeItem('resumeForAnalysisDataUri');
            sessionStorage.removeItem('resumeForAnalysisFileName');
        }
    }, [currentUser, saveStateToFirestore, router, toast, userProfile]);

    // Initial load effect
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const idFromUrl = searchParams.get('id');
                const fromFlow = searchParams.get('from');

                 // Fetch user profile data
                const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
                const docSnap = await getDoc(profileDocRef);
                const profileData = docSnap.exists() ? (docSnap.data() as PersonalInfo) : {};
                setUserProfile(profileData);


                if (idFromUrl) {
                    setResumeId(idFromUrl);
                    setFlow('edit');
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
                        router.push('/dashboard');
                    }
                } else if (fromFlow === 'scratch') {
                     setFlow('edit');
                     
                    const socialLinksHtml = (profileData.socials || [])
                        .map((s: { platform: string; url: string; }) => `<span><a href="${s.url}" target="_blank" style="color: #007bff; text-decoration: none;">${s.platform}</a></span>`)
                        .join(' | ');

                    const initialHtml = `
                      <div style="font-family: 'Roboto', sans-serif; color: #333; border: 1px solid #ddd; padding: 20mm;">
                        <header style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
                          <h1 style="font-size: 2.5em; margin: 0; color: #1a1a1a;">${profileData.name || '<!-- YOUR NAME HERE -->'}</h1>
                          <p style="font-size: 1.2em; margin: 5px 0 0;">${profileData.title || '<!-- YOUR TITLE HERE -->'}</p>
                        </header>
                        <section style="margin-bottom: 20px;">
                          <div style="display: flex; justify-content: center; gap: 20px; font-size: 0.9em; color: #555;">
                            <span>${profileData.email || '<!-- email@example.com -->'}</span>
                            <span>${profileData.phone || '<!-- (123) 456-7890 -->'}</span>
                            <span>${profileData.location || '<!-- City, State -->'}</span>
                          </div>
                          <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 0.9em;">
                            ${socialLinksHtml}
                          </div>
                        </section>
                        <section>
                          <h2 style="font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;">Summary</h2>
                          <p>${profileData.summary || '<!-- Add a professional summary here. You can ask the AI to write one for you based on your experience! -->'}</p>
                        </section>
                         <!-- To add more sections like Experience, Education, Skills, Projects, or Certifications, just ask the AI! For example: 'Add my work experience' or 'Create a skills section'. The AI will use your saved profile data. -->
                      </div>
                    `;
                    const newState: SavedEditorState = {
                        htmlContent: initialHtml,
                        chatHistory: [],
                        fileName: `${profileData.name || 'User'}'s Resume`.replace(/\.[^/.]+$/, ""),
                        initialPreviewUri: '',
                    };
                    saveStateToFirestore(newState, null).then(newId => {
                         if (newId) {
                            setEditorState(newState);
                            setResumeId(newId);
                        }
                    });
                } else if (fromFlow === 'analysis') {
                    setFlow('analysis');
                    const suggestions = sessionStorage.getItem('resumeSuggestions');
                    const resumeDataUri = sessionStorage.getItem('resumeForAnalysisDataUri');
                    if (suggestions && resumeDataUri) {
                        applyAtsSuggestions(resumeDataUri, suggestions);
                    } else {
                        toast({ title: "Missing Data", description: "Could not find ATS suggestions to apply.", variant: "destructive" });
                        router.push('/resume-analyzer');
                    }
                }
                else {
                    setFlow('upload');
                }
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [router, searchParams, toast, saveStateToFirestore, applyAtsSuggestions]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;
        
        if (file.type !== 'application/pdf') {
            toast({
              title: "Invalid File Type",
              description: "Please upload a PDF file.",
              variant: "destructive",
            });
            return;
        }
    
        setIsParsing(true);
        
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
                
                // Then, parse the resume for the editor
                const result = await parseResumeAction({ resumeDataUri: uploadedResumeDataUri });
    
                if (result.success && result.data) {
                    const finalState: SavedEditorState = {
                        htmlContent: result.data.htmlContent,
                        chatHistory: [],
                        fileName: file.name.replace(/\.[^/.]+$/, ""),
                        initialPreviewUri: uploadedResumeDataUri,
                    };
                    const newId = await saveStateToFirestore(finalState, null);
                     if (newId) {
                       setEditorState(finalState);
                       setResumeId(newId);
                       setFlow('edit');
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
        if (!editorState?.htmlContent) {
            toast({ title: "Nothing to download", description: "The resume content is not available.", variant: "destructive" });
            return;
        }
    
        setIsGeneratingPdf(true);
    
        try {
            const PDF_SERVICE_URL = 'https://pdf-generator-service-52ry.onrender.com/generate-pdf';
            
            const response = await fetch(PDF_SERVICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: editorState.htmlContent }),
            });
    
            if (!response.ok) {
                let errorDetails = `PDF service responded with status ${response.status}`;
                try {
                    const errorData = await response.text();
                    errorDetails = errorData || errorDetails;
                } catch (e) {
                    // response is not json, ignore
                }
                throw new Error(errorDetails);
            }
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanFileName = (editorState?.fileName || 'resume').replace(/\.[^/.]+$/, "");
            a.download = `${cleanFileName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
    
        } catch (error) {
            console.error('PDF Download error:', error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Download failed", description: `Could not generate PDF. Reason: ${errorMessage}`, variant: "destructive" });
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
        const analysisInput = { resumeDataUri: editorState.initialPreviewUri || '' };
        if (!analysisInput.resumeDataUri) {
            // As a fallback, render the current HTML to a data URI
            const encodedHtml = btoa(unescape(encodeURIComponent(editorState.htmlContent || '')));
            analysisInput.resumeDataUri = `data:text/html;base64,${encodedHtml}`;
        }
        
        const result = await analyzeResumeForPortfolioAction(analysisInput);
    
        if (result.success && result.data) {
          const portfolioData = result.data;
          // You would typically save this to the database and then redirect
          // For now, let's assume the action does that and returns an ID
          // This part needs implementation based on how you save portfolios
           const newPortfolioDoc = await addDoc(collection(db, `users/${currentUser.uid}/portfolios`), {
                ...portfolioData,
                createdAt: serverTimestamp(),
           });

          toast({
            title: "Portfolio Created!",
            description: "Redirecting you to your new portfolio page.",
          });
          router.push(`/portfolio?id=${newPortfolioDoc.id}`);
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

    const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editorState) {
            setEditorState({ ...editorState, fileName: e.target.value.replace(/\.[^/.]+$/, "") });
        }
    };

    if (isLoading || flow === 'loading') {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Editor...</p>
            </div>
        );
    }

    if (isApplyingSuggestions || flow === 'analysis') {
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

    const hasBeenEdited = (editorState?.chatHistory?.length || 0) > 0;
    const showOriginalPdf = editorState?.initialPreviewUri && !hasBeenEdited;
    const canDownload = !!editorState?.htmlContent;

    const editorActions = (
        <div className="flex items-center justify-end gap-2">
            <Button onClick={handleAnalyzeResume} variant="outline" size="sm" disabled={!editorState?.htmlContent || isGeneratingPdf || isParsing || isAnalyzing || isConverting} style={{color: '#45B8AC', borderColor: '#45B8AC'}}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                Analyze Resume
            </Button>
            <Button onClick={handleConvertToPortfolio} size="sm" variant="outline" disabled={!editorState || isConverting || isParsing || isAnalyzing} style={{color: '#45B8AC', borderColor: '#45B8AC'}}>
                {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Briefcase className="mr-2 h-4 w-4"/>}
                Create Portfolio
            </Button>
            <Button onClick={handleDownload} size="sm" disabled={!canDownload || isGeneratingPdf || isParsing || isAnalyzing || isConverting}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
        </div>
    );

    const showEditor = flow === 'edit' && editorState && !isParsing;
    
    return (
        <div className="flex flex-col h-screen bg-muted/20">
            <Header pageActions={showEditor ? editorActions: undefined} />
            <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-hidden h-full">
                { !showEditor ? (
                     <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
                        {isParsing ? (
                            <CreativeLoader texts={parsingTexts} />
                        ) : (
                             <>
                                <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">AI Resume Editor</h1>
                                <p className="mt-2 text-lg text-muted-foreground">Upload a resume to start editing with our AI assistant.</p>
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
                                            <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                                            {editorState?.fileName && <p className="mt-4 text-sm font-medium text-primary">{editorState.fileName}</p>}
                                        </div>
                                        <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" disabled={isParsing} />
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        <div className="lg:col-span-2 h-full min-h-0 flex flex-col">
                           <Card className="h-full flex flex-col overflow-hidden">
                                <CardHeader className="py-3 px-6 border-b flex-shrink-0">
                                    <CardTitle className="text-base font-normal flex items-center">
                                       <span className="mr-2 hidden sm:inline">Editing:</span>
                                       <Input
                                            type="text"
                                            value={editorState.fileName?.replace(/\.[^/.]+$/, "") || ''}
                                            onChange={handleFileNameChange}
                                            className="h-7 w-auto max-w-full sm:max-w-xs text-base font-medium p-1"
                                        />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col p-0 bg-muted/30 overflow-hidden relative">
                                    <div className="flex-grow flex items-center justify-center w-full bg-muted/30 rounded-md overflow-hidden relative">
                                        {isGeneratingPdf ? (
                                            <div className='flex h-full w-full items-center justify-center'>
                                                <CreativeLoader texts={generatingPdfTexts} />
                                            </div>
                                        ) : showOriginalPdf ? (
                                            <div className="flex-grow flex items-center justify-center h-full">
                                                <iframe src={`${editorState.initialPreviewUri}#toolbar=0`} className="w-full h-full border-none" title="Original Resume Preview" />
                                            </div>
                                        ) : (
                                            <ScrollArea className="w-full h-full">
                                                <div className="p-4 flex justify-center items-start">
                                                    <div
                                                        ref={livePreviewRef}
                                                        className={cn("bg-white text-black shadow-lg transition-all duration-300 transform scale-100", isAILoading && "blur-sm")}
                                                        style={{
                                                            width: '210mm',
                                                            minHeight: '297mm',
                                                            boxSizing: 'border-box',
                                                            padding: '12.7mm',
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: editorState.htmlContent || '' }}
                                                    />
                                                </div>
                                            </ScrollArea>
                                        )}
                                        {isAILoading && (
                                             <div className="absolute inset-0 wavy-background animate-wave opacity-20"></div>
                                        )}
                                     </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 h-full min-h-0">
                             {editorState ? (
                                <ResumeChatPanel 
                                    editorState={editorState}
                                    setEditorState={setEditorState}
                                    isLoading={isAILoading}
                                    setIsLoading={setIsAILoading}
                                    userProfile={userProfile}
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

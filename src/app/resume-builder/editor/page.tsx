'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ResumePreview } from '@/components/resume-preview';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { parseResumeAction } from '@/app/actions';
import { type ParsedResume } from '@/types/resume';

export default function ResumeEditorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
    const [fileName, setFileName] = useState("");

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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const resumeDataUri = reader.result as string;
                const result = await parseResumeAction({ resumeDataUri });

                if (result.success && result.data) {
                    setResumeData(result.data);
                    toast({ title: "Resume Uploaded", description: "You can now edit your resume with AI." });
                } else {
                    throw new Error(result.error || "Failed to parse resume.");
                }
            } catch (error: any) {
                toast({ title: "Parsing Failed", description: error.message, variant: "destructive" });
                setFileName("");
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
          setIsParsing(false);
          setFileName("");
          toast({ title: "File Read Error", description: "There was an error reading the file.", variant: "destructive" });
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

    return (
        <div className="flex flex-col h-screen bg-muted/20">
            <Header />
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-hidden">
                {resumeData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        <div className="lg:col-span-2 h-full">
                            <ResumePreview resume={resumeData} />
                        </div>
                        <div className="lg:col-span-1 h-full">
                            <ResumeChatPanel resume={resumeData} setResume={setResumeData} />
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
                                    {isParsing ? (
                                        <>
                                            <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                                            <p className="text-sm text-foreground">Parsing your resume...</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-10 h-10 mb-3 text-primary" />
                                            <p className="mb-2 text-sm text-foreground">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-muted-foreground">PDF or DOCX (MAX. 5MB)</p>
                                        </>
                                    )}
                                    {fileName && !isParsing && <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>}
                                </div>
                                <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx" disabled={isParsing} />
                            </label>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

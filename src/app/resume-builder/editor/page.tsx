'use client';
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, Download } from 'lucide-react';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResumeChatPanel } from '@/components/resume-chat-panel';
import { parseResumeAction } from '@/app/actions';
import { type ParsedResume } from '@/types/resume';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ResumeEditorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    
    const hiddenPreviewRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);

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

    const generatePdfPreview = async (htmlContent: string) => {
        if (!hiddenPreviewRef.current) return;
        setIsGeneratingPdf(true);
        
        hiddenPreviewRef.current.innerHTML = htmlContent;

        try {
            const canvas = await html2canvas(hiddenPreviewRef.current, { 
                scale: 2,
                useCORS: true,
                width: hiddenPreviewRef.current.scrollWidth,
                height: hiddenPreviewRef.current.scrollHeight,
                windowWidth: hiddenPreviewRef.current.scrollWidth,
                windowHeight: hiddenPreviewRef.current.scrollHeight,
            });
            
            const pdf = new jsPDF('p', 'pt', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            
            setPreviewUri(pdf.output('datauristring'));
        } catch(error) {
            toast({ title: "Preview Failed", description: "Could not generate the updated PDF preview.", variant: "destructive" });
        } finally {
            hiddenPreviewRef.current.innerHTML = '';
            setIsGeneratingPdf(false);
        }
    };
    
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (resumeData?.htmlContent) {
            generatePdfPreview(resumeData.htmlContent);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeData]);

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
                setPreviewUri(resumeDataUri); // Show the uploaded file immediately
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
                {resumeData && previewUri ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        <div className="lg:col-span-2 h-full min-h-0">
                           <Card className="h-full flex flex-col overflow-hidden">
                                <CardHeader className="flex-row items-center justify-between">
                                    <CardTitle>Resume Preview</CardTitle>
                                    <Button onClick={handleDownload}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-grow p-4 sm:p-6 bg-muted/30 flex justify-center min-h-0 relative">
                                    {isGeneratingPdf && (
                                        <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                            <p className="mt-2 font-medium text-muted-foreground">Generating updated preview...</p>
                                        </div>
                                    )}
                                    <object data={previewUri} type="application/pdf" width="100%" height="100%" className="z-10">
                                        <div className="flex items-center justify-center h-full">
                                            <p className="p-4 rounded-md bg-yellow-100 text-yellow-800">Your browser does not support embedded PDFs. You can <a href={previewUri} download="resume.pdf" className="underline font-bold">download it here</a> instead.</p>
                                        </div>
                                    </object>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 h-full min-h-0">
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
            {/* Hidden div for html2canvas to render into */}
            <div ref={hiddenPreviewRef} className="absolute -left-[9999px] top-0 bg-white text-black w-[8.27in] min-h-[11.69in] p-[0.75in] font-serif"></div>
        </div>
    );
}

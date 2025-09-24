
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, doc, getDoc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { interviewPrepAction } from '@/app/actions';
import { type ChatMessage } from '@/types/resume';
import { type PersonalInfo } from '@/types/portfolio';
import { cn } from '@/lib/utils';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Bot, UploadCloud, FileText, MessageCircleQuestion, Users, Terminal, Briefcase } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PulsingDotsLoader } from '@/components/pulsing-dots-loader';
import { AssistantAvatar } from '@/components/assistant-avatar';
import { BrandLoader } from '@/components/brand-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InterviewPrepClient() {
    const router = useRouter();
    const { toast } = useToast();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<Partial<PersonalInfo> | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [interviewType, setInterviewType] = useState<'HR' | 'Technical' | ''>('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeFileName, setResumeFileName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
                const docSnap = await getDoc(profileDocRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as PersonalInfo);
                }
            } else {
                router.push('/login');
            }
            setIsPageLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [messages, isResponding]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
          if (selectedFile.type !== 'application/pdf') {
              toast({ title: "Invalid File Type", description: "Please upload a PDF file.", variant: "destructive" });
              return;
          }
          setResumeFile(selectedFile);
          setResumeFileName(selectedFile.name);
      }
    };

    const handleStartInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            toast({ title: 'Not Authenticated', description: 'Please log in to start an interview.', variant: 'destructive' });
            return;
        }
        if (!jobTitle.trim() || !jobDescription.trim() || !interviewType) {
            toast({ title: 'Missing Information', description: 'Please fill out all required fields and select an interview type.', variant: 'destructive' });
            return;
        }
        if (!resumeFile) {
             toast({ title: 'Resume Needed', description: 'Please upload your resume.', variant: 'destructive' });
            return;
        }

        let userCvText = '';

        if(resumeFile){
            try {
                const arrayBuffer = await resumeFile.arrayBuffer();
                // This is a placeholder for actual PDF parsing.
                // For a real implementation, a library like pdf.js would be used here on the client
                // or a parsing service on the server. We will just send an indicator for now.
                userCvText = `(User uploaded a PDF named ${resumeFile.name}. The AI should ask questions based on this file.)`;
                toast({ title: 'Resume Uploaded', description: 'The AI will use your resume for the interview.' });
            } catch (error) {
                toast({ title: 'File Error', description: 'Could not read the uploaded resume.', variant: 'destructive' });
                return;
            }
        }

        setHasStarted(true);
        setIsResponding(true);

        try {
            const result = await interviewPrepAction(currentUser.uid, {
                jobTitle,
                jobDescription,
                interviewType: interviewType as 'HR' | 'Technical',
                userCv: userCvText,
                history: [],
                prompt: "Let's start the interview.",
            });

            if (result.success && result.data) {
                setMessages([{ role: 'assistant', content: result.data.response }]);
            } else {
                throw new Error(result.error || 'Failed to start interview session.');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
            setHasStarted(false);
        } finally {
            setIsResponding(false);
        }
    };

    const handleSendMessage = async () => {
        if (!currentUser || !userProfile || !input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        const currentInput = input;
        setInput('');
        setIsResponding(true);

        try {
            const result = await interviewPrepAction(currentUser.uid, {
                jobTitle,
                jobDescription,
                interviewType: interviewType as 'HR' | 'Technical',
                userCv: JSON.stringify(userProfile),
                history: messages,
                prompt: currentInput,
            });

            if (result.success && result.data) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.data.response }]);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setMessages(messages);
            }
        } catch (error: any) {
            toast({ title: 'Request Failed', description: error.message, variant: 'destructive' });
            setMessages(messages);
        } finally {
            setIsResponding(false);
        }
    };

    if (isPageLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <BrandLoader size="lg" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-4xl mx-auto">
                    {!hasStarted ? (
                        <Card className="shadow-2xl">
                            <CardHeader className="text-center">
                                <div className="flex justify-center items-center mb-4">
                                  <div className="bg-[#45B8AC]/10 p-4 rounded-full">
                                    <MessageCircleQuestion className="h-10 w-10 text-[#45B8AC]" />
                                  </div>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">AI Interview Practice</h1>
                                <CardDescription className="mt-2 text-lg">
                                    Get ready for your next big interview. Provide the job details, and our AI coach will run you through a mock interview.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleStartInterview} className="space-y-8">
                                    
                                    <div className="space-y-2 text-center">
                                        <Label className="text-lg font-semibold">1. Choose Interview Type</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <Card 
                                                className={cn(
                                                    "p-6 text-center cursor-pointer transition-all duration-300 transform",
                                                    "hover:-translate-y-2 hover:shadow-lg",
                                                    interviewType === 'HR' 
                                                        ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-primary/20' 
                                                        : 'hover:bg-muted/50 hover:shadow-primary/20'
                                                )}
                                                onClick={() => setInterviewType('HR')}
                                            >
                                                <Users className="h-10 w-10 mx-auto text-primary mb-2" />
                                                <h3 className="font-semibold text-lg">HR Interview</h3>
                                                <p className="text-sm text-muted-foreground">Focus on behavioral and situational questions.</p>
                                            </Card>
                                            <Card 
                                                className={cn(
                                                    "p-6 text-center cursor-pointer transition-all duration-300 transform",
                                                    "hover:-translate-y-2 hover:shadow-lg",
                                                    interviewType === 'Technical' 
                                                        ? 'border-[#45B8AC] ring-2 ring-[#45B8AC] bg-[#45B8AC]/5 shadow-[#45B8AC]/20' 
                                                        : 'hover:bg-muted/50 hover:shadow-[#45B8AC]/20'
                                                )}
                                                onClick={() => setInterviewType('Technical')}
                                            >
                                                <Terminal className="h-10 w-10 mx-auto text-[#45B8AC] mb-2" />
                                                <h3 className="font-semibold text-lg">Technical Interview</h3>
                                                <p className="text-sm text-muted-foreground">Focus on skills, knowledge, and problem-solving.</p>
                                            </Card>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className='space-y-2'>
                                            <Label htmlFor="job-title" className="text-lg font-semibold flex items-center gap-2 justify-center"><Briefcase className="h-5 w-5" /> 2. Job & Resume Details</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="job-title">Job Title *</Label>
                                            <Input id="job-title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g., Senior Software Engineer" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="resume-upload">Your Resume (CV) *</Label>
                                            <label
                                                htmlFor="resume-upload-input"
                                                className="relative flex items-center justify-center w-full h-12 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors px-3"
                                            >
                                                <UploadCloud className="w-6 h-6 mr-2 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground truncate">
                                                {resumeFileName || "Upload PDF resume (required)"}
                                                </p>
                                                <Input id="resume-upload-input" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" required/>
                                            </label>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor="job-description">Job Description *</Label>
                                            <Textarea id="job-description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." className="h-40 resize-none" required />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full text-lg" size="lg" disabled={isResponding} style={{backgroundColor: '#45B8AC', color: 'white'}}>
                                        {isResponding ? <BrandLoader size="sm" className="mr-2" /> : <Bot className="mr-2 h-5 w-5" />}
                                        Start Mock Interview
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-2xl flex flex-col h-[75vh] md:h-[80vh]">
                            <CardHeader className="border-b">
                                <CardTitle>Interview Prep: <span className="text-primary">{jobTitle}</span></CardTitle>
                                <CardDescription>
                                    {interviewType} interview practice session in progress. Type your answers below.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow p-4 overflow-hidden">
                                <ScrollArea className="h-full pr-4 -mr-4" ref={scrollAreaRef as any}>
                                    <div className="space-y-6 pb-4">
                                        {messages.map((message, index) => (
                                            <div ref={index === messages.length -1 ? lastMessageRef : null} key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {message.role === 'assistant' && <AssistantAvatar />}
                                                <div className={`max-w-xl rounded-lg px-4 py-2.5 break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    <ReactMarkdown className="prose prose-sm prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0" rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isResponding && (
                                            <div ref={lastMessageRef} className="flex items-start gap-4 justify-start">
                                                <AssistantAvatar />
                                                <div className="max-w-xs rounded-lg px-3 py-2 bg-muted flex items-center"><PulsingDotsLoader /></div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                             <div className="p-4 border-t">
                                <div className="relative">
                                    <Textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isResponding) handleSendMessage(); }}}
                                        placeholder="Type your answer here..."
                                        disabled={isResponding}
                                        rows={2}
                                        className="resize-none pr-20"
                                    />
                                    <Button onClick={handleSendMessage} disabled={isResponding || !input.trim()} className="absolute right-2 bottom-2">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                             </div>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

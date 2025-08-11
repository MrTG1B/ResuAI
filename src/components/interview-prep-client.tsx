
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

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PulsingDotsLoader } from '@/components/pulsing-dots-loader';
import { AssistantAvatar } from '@/components/assistant-avatar';

export default function InterviewPrepClient() {
    const router = useRouter();
    const { toast } = useToast();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<Partial<PersonalInfo> | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('div');
            if (scrollElement) {
                scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [messages, isResponding]);

    const handleStartInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !userProfile || !jobTitle.trim() || !jobDescription.trim()) {
            toast({ title: 'Missing Information', description: 'Please fill out both the job title and description.', variant: 'destructive' });
            return;
        }

        setHasStarted(true);
        setIsResponding(true);

        try {
            const result = await interviewPrepAction(currentUser.uid, {
                jobTitle,
                jobDescription,
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
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                                <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">AI Interview Practice</h1>
                                <CardDescription className="mt-2 text-lg">
                                    Get ready for your next big interview. Provide the job details, and our AI coach will run you through a mock interview.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleStartInterview} className="space-y-6">
                                    <div>
                                        <Label htmlFor="job-title" className="text-base">Job Title</Label>
                                        <Input id="job-title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g., Senior Software Engineer" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="job-description" className="text-base">Job Description</Label>
                                        <Textarea id="job-description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." className="h-40 resize-none" required />
                                    </div>
                                    <Button type="submit" className="w-full text-lg" size="lg" disabled={isResponding}>
                                        {isResponding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bot className="mr-2 h-5 w-5" />}
                                        Start Mock Interview
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-2xl flex flex-col h-[75vh]">
                            <CardHeader className="border-b">
                                <CardTitle>Interview Prep: <span className="text-primary">{jobTitle}</span></CardTitle>
                                <CardDescription>Practice session in progress. Type your answers below.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow p-4 overflow-hidden">
                                <ScrollArea className="h-full pr-4 -mr-4" ref={scrollAreaRef as any}>
                                    <div className="space-y-6 pb-4">
                                        {messages.map((message, index) => (
                                            <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {message.role === 'assistant' && <AssistantAvatar />}
                                                <div className={`max-w-xl rounded-lg px-4 py-2.5 break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    <ReactMarkdown className="prose prose-sm prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0" rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isResponding && (
                                            <div className="flex items-start gap-4 justify-start">
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
            <Footer />
        </div>
    );
}

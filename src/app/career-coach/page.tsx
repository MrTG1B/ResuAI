
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PulsingDotsLoader } from '@/components/pulsing-dots-loader';
import { type ChatMessage } from '@/types/resume';
import { aiAssistantChatAction } from '../actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User as UserIcon } from 'lucide-react';


const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    if (names.length === 1 && names[0].length > 1) {
        return `${names[0][0]}${names[0][1]}`.toUpperCase();
    }
    return (name[0] || '').toUpperCase();
  }

export default function AIAssistantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your AI Assistant. How can I help you today? You can ask me for resume advice, to write a LinkedIn post, or help with interview prep." }
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('div');
        if (scrollElement) {
            scrollElement.scrollTo({
                top: scrollElement.scrollHeight,
                behavior: 'smooth',
            });
        }
    }
  }, [messages, isResponding]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const currentInput = input;
    setInput('');
    setIsResponding(true);

    try {
        const result = await aiAssistantChatAction({
            history: messages,
            prompt: currentInput,
        });

        if (result.success && result.data) {
            setMessages(prev => [...prev, { role: 'assistant', content: result.data.response }]);
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
            setMessages(messages); // revert on error
        }
    } catch (error) {
        toast({ title: "Request Failed", description: "Could not communicate with the AI assistant.", variant: "destructive" });
        setMessages(messages); // revert on error
    } finally {
        setIsResponding(false);
    }
  };


  if (isLoading || !currentUser) {
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
        <Card className="w-full max-w-2xl shadow-2xl h-[70vh] flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight font-heading">AI Assistant</CardTitle>
            <CardDescription>Your personal guide for career and professional tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-4">
            <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef as any}>
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {message.role === 'assistant' && (
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                                    <Bot className="h-5 w-5" />
                                </Avatar>
                            )}
                            <div className={`max-w-md rounded-lg px-4 py-2 break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {message.role === 'assistant' ? (
                                    <ReactMarkdown 
                                        className="prose prose-sm prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0"
                                        rehypePlugins={[rehypeRaw]}
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({node, children, href, ...rest}) => {
                                                if (href && href.startsWith('/')) {
                                                    return <Link href={href} {...rest} className="text-primary hover:underline font-semibold">{children}</Link>;
                                                }
                                                return <a href={href} {...rest} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">{children}</a>;
                                            }
                                        }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                            </div>
                            {message.role === 'user' && (
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                                    <AvatarFallback className="text-sm font-semibold">
                                        {getInitials(currentUser.displayName) || <UserIcon className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                     {isResponding && (
                        <div className="flex items-start gap-3 justify-start">
                             <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                                <Bot className="h-5 w-5" />
                            </Avatar>
                            <div className="max-w-xs rounded-lg px-3 py-2 bg-muted flex items-center">
                                <PulsingDotsLoader />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <div className="flex w-full items-start gap-2">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!isResponding) handleSendMessage();
                        }
                    }}
                    placeholder="Ask for interview advice..."
                    disabled={isResponding}
                    rows={1}
                    className="resize-none w-full"
                />
                <Button onClick={handleSendMessage} disabled={isResponding || !input.trim()} className="shrink-0 h-10">
                    {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

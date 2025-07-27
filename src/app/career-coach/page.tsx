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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, User as UserIcon, Paperclip, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PulsingDotsLoader } from '@/components/pulsing-dots-loader';
import { type ChatMessage } from '@/types/resume';
import { aiAssistantChatAction } from '../actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MentraIcon } from '@/components/mentra-icon';
import { Badge } from '@/components/ui/badge';

interface Attachment {
    name: string;
    dataUri: string;
}

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
    { role: 'assistant', content: "Hello! I'm Mentra, your AI career mentor. How can I help you today? You can ask me for resume advice, to write a LinkedIn post, or help with interview prep." }
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  
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
    if ((!input.trim() && attachments.length === 0)) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const currentInput = input;
    const currentAttachments = attachments;

    setInput('');
    setAttachments([]);
    setIsResponding(true);

    try {
        const result = await aiAssistantChatAction({
            history: messages,
            prompt: currentInput,
            attachments: currentAttachments.map(a => ({ dataUri: a.dataUri, mimeType: a.dataUri.substring(a.dataUri.indexOf(':') + 1, a.dataUri.indexOf(';')) })),
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const filePromises = Array.from(files).map(file => {
            return new Promise<Attachment>((resolve, reject) => {
                 if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    reject(new Error(`${file.name} is too large. Max size is 5MB.`));
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({ name: file.name, dataUri: reader.result as string });
                };
                reader.onerror = () => {
                    reject(new Error(`Could not read file: ${file.name}`));
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises)
            .then(newlyReadAttachments => {
                setAttachments(prev => [...prev, ...newlyReadAttachments]);
                toast({
                    title: 'Files Attached',
                    description: `${files.length} file(s) are ready to be sent with your next message.`,
                });
            })
            .catch(error => {
                toast({ title: 'File Attach Error', description: error.message, variant: 'destructive' });
            });
    }
    if (e.target) {
        e.target.value = '';
    }
  };


    const handleAttachmentClick = () => {
        attachmentInputRef.current?.click();
    };

    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    }


  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 md:p-8 overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col justify-between">
            <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef as any}>
                <div className="space-y-6 pb-8">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {message.role === 'assistant' && (
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center p-1">
                                    <MentraIcon className="h-full w-full" />
                                </Avatar>
                            )}
                            <div className={`max-w-xl rounded-lg px-4 py-2.5 break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                        <div className="flex items-start gap-4 justify-start">
                             <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center p-1">
                                <MentraIcon className="h-full w-full" />
                            </Avatar>
                            <div className="max-w-xs rounded-lg px-3 py-2 bg-muted flex items-center">
                                <PulsingDotsLoader />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
             <div className="w-full pt-4">
                 <div className="relative rounded-lg border bg-card p-2 shadow-lg">
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 border-b mb-2">
                            {attachments.map((attachment, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1.5">
                                    <span className="truncate max-w-[150px]">{attachment.name}</span>
                                    <button onClick={() => handleRemoveAttachment(index)} className="rounded-full hover:bg-muted-foreground/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex w-full items-start gap-2">
                        <input
                            id="attachment-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            ref={attachmentInputRef}
                            disabled={isResponding}
                            multiple
                        />
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={handleAttachmentClick} aria-label="Attach file" disabled={isResponding}>
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isResponding) handleSendMessage();
                                }
                            }}
                            placeholder="Ask Mentra anything..."
                            disabled={isResponding}
                            rows={1}
                            className="resize-none w-full border-0 shadow-none focus-visible:ring-0 p-2"
                        />
                        <Button onClick={handleSendMessage} disabled={isResponding || (!input.trim() && attachments.length === 0)} className="shrink-0 h-10">
                            {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

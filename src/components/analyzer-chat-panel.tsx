
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from './ui/textarea';
import { Button } from "./ui/button";
import { Send, Paperclip, X } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { type ChatMessage } from '@/types/resume';
import { coachChatAction } from '@/app/actions';
import { PulsingDotsLoader } from './pulsing-dots-loader';
import { Badge } from './ui/badge';

interface AnalyzerChatPanelProps {
    initialAnalysis: string;
    resumeDataUri: string;
    jobDescription: string;
}

export function AnalyzerChatPanel({ initialAnalysis, resumeDataUri, jobDescription }: AnalyzerChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "This is your initial analysis. Feel free to ask me any follow-up questions or for more details!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachments, setAttachments] = useState<{ name: string; dataUri: string }[]>([]);
    const { toast } = useToast();
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if ((!input.trim() && attachments.length === 0)) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages: ChatMessage[] = [...messages, userMessage];
        setMessages(newMessages);

        const currentInput = input;
        const currentAttachments = attachments;

        setInput('');
        setAttachments([]);
        setIsLoading(true);
        
        try {
            const result = await coachChatAction({
                initialAnalysis,
                resumeDataUri,
                jobDescription,
                prompt: currentInput,
                attachmentDataUris: currentAttachments.map(a => a.dataUri)
            });
            
            if (result.success && result.data) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.data.response }]);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                // Keep the user message visible even on error
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${result.error || "An error occurred"}` }]);
            }
        } catch (error: any) {
            toast({ title: "Request Failed", description: "Could not communicate with the AI. Please try again.", variant: "destructive" });
            // Keep the user message visible even on error
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Could not communicate with the AI. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const filePromises = Array.from(files).map(file => {
                return new Promise<{ name: string; dataUri: string }>((resolve, reject) => {
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

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="py-2 px-6 border-b">
                <CardTitle className="text-base font-medium">AI Coach Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-4">
                <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef as any}>
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs rounded-lg px-3 py-2 break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="max-w-xs rounded-lg px-3 py-2 bg-muted flex items-center">
                                    <PulsingDotsLoader />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-2 border-t flex flex-col items-start gap-2">
                {attachments.length > 0 && (
                    <div className="w-full flex flex-wrap gap-1 p-1">
                        {attachments.map((attachment, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1.5">
                                <span>{attachment.name}</span>
                                <button onClick={() => handleRemoveAttachment(index)} className="rounded-full hover:bg-muted-foreground/20">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                <div className="flex w-full items-start gap-2">
                    <input
                        id="cert-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        ref={attachmentInputRef}
                        disabled={isLoading}
                        multiple
                    />
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={handleAttachmentClick} aria-label="Attach file" disabled={isLoading}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!isLoading) handleSendMessage();
                            }
                        }}
                        placeholder="Ask a follow-up question..."
                        disabled={isLoading}
                        rows={1}
                        className="resize-none w-full pr-10"
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && attachments.length === 0)} className="shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

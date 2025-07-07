'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from './ui/textarea';
import { Button } from "./ui/button";
import { Send, Paperclip, X } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { type ParsedResume, type ChatMessage } from '@/types/resume';
import { editResumeAction } from '@/app/actions';
import { PulsingDotsLoader } from './pulsing-dots-loader';
import { Badge } from './ui/badge';

interface ResumeChatPanelProps {
    resume: ParsedResume;
    setResume: (resume: ParsedResume) => void;
}

export function ResumeChatPanel({ resume, setResume }: ResumeChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello! I'm here to help you improve your resume. What changes would you like to make? You can also attach documents like certificates for context." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachmentDataUri, setAttachmentDataUri] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
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
        if ((!input.trim() && !attachmentDataUri) || !resume.htmlContent) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages: ChatMessage[] = [...messages, userMessage];
        setMessages(newMessages);

        const currentInput = input;
        const currentAttachment = attachmentDataUri;

        setInput('');
        setAttachmentDataUri(null);
        setAttachmentName(null);
        setIsLoading(true);
        
        try {
            const result = await editResumeAction({
                htmlContent: resume.htmlContent,
                prompt: currentInput,
                attachmentDataUri: currentAttachment || undefined
            });
            
            if (result.success && result.data) {
                setResume({ htmlContent: result.data.newHtmlContent });
                setMessages(prev => [...prev, { role: 'assistant', content: result.data.response }]);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setMessages(messages); // revert on error
            }
        } catch (error: any) {
            toast({ title: "Request Failed", description: "Could not communicate with the AI. Please try again.", variant: "destructive" });
            setMessages(messages); // revert on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setAttachmentDataUri(reader.result as string);
                setAttachmentName(file.name);
                toast({ title: 'File Attached', description: `${file.name} is ready to be sent with your next message.`});
            };
            reader.onerror = () => {
                toast({ title: 'File Read Error', description: 'Could not read the attached file.', variant: 'destructive' });
            }
            reader.readAsDataURL(file);
        }
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleAttachmentClick = () => {
        attachmentInputRef.current?.click();
    };

    const handleRemoveAttachment = () => {
        setAttachmentDataUri(null);
        setAttachmentName(null);
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="py-2 px-6 border-b">
                <CardTitle className="text-base font-medium">AI Assistant</CardTitle>
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
            <CardFooter className="p-2 border-t">
                <div className="flex w-full items-start gap-2">
                    <input
                        id="cert-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        ref={attachmentInputRef}
                        disabled={isLoading}
                    />
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={handleAttachmentClick} aria-label="Attach file" disabled={isLoading}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="w-full relative">
                        {attachmentName && (
                            <div className="absolute -top-7 left-0 w-full">
                                <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                    <span>{attachmentName}</span>
                                    <button onClick={handleRemoveAttachment} className="rounded-full hover:bg-muted-foreground/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            </div>
                        )}
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isLoading) handleSendMessage();
                                }
                            }}
                            placeholder="e.g., 'Make my summary more professional'"
                            disabled={isLoading}
                            rows={1}
                            className="resize-none pr-10"
                        />
                    </div>
                    <Button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !attachmentDataUri)} className="shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

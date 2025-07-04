
'use client'

import { useState, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Paperclip } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { type ParsedResume, type ChatMessage } from '@/types/resume';
import { editResumeAction } from '@/app/actions';
import { PulsingDotsLoader } from './pulsing-dots-loader';

interface ResumeChatPanelProps {
    resume: ParsedResume;
    setResume: (resume: ParsedResume) => void;
}

export function ResumeChatPanel({ resume, setResume }: ResumeChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello! I'm here to help you improve your resume. What changes would you like to make?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    const handleSendMessage = async () => {
        if (!input.trim() || !resume.htmlContent) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages: ChatMessage[] = [...messages, userMessage];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        
        try {
            const result = await editResumeAction({ htmlContent: resume.htmlContent, prompt: currentInput });
            
            if (result.success && result.data) {
                setResume({ htmlContent: result.data.newHtmlContent });
                setMessages(prev => [...prev, { role: 'assistant', content: result.data.response }]);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setMessages(messages);
            }
        } catch (error: any) {
            toast({ title: "Request Failed", description: "Could not communicate with the AI. Please try again.", variant: "destructive" });
            setMessages(messages);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast({ title: 'File Uploaded', description: `${file.name} has been uploaded. I will analyze it shortly.`});
        }
    };

    const handleAttachmentClick = () => {
        attachmentInputRef.current?.click();
    };


    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="py-2 px-6">
                <CardTitle className="text-lg font-medium">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm">{message.content}</p>
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
            <CardFooter>
                <div className="flex w-full items-center gap-2">
                    <Input
                        id="cert-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        ref={attachmentInputRef}
                    />
                    <Button variant="ghost" size="icon" onClick={handleAttachmentClick} aria-label="Attach file" disabled={isLoading}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder="e.g., 'Make my summary more professional'"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

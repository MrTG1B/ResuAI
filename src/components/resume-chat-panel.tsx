'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Loader2, UploadCloud } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { type ParsedResume, type ChatMessage } from '@/types/resume';
import { editResumeAction } from '@/app/actions';

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
                // If it fails, remove the user's last message to let them try again.
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
            // TODO: Handle certificate/document upload
            toast({ title: 'File Uploaded', description: `${file.name} has been uploaded. I will analyze it shortly.`});
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>Chat with the AI to edit your resume.</CardDescription>
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
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-4">
                    <label htmlFor="cert-upload" className="w-full flex items-center justify-center border-2 border-dashed rounded-md p-3 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50">
                        <UploadCloud className="h-5 w-5 mr-2" />
                        Upload Certificates or other files
                    </label>
                    <Input id="cert-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </div>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-center gap-2">
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

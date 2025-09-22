

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, db, collection, query, orderBy, getDocs, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Paperclip, X, Plus, Trash2, Edit, Check, MoreVertical, Search, Bot, LayoutDashboard, User as UserIcon, MessageSquare, Info, FileText, LogOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PulsingDotsLoader } from './pulsing-dots-loader';
import { type ChatMessage } from '@/types/resume';
import { type ChatSession } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { aiAssistantChatAction } from '@/app/actions';
import { AssistantAvatar } from './assistant-avatar';
import { Input } from '@/components/ui/input';


interface Attachment {
    name: string;
    dataUri: string;
}

const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    if (names.length === 1 && names[0].length > 1) return `${names[0][0]}${names[0][1]}`.toUpperCase();
    return (name[0] || '').toUpperCase();
}

function MentraChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm Mentra, your AI career mentor. How can I help you today? You can ask me for resume advice, to write a LinkedIn post, or help with interview prep." }
  ]);
  
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchChatHistory = useCallback(async (userId: string) => {
    if (!db) return;
    setIsHistoryLoading(true);
    const q = query(collection(db, 'users', userId, 'chats'), orderBy('lastModified', 'desc'));
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
    setChatHistory(history);
    setIsHistoryLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchChatHistory(user.uid);
      } else {
        router.push('/login');
      }
      setIsPageLoading(false);
    });
    return () => unsubscribe();
  }, [router, fetchChatHistory]);

  useEffect(() => {
    const id = searchParams.get('id');
    setChatId(id);

    if (id && currentUser) {
        const fetchChat = async () => {
            if (!db) return;
            setIsResponding(true);
            const chatDoc = await getDoc(doc(db, 'users', currentUser.uid, 'chats', id));
            if (chatDoc.exists()) {
                setMessages(chatDoc.data().messages);
            } else {
                toast({title: "Chat not found", variant: "destructive"});
                router.push('/mentra');
            }
            setIsResponding(false);
        };
        fetchChat();
    } else {
        setMessages([{ role: 'assistant', content: "Hello! I'm Mentra, your AI career mentor. How can I help you today? You can ask me for resume advice, to write a LinkedIn post, or help with interview prep." }]);
    }
  }, [searchParams, currentUser, router, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('div');
        if (scrollElement) {
            scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages, isResponding]);
  
  const handleSendMessage = async () => {
    if (!currentUser || (!input.trim() && attachments.length === 0)) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const currentMessageHistory = [...messages, userMessage];
    setMessages(currentMessageHistory);

    const currentInput = input;
    const currentAttachments = attachments;
    const currentChatId = chatId;

    setInput('');
    setAttachments([]);
    setIsResponding(true);

    try {
        const result = await aiAssistantChatAction({
            history: messages,
            prompt: currentInput,
            attachments: currentAttachments.map(a => ({
                dataUri: a.dataUri,
                mimeType: a.dataUri.substring(a.dataUri.indexOf(':') + 1, a.dataUri.indexOf(';'))
            })),
        });

        if (!result.success || !result.data) {
            throw new Error(result.error || 'The AI assistant is currently unavailable.');
        }
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: result.data.response };
        const finalMessages = [...currentMessageHistory, assistantMessage];
        setMessages(finalMessages);

        let docId = currentChatId;
        const chatsCollectionRef = collection(db, 'users', currentUser.uid, 'chats');

        if (docId) {
            const chatDocRef = doc(chatsCollectionRef, docId);
            await setDoc(chatDocRef, {
                messages: finalMessages,
                lastModified: serverTimestamp(),
            }, { merge: true });
        } else {
            const title = finalMessages[1]?.content.substring(0, 40) + '...' || "New Chat";
            const newChatDocRef = doc(chatsCollectionRef);
            await setDoc(newChatDocRef, {
                messages: finalMessages,
                title: title,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            docId = newChatDocRef.id;
            router.push(`/mentra?id=${docId}`);
        }
        
        await fetchChatHistory(currentUser.uid);

    } catch (error: any) {
        toast({ title: "Request Failed", description: error.message, variant: "destructive" });
        setMessages(messages); // Revert on error
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
                reader.onload = () => resolve({ name: file.name, dataUri: reader.result as string });
                reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`));
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises)
            .then(newlyReadAttachments => {
                setAttachments(prev => [...prev, ...newlyReadAttachments]);
            })
            .catch(error => toast({ title: 'File Attach Error', description: error.message, variant: 'destructive' }));
    }
    if (e.target) e.target.value = '';
  };

  const handleNewChat = () => router.push('/mentra');

  const handleRenameChat = async () => {
    if (!currentUser || !editingChatId || !editingTitle.trim() || !db) return;
    await updateDoc(doc(db, 'users', currentUser.uid, 'chats', editingChatId), { title: editingTitle });
    fetchChatHistory(currentUser.uid);
    setEditingChatId(null);
  };

  const handleDeleteChat = async () => {
    if (!currentUser || !deletingChatId || !db) return;
    await deleteDoc(doc(db, 'users', currentUser.uid, 'chats', deletingChatId));
    if(chatId === deletingChatId) router.push('/mentra');
    fetchChatHistory(currentUser.uid);
    setDeletingChatId(null);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
  };
  
  if (isPageLoading || !currentUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
        <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <CommandInput placeholder="Type to search chats..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Chats">
                {chatHistory.map((chat) => (
                    <CommandItem
                        key={chat.id}
                        onSelect={() => {
                            router.push(`/mentra?id=${chat.id}`);
                            setIsSearchOpen(false);
                        }}
                    >
                        <span>{chat.title}</span>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>

      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="p-2 flex flex-row items-center justify-between">
             <div className="relative group/logo-area flex items-center justify-center h-8 group-data-[collapsible=icon]:w-8">
                <Link href="/dashboard" className="group-data-[collapsible=icon]:opacity-0 transition-opacity">
                    <Image src="/logo.png" alt="ResuAI Logo" width={70} height={18} style={{ height: 'auto' }} />
                </Link>
                <Link href="/dashboard" className="absolute inset-0 opacity-0 group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:group-hover/logo-area:opacity-0 transition-opacity flex items-center justify-center">
                    <Image src="/logo.png" alt="ResuAI Logo" width={24} height={24} style={{ height: 'auto' }} />
                </Link>
                <div className="absolute inset-0 opacity-0 group-data-[collapsible=icon]:group-hover/logo-area:opacity-100 transition-opacity">
                    <SidebarTrigger className="h-8 w-8" />
                </div>
            </div>
            <SidebarTrigger className="h-8 w-8 group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <SidebarContent>
            <div className="p-2 space-y-1">
                 <Button onClick={handleNewChat} variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center h-9 px-3 group-data-[collapsible=icon]:p-2 text-sm font-semibold text-white bg-[#3aa195] hover:bg-[#3aa195]/90 transition-all duration-300 transform hover:scale-105">
                    <Plus className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden ml-2">New Chat</span>
                </Button>
                <Button onClick={() => setIsSearchOpen(true)} variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
                    <Search className="h-4 w-4" />
                     <span className="group-data-[collapsible=icon]:hidden ml-2">Search chats</span>
                </Button>
            </div>
            <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden mt-4">
                Chats
            </div>
            <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {isHistoryLoading ? (
                    Array.from({length: 5}).map((_, i) => <SidebarMenuItem key={i}><div className="h-8 w-full bg-muted rounded animate-pulse"/></SidebarMenuItem>)
                ) : (
                    chatHistory.map(chat => (
                        <SidebarMenuItem key={chat.id} className="group/item relative">
                            {editingChatId === chat.id ? (
                                <div className="flex items-center gap-2 p-2">
                                    <Input value={editingTitle} onChange={e => setEditingTitle(e.target.value)} className="h-8"/>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleRenameChat}><Check className="h-4 w-4"/></Button>
                                </div>
                            ) : (
                                <>
                                    <Link href={`/mentra?id=${chat.id}`} className="flex-1 overflow-hidden">
                                        <SidebarMenuButton isActive={chatId === chat.id} className="w-full justify-start text-left truncate transition-colors duration-200 hover:bg-muted/50" style={chatId === chat.id ? { backgroundColor: '#3aa195' } : {}}>
                                            {chat.title}
                                        </SidebarMenuButton>
                                    </Link>
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => {setEditingChatId(chat.id); setEditingTitle(chat.title);}}>
                                                    <Edit className="mr-2 h-4 w-4"/> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeletingChatId(chat.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </>
                            )}
                        </SidebarMenuItem>
                    ))
                )}
            </SidebarMenu>
        </SidebarContent>

        <AlertDialog open={!!deletingChatId} onOpenChange={(open) => !open && setDeletingChatId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete this chat. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </Sidebar>
      
      <SidebarInset>
        <div className="flex flex-col flex-1 overflow-hidden h-full">
            <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-semibold text-lg flex items-center gap-2"><Bot className="text-primary"/> Mentra</span>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                                <Avatar className="h-9 w-9 border-2 border-primary/50">
                                    <AvatarImage unoptimized key={currentUser.photoURL} src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
                                    <AvatarFallback className="text-sm font-semibold">
                                        {getInitials(currentUser.displayName)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/feedback')} className="cursor-pointer">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>Feedback</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/about')} className="cursor-pointer">
                                <Info className="mr-2 h-4 w-4" />
                                <span>About Us</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/terms')} className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Terms &amp; Conditions</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            
            <div className="flex flex-col flex-1 justify-between overflow-hidden">
                <ScrollArea className="flex-1 p-4 sm:p-6 md:p-8" ref={scrollAreaRef as any}>
                    <div className="space-y-6 pb-8">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.role === 'assistant' && ( <AssistantAvatar /> )}
                                <div className={`max-w-xl rounded-lg px-4 py-2.5 break-words ${message.role === 'user' ? 'bg-[#3aa195] text-white font-semibold' : 'bg-muted/70'}`}>
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

                <div className="w-full px-4 sm:px-6 md:px-8 pb-4">
                    <div className="max-w-2xl mx-auto space-y-2">
                        <div className="space-y-2">
                             {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 border-b mb-2">
                                    {attachments.map((attachment, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1.5">
                                            <span className="truncate max-w-[150px]">{attachment.name}</span>
                                            <button onClick={() => setAttachments(p => p.filter((_, i) => i !== index))} className="rounded-full hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                             <div className="relative flex w-full items-center rounded-xl border bg-card px-2 py-1 shadow-lg">
                                <input id="attachment-upload" type="file" className="hidden" onChange={handleFileUpload} ref={attachmentInputRef} disabled={isResponding} multiple />
                                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => attachmentInputRef.current?.click()} aria-label="Attach file" disabled={isResponding} style={{color: '#45B8AC'}}><Paperclip className="h-5 w-5" /></Button>
                                <Textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={input}
                                    onInput={handleTextareaInput}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); if (!isResponding) handleSendMessage();}}}
                                    placeholder="Ask Mentra anything..."
                                    disabled={isResponding}
                                    className="flex-1 w-full border-0 shadow-none focus-visible:ring-0 text-card-foreground bg-transparent resize-none py-2"
                                    style={{minHeight: '30px', maxHeight: '120px'}}
                                />
                                <Button onClick={handleSendMessage} disabled={isResponding || (!input.trim() && attachments.length === 0)} className="shrink-0 h-8 w-8 p-0 rounded-full">
                                    {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Mentra is an AI and can make mistakes. Please check important information.</p>
                    </div>
                </div>
            </div>
        </div>
      </SidebarInset>
    </div>
    )
}


export default function MentraChatClient() {
    return (
        <SidebarProvider>
            <MentraChatPage />
        </SidebarProvider>
    )
}
    
    

    




    

    

    

    

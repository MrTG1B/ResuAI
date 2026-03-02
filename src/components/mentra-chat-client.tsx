

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
import { Send, Paperclip, X, Plus, Trash2, Edit, Check, MoreVertical, Search, LayoutDashboard, User as UserIcon, MessageSquare, Info, FileText, LogOut, Sparkles, FileSearch, Linkedin, BriefcaseBusiness, PenLine } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PulsingDotsLoader } from './pulsing-dots-loader';
import { type ChatMessage } from '@/types/resume';
import { type ChatSession } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
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
import { aiAssistantChatAction, generateChatTitleAction } from '@/app/actions';
import { AssistantAvatar } from './assistant-avatar';
import { Input } from '@/components/ui/input';
import { BrandLoader } from './brand-loader';
import { MentraIcon } from './mentra-icon';
import { cn } from '@/lib/utils';

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

const SUGGESTION_CHIPS = [
    { icon: FileSearch, label: "Review my resume", prompt: "Can you review my resume and give me detailed feedback on how to improve it?" },
    { icon: Linkedin, label: "Write a LinkedIn post", prompt: "Help me write a compelling LinkedIn post about my professional achievements and expertise." },
    { icon: BriefcaseBusiness, label: "Interview coaching", prompt: "I have a job interview coming up. Can you help me prepare with mock interview questions and coaching?" },
    { icon: PenLine, label: "Draft a cover letter", prompt: "Help me write a strong cover letter for a job application." },
];

function WelcomeScreen({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-12 animate-fade-in-up">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center bg-[#3aa195]/20 border border-[#3aa195]/30 shadow-lg shadow-[#3aa195]/10">
                        <MentraIcon className="h-12 w-12 text-[#3aa195]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#3aa195] flex items-center justify-center shadow-md">
                        <Sparkles className="h-3 w-3 text-white" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        How can{' '}
                        <span className="text-[#3aa195]">Mentra</span>{' '}
                        help you today?
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Your AI career mentor — ready to help with resumes, job search, interviews, and more.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTION_CHIPS.map(({ icon: Icon, label, prompt }) => (
                    <button
                        key={label}
                        onClick={() => onSuggestion(prompt)}
                        className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 text-left text-sm transition-all duration-200 hover:border-[#3aa195]/50 hover:bg-[#3aa195]/5 hover:shadow-md hover:shadow-[#3aa195]/5 backdrop-blur-sm"
                    >
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-[#3aa195]/10 flex items-center justify-center transition-colors group-hover:bg-[#3aa195]/20">
                            <Icon className="h-4 w-4 text-[#3aa195]" />
                        </div>
                        <span className="font-medium text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ChatBubble({ message, isLast, lastRef }: { message: ChatMessage; isLast: boolean; lastRef: React.RefObject<HTMLDivElement> }) {
    const isUser = message.role === 'user';
    return (
        <div
            ref={isLast ? lastRef : null}
            className={cn(
                'flex items-end gap-3 animate-fade-in-up',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            {!isUser && <AssistantAvatar />}
            <div
                className={cn(
                    'max-w-[min(75%,600px)] rounded-2xl px-4 py-3 break-words text-sm leading-relaxed shadow-sm',
                    isUser
                        ? 'rounded-br-sm bg-[#3aa195] text-white'
                        : 'rounded-bl-sm bg-card border border-border/50 text-card-foreground'
                )}
            >
                <ReactMarkdown
                    className={cn(
                        'prose prose-sm max-w-none',
                        'prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5',
                        'prose-headings:font-semibold prose-headings:my-2',
                        'prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs',
                        'prose-pre:rounded-xl prose-pre:text-xs',
                        isUser
                            ? 'prose-invert prose-code:bg-white/20 prose-pre:bg-white/10'
                            : 'prose-invert prose-code:bg-muted prose-pre:bg-muted'
                    )}
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
            {isUser && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                </div>
            )}
        </div>
    );
}

function MentraChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

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
    if (!auth) return;
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
        setMessages([]);
    }
  }, [searchParams, currentUser, router, toast]);

  useEffect(() => {
    if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, isResponding]);

  const handleSendMessage = async (overrideInput?: string) => {
    const messageText = overrideInput ?? input;
    if (!currentUser || (!messageText.trim() && attachments.length === 0) || !db) return;
    const dbInstance = db;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const currentMessageHistory = [...messages, userMessage];
    setMessages(currentMessageHistory);

    const currentAttachments = attachments;
    const currentChatId = chatId;

    setInput('');
    setAttachments([]);
    setIsResponding(true);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
        const result = await aiAssistantChatAction({
            history: messages,
            prompt: messageText,
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
        const chatsCollectionRef = collection(dbInstance, 'users', currentUser.uid, 'chats');

        if (docId) {
            const chatDocRef = doc(chatsCollectionRef, docId);
            await setDoc(chatDocRef, {
                messages: finalMessages,
                lastModified: serverTimestamp(),
            }, { merge: true });
        } else {
            const titleResult = await generateChatTitleAction({ messages: finalMessages.slice(0, 2) });
            const title = titleResult.success ? titleResult.data?.title : "New Chat";
            
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
        setMessages(messages);
    } finally {
        setIsResponding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const filePromises = Array.from(files).map(file => {
            return new Promise<Attachment>((resolve, reject) => {
                 if (file.size > 5 * 1024 * 1024) {
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
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const filteredChatHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isNewChat = messages.length === 0 && !isResponding;
  
  if (isPageLoading || !currentUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <BrandLoader size="lg" />
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="p-2 flex flex-row items-center justify-between border-b border-sidebar-border/50">
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
        <SidebarContent className='px-2 pt-2'>
            <div className="p-2 space-y-2">
                <Button
                    onClick={handleNewChat}
                    variant="ghost"
                    className="w-full justify-start group-data-[collapsible=icon]:justify-center h-9 px-3 group-data-[collapsible=icon]:p-2 text-sm font-semibold text-white bg-[#3aa195] hover:bg-[#3aa195]/90 transition-all duration-200 shadow-sm shadow-[#3aa195]/20"
                >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden ml-2">New Chat</span>
                </Button>
                <div className="relative group-data-[collapsible=icon]:hidden">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search chats..."
                        className="pl-8 h-8 text-sm bg-muted/50 border-transparent focus-visible:border-border"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest group-data-[collapsible=icon]:hidden">
                Recent
            </div>
            <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {isHistoryLoading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <SidebarMenuItem key={i}>
                            <div className="h-8 mx-1 bg-muted/50 rounded-lg animate-pulse"/>
                        </SidebarMenuItem>
                    ))
                ) : filteredChatHistory.length > 0 ? (
                    filteredChatHistory.map(chat => (
                        <SidebarMenuItem key={chat.id} className="group/item relative">
                            {editingChatId === chat.id ? (
                                <div className="flex items-center gap-1.5 px-1 py-1">
                                    <Input
                                        value={editingTitle}
                                        onChange={e => setEditingTitle(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleRenameChat();
                                            else if (e.key === 'Escape') setEditingChatId(null);
                                        }}
                                        className="h-7 text-sm"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-[#3aa195]" onClick={handleRenameChat}>
                                        <Check className="h-3.5 w-3.5"/>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Link href={`/mentra?id=${chat.id}`} className="flex-1 overflow-hidden">
                                        <SidebarMenuButton
                                            isActive={chatId === chat.id}
                                            className={cn(
                                                "w-full justify-start text-left truncate text-sm transition-all duration-150",
                                                chatId === chat.id
                                                    ? "bg-[#3aa195]/15 text-[#3aa195] font-medium border border-[#3aa195]/20"
                                                    : "hover:bg-muted/60 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                                            )}
                                        >
                                            {chat.title}
                                        </SidebarMenuButton>
                                    </Link>
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36">
                                                <DropdownMenuItem onClick={() => {setEditingChatId(chat.id); setEditingTitle(chat.title);}}>
                                                    <Edit className="mr-2 h-3.5 w-3.5"/> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeletingChatId(chat.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-3.5 w-3.5"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </>
                            )}
                        </SidebarMenuItem>
                    ))
                ) : (
                    <div className="px-4 py-6 text-xs text-muted-foreground/60 text-center">
                        {searchTerm ? 'No chats found.' : 'No chats yet. Start a new conversation!'}
                    </div>
                )}
            </SidebarMenu>
        </SidebarContent>

        <AlertDialog open={!!deletingChatId} onOpenChange={(open) => !open && setDeletingChatId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete this conversation. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </Sidebar>
      
      <SidebarInset className="flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4">
            <div className="flex items-center gap-2.5">
                <SidebarTrigger className="md:hidden text-muted-foreground hover:text-foreground" />
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#3aa195]/15 flex items-center justify-center">
                        <MentraIcon className="h-4 w-4 text-[#3aa195]" />
                    </div>
                    <span className="font-semibold text-base text-foreground">Mentra</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-[#3aa195]/10 text-[#3aa195] border-[#3aa195]/20">
                        AI
                    </Badge>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                            <Avatar className="h-8 w-8 border border-border/50">
                                <AvatarImage key={currentUser.photoURL} src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
                                <AvatarFallback className="text-xs font-semibold bg-muted">
                                    {getInitials(currentUser.displayName)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-0.5">
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
                            <span>Terms & Conditions</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        
        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                {isNewChat ? (
                    <div className="h-full min-h-[calc(100vh-14rem)]">
                        <WelcomeScreen onSuggestion={(prompt) => handleSendMessage(prompt)} />
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-4">
                        {messages.map((message, index) => (
                            <ChatBubble
                                key={index}
                                message={message}
                                isLast={index === messages.length - 1}
                                lastRef={lastMessageRef}
                            />
                        ))}
                        {isResponding && (
                            <div ref={lastMessageRef} className="flex items-end gap-3 justify-start animate-fade-in-up">
                                <AssistantAvatar />
                                <div className="rounded-2xl rounded-bl-sm px-4 py-3.5 bg-card border border-border/50 shadow-sm">
                                    <PulsingDotsLoader />
                                </div>
                            </div>
                        )}
                        <div className="h-2" />
                    </div>
                )}
            </ScrollArea>

            {/* Input area */}
            <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-border/30 bg-background/95 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto space-y-2">
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-1">
                            {attachments.map((attachment, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-[#3aa195]/10 text-[#3aa195] border-[#3aa195]/20">
                                    <Paperclip className="h-3 w-3 shrink-0" />
                                    <span className="truncate max-w-[140px] text-xs">{attachment.name}</span>
                                    <button
                                        onClick={() => setAttachments(p => p.filter((_, i) => i !== index))}
                                        className="rounded-full p-0.5 hover:bg-[#3aa195]/20 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div
                        className={cn(
                            'relative flex w-full items-end gap-2 rounded-2xl border bg-card px-3 py-2 transition-all duration-200 shadow-sm',
                            inputFocused
                                ? 'border-[#3aa195]/50 shadow-[#3aa195]/10 shadow-md'
                                : 'border-border/60 hover:border-border'
                        )}
                    >
                        <input id="attachment-upload" type="file" className="hidden" onChange={handleFileUpload} ref={attachmentInputRef} disabled={isResponding} multiple />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 rounded-xl text-muted-foreground hover:text-[#3aa195] hover:bg-[#3aa195]/10 transition-colors"
                            onClick={() => attachmentInputRef.current?.click()}
                            aria-label="Attach file"
                            disabled={isResponding}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onInput={handleTextareaInput}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isResponding) handleSendMessage();
                                }
                            }}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="Ask Mentra anything…"
                            disabled={isResponding}
                            className="flex-1 w-full border-0 shadow-none focus-visible:ring-0 text-foreground bg-transparent resize-none py-1.5 text-sm placeholder:text-muted-foreground/60"
                            style={{ minHeight: '32px', maxHeight: '120px' }}
                        />
                        <Button
                            onClick={() => handleSendMessage()}
                            disabled={isResponding || (!input.trim() && attachments.length === 0)}
                            className={cn(
                                'shrink-0 h-8 w-8 p-0 rounded-xl transition-all duration-200',
                                (!isResponding && (input.trim() || attachments.length > 0))
                                    ? 'bg-[#3aa195] hover:bg-[#3aa195]/90 text-white shadow-sm shadow-[#3aa195]/20'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {isResponding ? <BrandLoader size="sm" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground/50 text-center">
                        Mentra can make mistakes. Verify important information.
                    </p>
                </div>
            </div>
        </div>
      </SidebarInset>
    </div>
  );
}


export default function MentraChatClient() {
    return (
        <SidebarProvider>
            <MentraChatPage />
        </SidebarProvider>
    )
}

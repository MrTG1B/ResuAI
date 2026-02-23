

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User, sendEmailVerification } from 'firebase/auth';
import { auth, db, doc, getDoc, collection, getDocs, query, orderBy, deleteDoc, Timestamp } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FileText, LayoutTemplate, ArrowRight, SearchCheck, Edit, Eye, PlusCircle, Trash2, ShieldAlert, Sparkles, NotebookPen, MessageCircleQuestion, BrainCircuit, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { type SavedEditorState, type ResumeCheck } from '@/types/resume';
import { type PortfolioData } from '@/types/portfolio';
import { type CoverLetter } from '@/types/cover-letter';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MentraIcon } from '@/components/mentra-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandLoader } from '@/components/brand-loader';
import { TemplatePreview } from '@/components/template-preview';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/use-subscription';


function ToolCard({ href, icon: Icon, title, description, actionText, color = 'primary', disabled = false, locked = false }: { href: string, icon: React.ElementType, title: string, description: string, actionText: string, color?: 'primary' | 'secondary', disabled?: boolean, locked?: boolean }) {
    const shadowColor = color === 'primary' ? 'hover:shadow-primary/25' : 'hover:shadow-[#45B8AC]/25';
    const iconColor = color === 'primary' ? 'text-primary' : 'text-[#45B8AC]';
    const bgColor = color === 'primary' ? 'bg-primary/10' : 'bg-[#45B8AC]/10';
    const isDisabled = disabled || locked;

    return (
        <Card className={`shadow-lg ${isDisabled ? 'opacity-60 cursor-not-allowed' : `hover:shadow-2xl ${shadowColor}`} transition-all duration-300 flex flex-col h-full relative`}>
            {disabled && !locked && (
                <Badge variant="destructive" className="absolute top-3 right-3">Coming Soon</Badge>
            )}
            {locked && (
                <Badge variant="outline" className="absolute top-3 right-3 border-amber-400 text-amber-600 dark:text-amber-400 gap-1">
                    <Lock className="h-3 w-3" /> Upgrade
                </Badge>
            )}
            <CardHeader>
                <div className="flex justify-center items-center mb-4">
                    <div className={`p-4 rounded-full ${bgColor}`}>
                        <Icon className={`h-8 w-8 ${iconColor}`} />
                    </div>
                </div>
                <CardTitle className="text-xl text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow text-center">
                <p className="text-muted-foreground">{description}</p>
                {locked && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Upgrade your plan to access this tool.
                    </p>
                )}
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" disabled={isDisabled}>
                    <Link href={isDisabled ? '#' : href}>{actionText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

const calculateProfileCompletion = (profile: any, user: User | null): number => {
    if (!profile && !user) return 0;

    const combinedData = {
        ...profile,
        name: profile?.name || user?.displayName,
        email: profile?.email || user?.email,
        profilePictureUrl: profile?.profilePictureUrl || user?.photoURL
    };
    
    const fields = [
        combinedData.name,
        combinedData.title,
        combinedData.email,
        combinedData.phone,
        combinedData.location,
        combinedData.profilePictureUrl,
        (combinedData.socials?.length || 0) > 0,
        (combinedData.experience?.length || 0) > 0,
        (combinedData.education?.length || 0) > 0,
        (combinedData.projects?.length || 0) > 0,
        (combinedData.certifications?.length || 0) > 0,
        (combinedData.publications?.length || 0) > 0,
        (combinedData.languages?.length || 0) > 0,
        (combinedData.interests?.length || 0) > 0,
    ];

    const completedFields = fields.filter(field => {
        if (typeof field === 'boolean') return field;
        return !!field;
    }).length;
    
    return Math.round((completedFields / fields.length) * 100);
};


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const { planId, plan, getFeatureLimit, canAccess } = useSubscription();

  const [resumes, setResumes] = useState<(SavedEditorState & {id: string})[]>([]);
  const [isResumeLoading, setIsResumeLoading] = useState(true);
  
  const [portfolios, setPortfolios] = useState<(PortfolioData & {id: string})[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  
  const [coverLetters, setCoverLetters] = useState<(CoverLetter & {id: string})[]>([]);
  const [isCoverLetterLoading, setIsCoverLetterLoading] = useState(true);
  
  const [resumeChecks, setResumeChecks] = useState<ResumeCheck[]>([]);
  const [isResumeCheckLoading, setIsResumeCheckLoading] = useState(true);
  
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<{type: 'resume' | 'portfolio' | 'coverletter' | 'resumecheck', id: string} | null>(null);

  // Plan-based limits (fall back to sensible numbers if unlimited is returned)
  const maxResumes = getFeatureLimit('resumeBuilds');
  const maxPortfolios = getFeatureLimit('portfolios');
  const maxCoverLetters = getFeatureLimit('coverLetters');

  // Plan display helpers
  const PLAN_BADGE_COLORS: Record<string, string> = {
    free: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300',
    pro: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300',
    ultra_pro: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300',
  };

  const isEmailUser = user?.providerData.some(p => p.providerId === 'password');
  const isEmailVerified = user?.emailVerified;


  useEffect(() => {
    if (!auth) {
      router.push('/login');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        const fetchData = async (collectionName: string, setter: Function, loaderSetter: Function, sortField: string = 'lastModified') => {
            try {
                if (!db) throw new Error("Firestore not initialized");
                const q = query(collection(db, `users/${user.uid}/${collectionName}`), orderBy(sortField, 'desc'));
                const snapshot = await getDocs(q);
                 const items = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Sanitize Firestore Timestamps
                    for (const key in data) {
                        if (data[key] instanceof Timestamp) {
                            data[key] = data[key].toDate().toISOString();
                        }
                    }
                    return { id: doc.id, ...data };
                });
                setter(items);
            } catch (error) {
                console.error(`Failed to fetch ${collectionName}:`, error);
                 toast({ title: "Error", description: `Could not fetch your ${collectionName}.`, variant: "destructive" });
            } finally {
                loaderSetter(false);
            }
        };

        try {
            if (!db) throw new Error("Firestore not initialized");
            const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
            const profileSnap = await getDoc(profileDocRef);
            const profileData = profileSnap.exists() ? profileSnap.data() : {};
            const completion = calculateProfileCompletion(profileData, user);
            setProfileCompletion(completion);
        } catch (error) {
            console.error("Failed to fetch profile data:", error);
        }

        fetchData('resumes', setResumes, setIsResumeLoading);
        fetchData('portfolios', setPortfolios, setIsPortfolioLoading);
        fetchData('coverletters', setCoverLetters, setIsCoverLetterLoading);
        fetchData('resumechecks', setResumeChecks, setIsResumeCheckLoading, 'createdAt');
        setIsLoading(false);

      } else {
        router.push('/login');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleStartNew = (type: 'resume' | 'coverletter') => {
    if (type === 'resume') {
        sessionStorage.removeItem('resumeEditorState');
        router.push('/resume-builder/editor?from=scratch');
    } else {
        router.push('/cover-letter-generator');
    }
  }

  const confirmDelete = async () => {
    if (!user || !deleteTarget || !db) {
      toast({ title: "Error", description: "Could not delete. User or target is missing.", variant: "destructive" });
      setDeleteTarget(null);
      return;
    }
  
    const { type, id } = deleteTarget;
    const { uid } = user;
    setDeleteTarget(null);
  
    try {
      const collectionName = type === 'coverletter' ? 'coverletters' : type === 'resumecheck' ? 'resumechecks' : `${type}s`;
      const docRef = doc(db, "users", uid, collectionName, id);
      await deleteDoc(docRef);
  
      if (type === 'resume') setResumes(prev => prev.filter(r => r.id !== id));
      else if (type === 'portfolio') setPortfolios(prev => prev.filter(p => p.id !== id));
      else if (type === 'coverletter') setCoverLetters(prev => prev.filter(cl => cl.id !== id));
      else if (type === 'resumecheck') setResumeChecks(prev => prev.filter(rc => rc.id !== id));
      
      const displayName = type === 'resumecheck' ? 'ATS Check' : type.charAt(0).toUpperCase() + type.slice(1);
      toast({ title: `${displayName} Deleted`, description: `The ${displayName.toLowerCase()} has been successfully deleted.` });
    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      let errorMessage = `Failed to delete ${type}. Please try again.`;
      if (error.code === 'permission-denied') {
        errorMessage = "You do not have permission to delete this item.";
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleResendVerification = async () => {
    if (user) {
        try {
            await sendEmailVerification(user);
            toast({
                title: 'Verification Email Sent',
                description: 'Please check your inbox (and spam folder) for the verification link.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send verification email. Please try again later.',
                variant: 'destructive',
            });
        }
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <BrandLoader size="lg" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-fade-in-down">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-heading">
                        Welcome back, {user.displayName || 'Creator'}!
                    </h1>
                    <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 ${PLAN_BADGE_COLORS[planId] ?? PLAN_BADGE_COLORS.free}`}>
                        {plan.name} Plan
                    </Badge>
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                    Your career toolkit is ready. Let's build something amazing today.
                </p>
                {planId === 'free' && (
                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                        🔓 <Link href="/pricing" className="font-medium underline underline-offset-2">Upgrade your plan</Link> to unlock more tools and higher limits.
                    </p>
                )}
            </div>

            {isEmailUser && !isEmailVerified && (
                <Alert variant="destructive" className="animate-fade-in-up">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Verify Your Email Address</AlertTitle>
                    <AlertDescription>
                        Please check your inbox for a verification link to secure your account.{" "}
                        <Button variant="link" className="p-0 h-auto font-semibold" onClick={handleResendVerification}>
                            Resend verification email
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {profileCompletion < 100 && (
                <Card className="bg-primary/10 border-primary/20 animate-fade-in-up shadow-lg hover:shadow-2xl hover:shadow-primary/25 transition-shadow">
                    <CardHeader>
                        <CardTitle>Complete Your Profile!</CardTitle>
                        <CardDescription>
                            Your profile is {profileCompletion}% complete. A full profile helps our AI create better resumes and portfolios for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Progress value={profileCompletion} className="h-2" indicatorClassName="bg-gradient-to-r from-primary to-[#45B8AC]" />
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/profile">Update Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <Card className={`shadow-lg hover:shadow-2xl hover:shadow-[#45B8AC]/25 transition-all duration-300 w-full animate-fade-in-up ${!canAccess('mentorChat') ? 'opacity-60' : ''}`}>
                <Link href={canAccess('mentorChat') ? "/mentra" : "/pricing"} className="block hover:bg-card/20 rounded-lg">
                    <CardHeader className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left p-4 sm:p-6">
                        <div className="bg-[#45B8AC]/10 p-4 rounded-full">
                            <MentraIcon className="h-10 w-10 text-[#45B8AC]" isAnimated={canAccess('mentorChat')} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <CardTitle className="text-2xl">Chat with Mentra</CardTitle>
                                {!canAccess('mentorChat') && (
                                    <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400 gap-1 text-xs">
                                        <Lock className="h-3 w-3" /> Pro+
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground mt-1">Get instant guidance on your career, help writing professional content, and more from your personal AI mentor.</p>
                            {!canAccess('mentorChat') && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Available on Pro and Ultra Pro plans.</p>
                            )}
                        </div>
                        <Button variant="ghost" className="shrink-0 mt-4 md:mt-0" disabled={!canAccess('mentorChat')}>
                            {canAccess('mentorChat') ? <>Start Chatting <Sparkles className="ml-2 h-4 w-4" /></> : <>Upgrade to Unlock <Lock className="ml-2 h-4 w-4" /></>}
                        </Button>
                    </CardHeader>
                </Link>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                <ToolCard 
                    href="/resume-builder"
                    icon={FileText}
                    title="AI Resume Editor"
                    description="Create from scratch or enhance your resume with AI-powered suggestions."
                    actionText="Open Editor"
                    color="primary"
                />
                <ToolCard 
                    href="/resume-analyzer"
                    icon={SearchCheck}
                    title="AI Resume ATS Checker"
                    description="Scan your resume against a job description to check for ATS-friendliness."
                    actionText="Analyze Resume"
                    color="secondary"
                />
                <ToolCard 
                    href="/cover-letter-generator"
                    icon={NotebookPen}
                    title="AI Cover Letter Generator"
                    description="Create a professional cover letter tailored to any job description in seconds."
                    actionText="Create Letter"
                    color="primary"
                />
                 <ToolCard 
                    href="/interview-prep"
                    icon={MessageCircleQuestion}
                    title="AI Interview Assister"
                    description="Practice common interview questions and get AI-powered feedback."
                    actionText="Start Practice"
                    color="secondary"
                    locked={!canAccess('interviewPrep')}
                />
                 <ToolCard 
                    href="/aptitude-test"
                    icon={BrainCircuit}
                    title="Aptitude Test"
                    description="Take a timed test with unique questions to sharpen your skills for interviews."
                    actionText="Start Test"
                    color="primary"
                    locked={!canAccess('aptitudeTests')}
                />
                <ToolCard 
                    href="/build"
                    icon={LayoutTemplate}
                    title="AI Portfolio Generator"
                    description="Instantly transform your resume into a stunning portfolio website."
                    actionText="Create Portfolio"
                    color="secondary"
                />
            </div>
            
            <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <Tabs defaultValue="resumes" className="flex-col">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <CardTitle>Your Saved Work</CardTitle>
                                <CardDescription>Manage your generated resumes, portfolios, cover letters, and ATS checks.</CardDescription>
                            </div>
                            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                                <TabsTrigger value="resumes">Resumes</TabsTrigger>
                                <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
                                <TabsTrigger value="coverletters">Cover Letters</TabsTrigger>
                                <TabsTrigger value="atschecks">ATS Checks</TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="resumes" className="space-y-4">
                            {isResumeLoading ? (
                                <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                            ) : resumes.length > 0 ? (
                                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {resumes.map(r => {
                                        const hasBeenEdited = (r.chatHistory?.length || 0) > 0;
                                        const showOriginalPdf = r.initialPreviewUri && !hasBeenEdited;
                                        return (
                                        <li key={r.id} className="group relative flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                                            <div className="flex items-center gap-4 overflow-hidden flex-grow cursor-pointer" onClick={() => router.push(`/resume-builder/editor?id=${r.id}`)}>
                                                <div className="w-16 h-20 rounded-md border bg-white flex-shrink-0 overflow-hidden relative">
                                                    {showOriginalPdf ? (
                                                        <iframe src={`${r.initialPreviewUri}#toolbar=0&navpanes=0`} className="w-full h-full border-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'scale(0.1)', width: '1000%', height: '1000%', transformOrigin: 'center center' }} title="Original Resume Preview" />
                                                    ) : (
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'scale(0.08) translate(-50%, -50%)', transformOrigin: 'top left' }} dangerouslySetInnerHTML={{ __html: r.htmlContent || '' }} />
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold text-sm truncate group-hover:underline">{r.fileName || "Untitled Resume"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">Last modified: {r.lastModified ? (typeof r.lastModified === 'string' ? new Date(r.lastModified).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : r.lastModified.toDate().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-4 space-x-2">
                                                 <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                                    <Button size="icon" className="h-8 w-8 bg-primary/20 hover:bg-primary/30" onClick={() => router.push(`/resume-builder/editor?id=${r.id}`)}>
                                                        <Edit className="h-4 w-4 text-primary"/>
                                                    </Button>
                                                </TooltipTrigger><TooltipContent><p>Edit Resume</p></TooltipContent></Tooltip></TooltipProvider>
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget({ type: 'resume', id: r.id })}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/></Button></TooltipTrigger><TooltipContent><p>Delete Resume</p></TooltipContent></Tooltip></TooltipProvider>
                                            </div>
                                        </li>
                                    )})}
                                </ul>
                            ) : (
                                <div className="text-center p-8 bg-muted/50 rounded-lg"><CardTitle className="text-lg">No Saved Resumes</CardTitle><CardDescription className="mt-2 mb-4">You haven't started editing a resume yet.</CardDescription></div>
                            )}
                            <div className="pt-4 border-t"><TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full"><Button onClick={() => handleStartNew('resume')} className="w-full" disabled={maxResumes !== 'unlimited' && resumes.length >= maxResumes}><PlusCircle className="mr-2 h-4 w-4" /> Create New Resume</Button></div></TooltipTrigger>{maxResumes !== 'unlimited' && resumes.length >= maxResumes && (<TooltipContent><p>You have reached the {plan.name} plan limit of {maxResumes} resumes. <Link href="/pricing" className="underline">Upgrade</Link> for more.</p></TooltipContent>)}</Tooltip></TooltipProvider></div>
                        </TabsContent>
                        <TabsContent value="portfolios" className="space-y-4">
                             {isPortfolioLoading ? (
                                <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                            ) : portfolios.length > 0 ? (
                                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {portfolios.map(p => (
                                        <li key={p.id} className="group relative flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                                            <div className='flex items-center gap-4 overflow-hidden flex-grow cursor-pointer' onClick={() => router.push(`/portfolio/edit/${p.id}`)}>
                                                <div className="h-10 w-16 rounded-md border bg-white flex-shrink-0 overflow-hidden relative">
                                                    <TemplatePreview portfolioData={p} templateId={p.templateId || 'classic'} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold text-sm truncate group-hover:underline">{p.title || "Untitled Portfolio"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{p.personalInfo?.title || 'No title'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-4 space-x-2">
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                                    <Button size="icon" className="h-8 w-8 bg-[#45B8AC]/20 hover:bg-[#45B8AC]/30" asChild>
                                                        <Link href={`/portfolio?id=${p.id}`}>
                                                            <Eye className="h-4 w-4 text-[#45B8AC]"/>
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger><TooltipContent><p>View Portfolio</p></TooltipContent></Tooltip></TooltipProvider>
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                                    <Button size="icon" className="h-8 w-8 bg-primary/20 hover:bg-primary/30" onClick={() => router.push(`/portfolio/edit/${p.id}`)}>
                                                        <Edit className="h-4 w-4 text-primary"/>
                                                    </Button>
                                                </TooltipTrigger><TooltipContent><p>Edit Portfolio</p></TooltipContent></Tooltip></TooltipProvider>
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget({ type: 'portfolio', id: p.id })}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/></Button></TooltipTrigger><TooltipContent><p>Delete Portfolio</p></TooltipContent></Tooltip></TooltipProvider>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center p-8 bg-muted/50 rounded-lg"><CardTitle className="text-lg">No Portfolios Yet</CardTitle><CardDescription className="mt-2 mb-4">You haven't created a portfolio.</CardDescription></div>
                            )}
                            <div className="pt-4 border-t"><TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full"><Button asChild className="w-full" disabled={maxPortfolios !== 'unlimited' && portfolios.length >= maxPortfolios}><Link href="/build"><PlusCircle className="mr-2 h-4 w-4" /> Create New Portfolio</Link></Button></div></TooltipTrigger>{maxPortfolios !== 'unlimited' && portfolios.length >= maxPortfolios && (<TooltipContent><p>You have reached the {plan.name} plan limit of {maxPortfolios} portfolios. <Link href="/pricing" className="underline">Upgrade</Link> for more.</p></TooltipContent>)}</Tooltip></TooltipProvider></div>
                        </TabsContent>
                        <TabsContent value="coverletters" className="space-y-4">
                             {isCoverLetterLoading ? (
                                <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                            ) : coverLetters.length > 0 ? (
                               <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {coverLetters.map(cl => (
                                        <li key={cl.id} className="group relative flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                                            <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-grow" onClick={() => router.push(`/cover-letter-generator?id=${cl.id}`)}>
                                                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full"><NotebookPen className="h-5 w-5 text-primary" /></div>
                                                <div className="overflow-hidden"><p className="font-semibold text-sm truncate group-hover:underline">{cl.title || "Untitled Cover Letter"}</p><p className="text-xs text-muted-foreground truncate">For: {cl.companyName} | Last modified: {cl.lastModified ? (typeof cl.lastModified === 'string' ? new Date(cl.lastModified).toLocaleDateString() : cl.lastModified.toDate().toLocaleDateString()) : 'N/A'}</p></div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-2 space-x-1">
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                                    <Button size="icon" className="h-8 w-8 bg-primary/20 hover:bg-primary/30" onClick={() => router.push(`/cover-letter-generator?id=${cl.id}`)}>
                                                        <Edit className="h-4 w-4 text-primary"/>
                                                    </Button>
                                                </TooltipTrigger><TooltipContent><p>Edit Cover Letter</p></TooltipContent></Tooltip></TooltipProvider>
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget({ type: 'coverletter', id: cl.id })}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/></Button></TooltipTrigger><TooltipContent><p>Delete Cover Letter</p></TooltipContent></Tooltip></TooltipProvider>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center p-8 bg-muted/50 rounded-lg"><CardTitle className="text-lg">No Saved Cover Letters</CardTitle><CardDescription className="mt-2 mb-4">You haven't created a cover letter yet.</CardDescription></div>
                            )}
                             <div className="pt-4 border-t"><TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full"><Button onClick={() => handleStartNew('coverletter')} className="w-full" disabled={maxCoverLetters !== 'unlimited' && coverLetters.length >= maxCoverLetters}><PlusCircle className="mr-2 h-4 w-4" /> Create New Cover Letter</Button></div></TooltipTrigger>{maxCoverLetters !== 'unlimited' && coverLetters.length >= maxCoverLetters && (<TooltipContent><p>You have reached the {plan.name} plan limit of {maxCoverLetters} cover letters. <Link href="/pricing" className="underline">Upgrade</Link> for more.</p></TooltipContent>)}</Tooltip></TooltipProvider></div>
                        </TabsContent>
                        <TabsContent value="atschecks" className="space-y-4">
                            {isResumeCheckLoading ? (
                                <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                            ) : resumeChecks.length > 0 ? (
                                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {resumeChecks.map(rc => (
                                        <li key={rc.id} className="group relative flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                                            <div className="flex items-center gap-3 overflow-hidden flex-grow">
                                                <div className="flex-shrink-0 bg-[#45B8AC]/10 p-3 rounded-full">
                                                    {rc.isAtsFriendly ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold text-sm truncate">{rc.resumeFileName || "Resume"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">Score: {rc.atsFriendlinessScore}% | {rc.atsSummary}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{rc.createdAt ? (typeof rc.createdAt === 'string' ? new Date(rc.createdAt).toLocaleDateString() : (rc.createdAt as any).toDate().toLocaleDateString()) : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-2 space-x-1">
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget({ type: 'resumecheck', id: rc.id })}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/></Button></TooltipTrigger><TooltipContent><p>Delete ATS Check</p></TooltipContent></Tooltip></TooltipProvider>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center p-8 bg-muted/50 rounded-lg"><CardTitle className="text-lg">No ATS Checks Yet</CardTitle><CardDescription className="mt-2 mb-4">You haven't run an ATS check yet.</CardDescription></div>
                            )}
                            <div className="pt-4 border-t">
                                <Button asChild className="w-full" style={{backgroundColor: '#45B8AC', color: 'white'}}>
                                    <Link href="/resume-analyzer"><SearchCheck className="mr-2 h-4 w-4" /> Run New ATS Check</Link>
                                </Button>
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

        </div>
      </main>
      <Footer />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your {deleteTarget?.type === 'resumecheck' ? 'ATS check' : deleteTarget?.type}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

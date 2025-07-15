
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db, doc, getDoc, collection, getDocs, query, orderBy, deleteDoc } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, FileText, LayoutTemplate, ArrowRight, SearchCheck, Edit, Eye, PlusCircle, Trash2, ShieldAlert } from 'lucide-react';
import { type SavedEditorState } from '@/types/resume';
import { type PortfolioData } from '@/types/portfolio';
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

function ToolCard({ href, icon: Icon, title, description, actionText }: { href: string, icon: React.ElementType, title: string, description: string, actionText: string }) {
    return (
        <Card className="shadow-lg hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 flex flex-col h-full">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-xl font-heading">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={href}>{actionText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

const calculateProfileCompletion = (profile: any, user: User | null): number => {
    if (!profile && !user) return 0;

    // Combine profile data with user auth data for a complete picture
    const combinedData = {
        ...profile,
        name: profile?.name || user?.displayName,
        email: profile?.email || user?.email,
    };
    
    const fields = [
        combinedData.name,
        combinedData.title,
        combinedData.email,
        combinedData.phone,
        combinedData.location,
        (combinedData.socials?.length || 0) > 0,
        (combinedData.experience?.length || 0) > 0,
        (combinedData.education?.length || 0) > 0,
        (combinedData.projects?.length || 0) > 0,
        (combinedData.certifications?.length || 0) > 0,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
};


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<(SavedEditorState & {id: string})[]>([]);
  const [isResumeLoading, setIsResumeLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<(PortfolioData & {id: string})[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<{type: 'resume' | 'portfolio', id: string} | null>(null);

  const MAX_RESUMES = 10;
  const MAX_PORTFOLIOS = 5;

  const hasReachedResumeLimit = resumes.length >= MAX_RESUMES;
  const hasReachedPortfolioLimit = portfolios.length >= MAX_PORTFOLIOS;

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
        
        // Fetch profile data for completion status
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

        // Fetch resumes
        try {
            if (!db) throw new Error("Firestore not initialized");
            const resumeQuery = query(collection(db, `users/${user.uid}/resumes`), orderBy('lastModified', 'desc'));
            const resumeSnapshot = await getDocs(resumeQuery);
            const userResumes = resumeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedEditorState & {id: string}));
            setResumes(userResumes);
        } catch (error) {
            console.error("Failed to fetch saved resumes:", error);
        } finally {
            setIsResumeLoading(false);
        }
        
        // Fetch portfolios
        try {
            if (!db) throw new Error("Firestore not initialized");
            const portfolioQuery = query(collection(db, `users/${user.uid}/portfolios`), orderBy('createdAt', 'desc'));
            const portfolioSnapshot = await getDocs(portfolioQuery);
            const userPortfolios = portfolioSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioData & {id: string}));
            setPortfolios(userPortfolios);
        } catch (error) {
            console.error("Failed to fetch portfolios:", error);
        } finally {
            setIsPortfolioLoading(false);
        }

      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleContinueEditing = (resumeId: string) => {
    router.push(`/resume-builder/editor?id=${resumeId}`);
  };

  const handleStartNew = () => {
    sessionStorage.removeItem('resumeEditorState');
    router.push('/resume-builder/editor?from=scratch');
  }

  const confirmDelete = async () => {
    if (!user || !deleteTarget || !db) {
      toast({ title: "Error", description: "Could not delete. User or target is missing.", variant: "destructive" });
      setDeleteTarget(null);
      return;
    }
  
    const { type, id } = deleteTarget;
    const { uid } = user;
    setDeleteTarget(null); // Clear target immediately
  
    if (type === 'resume' && resumes.length <= 1) {
        toast({ title: "Deletion Failed", description: "You cannot delete your last resume.", variant: "destructive" });
        return;
    }
    if (type === 'portfolio' && portfolios.length <= 1) {
        toast({ title: "Deletion Failed", description: "You cannot delete your last portfolio.", variant: "destructive" });
        return;
    }
  
    try {
      const collectionName = type === 'resume' ? 'resumes' : 'portfolios';
      const docRef = doc(db, "users", uid, collectionName, id);
      await deleteDoc(docRef);
  
      if (type === 'resume') {
        setResumes(prev => prev.filter(r => r.id !== id));
      } else {
        setPortfolios(prev => prev.filter(p => p.id !== id));
      }
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted`, description: `The ${type} has been successfully deleted.` });
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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const createNewResumeButton = (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="w-full">
                    <Button onClick={handleStartNew} className="w-full" disabled={hasReachedResumeLimit}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Resume
                    </Button>
                </div>
            </TooltipTrigger>
            {hasReachedResumeLimit && (
                <TooltipContent>
                    <p>You have reached the free limit of {MAX_RESUMES} resumes.</p>
                </TooltipContent>
            )}
        </Tooltip>
    </TooltipProvider>
  );

  const createNewPortfolioButton = (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="w-full">
                    <Button asChild className="w-full" disabled={hasReachedPortfolioLimit}>
                        <Link href="/build"><PlusCircle className="mr-2 h-4 w-4" /> Create New Portfolio</Link>
                    </Button>
                </div>
            </TooltipTrigger>
            {hasReachedPortfolioLimit && (
                <TooltipContent>
                    <p>You have reached the free limit of {MAX_PORTFOLIOS} portfolios.</p>
                </TooltipContent>
            )}
        </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-fade-in-down">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-heading">
                    Welcome back, {user.displayName || 'Creator'}!
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Your career toolkit is ready. Let's build something amazing today.
                </p>
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
                <Card className="bg-primary/10 border-primary/20 animate-fade-in-up">
                    <CardHeader>
                        <CardTitle>Complete Your Profile!</CardTitle>
                        <CardDescription>
                            Your profile is {profileCompletion}% complete. A full profile helps our AI create better resumes and portfolios for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Progress value={profileCompletion} className="h-2" />
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/profile">Update Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                <ToolCard 
                    href="/resume-builder"
                    icon={FileText}
                    title="AI Resume Editor"
                    description="Upload, create from scratch, and enhance your resume with AI-powered suggestions."
                    actionText="Open Editor"
                />
                <ToolCard 
                    href="/resume-analyzer"
                    icon={SearchCheck}
                    title="AI Resume Analyzer"
                    description="Get instant feedback on how well your resume matches a specific job description."
                    actionText="Analyze Resume"
                />
                 <ToolCard 
                    href="/build"
                    icon={LayoutTemplate}
                    title="AI Portfolio Generator"
                    description="Instantly transform your resume into a stunning, professional portfolio website."
                    actionText="Create Portfolio"
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Saved Resumes Section */}
                <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                        <CardTitle>Your Saved Resumes ({resumes.length}/{MAX_RESUMES})</CardTitle>
                        <CardDescription>Continue where you left off or create a new one.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        {isResumeLoading ? (
                            <div className="flex items-center justify-center min-h-[200px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : resumes.length > 0 ? (
                           <ul className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {resumes.map(r => (
                                    <li key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
                                        <div 
                                            className="flex items-center gap-3 overflow-hidden cursor-pointer flex-grow"
                                            onClick={() => handleContinueEditing(r.id)}
                                        >
                                            <div className="w-12 h-16 rounded border bg-white flex justify-center items-start overflow-hidden flex-shrink-0">
                                                <div
                                                    className="text-black shadow-sm scale-[0.1] origin-top"
                                                    style={{
                                                        width: '210mm',
                                                        minHeight: '297mm',
                                                        padding: '10mm'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: r.htmlContent || '' }}
                                                />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-sm truncate group-hover:underline">{r.fileName || "Untitled Resume"}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    Last modified: {r.lastModified ? new Date(r.lastModified.seconds * 1000).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-shrink-0 ml-2 space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleContinueEditing(r.id)}>
                                                <Edit className="mr-2 h-4 w-4"/>
                                                Edit
                                            </Button>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'resume', id: r.id })}>
                                                            <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive"/>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Delete Resume</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px] bg-muted/50 rounded-lg">
                                <CardTitle>No Saved Resumes</CardTitle>
                                <CardDescription className="mt-2 mb-4">You haven't started editing a resume yet.</CardDescription>
                                {createNewResumeButton}
                            </div>
                        )}
                    </CardContent>
                     {resumes.length > 0 && (
                        <CardFooter>
                           {createNewResumeButton}
                        </CardFooter>
                    )}
                </Card>

                {/* Saved Portfolios Section */}
                <Card className="flex flex-col shadow-lg animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <CardHeader>
                        <CardTitle>Your Portfolios ({portfolios.length}/{MAX_PORTFOLIOS})</CardTitle>
                        <CardDescription>View, edit, and share your generated portfolios.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        {isPortfolioLoading ? (
                            <div className="flex items-center justify-center min-h-[200px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : portfolios.length > 0 ? (
                            <ul className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {portfolios.map(p => (
                                    <li key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
                                        <div className='flex items-center gap-3 overflow-hidden flex-grow cursor-pointer' onClick={() => router.push(`/portfolio?id=${p.id}`)}>
                                            <Image 
                                                src={p.personalInfo?.profilePictureDataUri || 'https://placehold.co/40x40.png'} 
                                                alt="avatar" 
                                                width={40} height={40} 
                                                className="rounded-full object-cover flex-shrink-0"
                                            />
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-sm truncate group-hover:underline">{p.title || "Untitled Portfolio"}</p>
                                                <p className="text-xs text-muted-foreground truncate">{p.personalInfo?.title || 'No title'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-shrink-0 ml-2 space-x-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/portfolio?id=${p.id}`}>
                                                    <Eye className="mr-2 h-4 w-4"/>
                                                    View
                                                </Link>
                                            </Button>
                                             <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'portfolio', id: p.id })}>
                                                            <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive"/>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Delete Portfolio</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px] bg-muted/50 rounded-lg">
                                <CardTitle>No Portfolios Yet</CardTitle>
                                <CardDescription className="mt-2 mb-4">You haven't created a portfolio.</CardDescription>
                                {createNewPortfolioButton}
                            </div>
                        )}
                    </CardContent>
                    {portfolios.length > 0 && (
                        <CardFooter>
                            {createNewPortfolioButton}
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your {deleteTarget?.type}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} variant="destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

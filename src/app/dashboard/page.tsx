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
import { FileText, LayoutTemplate, ArrowRight, SearchCheck, Edit, Eye, PlusCircle, Trash2, ShieldAlert, Sparkles, NotebookPen, MessageCircleQuestion, BrainCircuit, CheckCircle2, XCircle, Lock, Rocket, TrendingUp, Gift } from 'lucide-react';
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


function ToolCard({
  href,
  icon: Icon,
  title,
  description,
  actionText,
  color = 'primary',
  disabled = false,
  locked = false,
  delay = 0,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  actionText: string;
  color?: 'primary' | 'secondary';
  disabled?: boolean;
  locked?: boolean;
  delay?: number;
}) {
  const isPrimary = color === 'primary';
  const iconGradient = isPrimary
    ? 'from-primary/30 to-primary/10 border border-primary/20'
    : 'from-[#45B8AC]/30 to-[#45B8AC]/10 border border-[#45B8AC]/20';
  const iconColor = isPrimary ? 'text-primary' : 'text-[#45B8AC]';
  const glowColor = isPrimary ? 'hover:shadow-primary/20' : 'hover:shadow-[#45B8AC]/20';
  const isDisabled = disabled || locked;

  return (
    <div
      className="animate-scale-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <Card
        className={`glass-card flex flex-col h-full relative transition-all duration-300 group ${
          isDisabled
            ? 'opacity-60 cursor-default'
            : `hover:shadow-2xl ${glowColor} hover:-translate-y-1 hover:border-border/80`
        }`}
      >
        {disabled && !locked && (
          <Badge variant="destructive" className="absolute top-3 right-3 z-10">
            Coming Soon
          </Badge>
        )}
        {locked && (
          <Badge
            variant="outline"
            className="absolute top-3 right-3 z-10 border-amber-400 text-amber-400 gap-1"
          >
            <Lock className="h-3 w-3" /> Upgrade
          </Badge>
        )}
        <CardHeader className="items-center text-center pb-2">
          <div
            className={`mb-4 p-4 rounded-2xl bg-gradient-to-br ${iconGradient} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow text-center">
          <p className="text-muted-foreground text-sm">{description}</p>
          {locked && (
            <p className="mt-2 text-xs text-amber-400 font-medium">
              Upgrade your plan to access this tool.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {locked ? (
            <Button
              asChild
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-md shadow-amber-900/40"
            >
              <Link href="/pricing">
                <Lock className="mr-2 h-4 w-4" /> Unlock — Upgrade Plan
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full" disabled={disabled}>
              <Link href={disabled ? '#' : href}>
                {actionText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
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

  const maxResumes = getFeatureLimit('resumeBuilds');
  const maxPortfolios = getFeatureLimit('portfolios');
  const maxCoverLetters = getFeatureLimit('coverLetters');

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

  const statCards = [
    {
      label: 'Resumes',
      count: resumes.length,
      loading: isResumeLoading,
      icon: FileText,
      color: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/20',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      label: 'Portfolios',
      count: portfolios.length,
      loading: isPortfolioLoading,
      icon: LayoutTemplate,
      color: 'from-[#45B8AC]/20 to-[#45B8AC]/5',
      border: 'border-[#45B8AC]/20',
      iconColor: 'text-[#45B8AC]',
      iconBg: 'bg-[#45B8AC]/10',
    },
    {
      label: 'Cover Letters',
      count: coverLetters.length,
      loading: isCoverLetterLoading,
      icon: NotebookPen,
      color: 'from-violet-500/20 to-violet-500/5',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
    },
    {
      label: 'ATS Checks',
      count: resumeChecks.length,
      loading: isResumeCheckLoading,
      icon: SearchCheck,
      color: 'from-blue-500/20 to-blue-500/5',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="dot-grid fixed inset-0 pointer-events-none opacity-60" />

      <Header />

      <main className="flex-grow p-4 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Hero Welcome Section */}
          <div
            className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 p-8 md:p-10 animate-fade-in-down"
            style={{ animationFillMode: 'both' }}
          >
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl animate-float pointer-events-none" />
            <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-[#45B8AC]/10 blur-3xl animate-pulse-glow pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold px-3 py-1 ${PLAN_BADGE_COLORS[planId] ?? PLAN_BADGE_COLORS.free}`}
                >
                  {'\u2726'} {plan.name} Plan
                </Badge>
                {planId === 'free' && (
                  <Link
                    href="/pricing"
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors"
                  >
                    {'\uD83D\uDD13'} Upgrade for more
                  </Link>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading tracking-tight">
                Welcome back,{' '}
                <span className="shimmer-text">{user.displayName || 'Creator'}</span>!
              </h1>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                Your career toolkit is ready. Let&apos;s build something amazing today.
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            {statCards.map((stat, i) => (
              <div
                key={stat.label}
                className="animate-scale-in"
                style={{ animationDelay: `${120 + i * 60}ms`, animationFillMode: 'both' }}
              >
                <Card
                  className={`glass-card relative overflow-hidden border ${stat.border} bg-gradient-to-br ${stat.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.iconBg} flex-shrink-0`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-heading leading-none">
                        {stat.loading ? (
                          <span className="inline-block w-6 h-5 bg-muted/60 rounded animate-pulse" />
                        ) : (
                          stat.count
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Email Verification Alert */}
          {isEmailUser && !isEmailVerified && (
            <Alert variant="destructive" className="animate-fade-in-up" style={{ animationFillMode: 'both' }}>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Verify Your Email Address</AlertTitle>
              <AlertDescription>
                Please check your inbox for a verification link to secure your account.{' '}
                <Button variant="link" className="p-0 h-auto font-semibold" onClick={handleResendVerification}>
                  Resend verification email
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Completion Card */}
          {profileCompletion < 100 && (
            <div
              className="animated-border-glow animate-fade-in-up"
              style={{ animationDelay: '150ms', animationFillMode: 'both' }}
            >
              <Card className="glass-card border-0 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Complete Your Profile
                      </CardTitle>
                      <CardDescription className="mt-1">
                        A complete profile helps our AI craft better resumes and portfolios.
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-3xl font-bold font-heading shimmer-text">{profileCompletion}%</span>
                      <p className="text-xs text-muted-foreground">complete</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <Progress
                    value={profileCompletion}
                    className="h-2.5 bg-muted/50"
                    indicatorClassName="bg-gradient-to-r from-primary via-[#45B8AC] to-violet-400"
                  />
                </CardContent>
                <CardFooter className="pt-3">
                  <Button asChild size="sm">
                    <Link href="/profile">
                      Update Profile <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* Upgrade Marketing Banner */}
          {(planId === 'free' || planId === 'medium') && (
            <div
              className="animated-border-glow animate-fade-in-up"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 p-6 md:p-8">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-4 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="shrink-0 bg-white/15 p-4 rounded-2xl">
                    <Rocket className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                      <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        <Gift className="h-3 w-3" />
                        {planId === 'free' ? 'Unlock Your Full Potential' : 'Level Up to Pro'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white leading-tight">
                      {planId === 'free'
                        ? "You're on the Free plan \u2014 you're just getting started!"
                        : 'Ready for unlimited power? Go Pro today!'}
                    </h2>
                    <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-xl">
                      {planId === 'free'
                        ? 'Upgrade to unlock AI Interview Prep, Aptitude Tests, Mentra AI Chat, 10\u00d7 more resumes & cover letters, and priority support \u2014 everything you need to land your dream job faster.'
                        : 'Pro gives you unlimited cover letters, 50 resumes, 500 AI requests/month, Mentra Chat and priority support. Ultra Pro goes even further with unlimited everything.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start text-xs text-white/70">
                      {planId === 'free' ? (
                        <>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> 5\u00d7 more AI requests</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Interview Prep & Aptitude Tests</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Mentra AI Mentor Chat</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Priority Support</span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> 5\u00d7 more AI requests</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Unlimited cover letters</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Mentra AI Mentor Chat</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Priority Support</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                    <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-white/90 font-bold shadow-lg shadow-black/20 whitespace-nowrap">
                      <Link href="/pricing">
                        <Sparkles className="mr-2 h-4 w-4" />
                        {planId === 'free' ? 'Upgrade Now \u2192' : 'Go Pro \u2192'}
                      </Link>
                    </Button>
                    <p className="text-center text-[11px] text-white/60">7-day money-back guarantee \u00b7 Cancel anytime</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mentra Chat Card */}
          <div
            className="animated-border-glow animate-fade-in-up"
            style={{ animationDelay: '250ms', animationFillMode: 'both' }}
          >
            <Card className={`glass-card border-0 transition-all duration-300 w-full ${!canAccess('mentorChat') ? 'opacity-60' : 'hover:shadow-2xl hover:shadow-[#45B8AC]/20 hover:-translate-y-0.5'}`}>
              <Link href={canAccess('mentorChat') ? "/mentra" : "/pricing"} className="block rounded-lg">
                <CardHeader className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left p-5 sm:p-6">
                  <div className="bg-gradient-to-br from-[#45B8AC]/20 to-[#45B8AC]/5 border border-[#45B8AC]/20 p-4 rounded-2xl flex-shrink-0">
                    <MentraIcon className="h-10 w-10 text-[#45B8AC]" isAnimated={canAccess('mentorChat')} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <CardTitle className="text-2xl">Chat with Mentra</CardTitle>
                      {!canAccess('mentorChat') && (
                        <Badge variant="outline" className="border-amber-400 text-amber-400 gap-1 text-xs">
                          <Lock className="h-3 w-3" /> Pro+
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Get instant guidance on your career, help writing professional content, and more from your personal AI mentor.
                    </p>
                    {!canAccess('mentorChat') && (
                      <p className="text-xs text-amber-400 mt-1 font-medium">Available on Pro and Ultra Pro plans.</p>
                    )}
                  </div>
                  <Button variant="ghost" className="shrink-0 mt-4 md:mt-0 border border-border/50" disabled={!canAccess('mentorChat')}>
                    {canAccess('mentorChat')
                      ? <><Sparkles className="mr-2 h-4 w-4 text-[#45B8AC]" /> Start Chatting</>
                      : <><Lock className="mr-2 h-4 w-4" /> Upgrade to Unlock</>
                    }
                  </Button>
                </CardHeader>
              </Link>
            </Card>
          </div>

          {/* Tool Cards Grid */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              Your Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <ToolCard href="/resume-builder" icon={FileText} title="AI Resume Editor" description="Create from scratch or enhance your resume with AI-powered suggestions." actionText="Open Editor" color="primary" delay={320} />
              <ToolCard href="/resume-analyzer" icon={SearchCheck} title="AI Resume ATS Checker" description="Scan your resume against a job description to check for ATS-friendliness." actionText="Analyze Resume" color="secondary" delay={380} />
              <ToolCard href="/cover-letter-generator" icon={NotebookPen} title="AI Cover Letter Generator" description="Create a professional cover letter tailored to any job description in seconds." actionText="Create Letter" color="primary" delay={440} />
              <ToolCard href="/interview-prep" icon={MessageCircleQuestion} title="AI Interview Assister" description="Practice common interview questions and get AI-powered feedback." actionText="Start Practice" color="secondary" locked={!canAccess('interviewPrep')} delay={500} />
              <ToolCard href="/aptitude-test" icon={BrainCircuit} title="Aptitude Test" description="Take a timed test with unique questions to sharpen your skills for interviews." actionText="Start Test" color="primary" locked={!canAccess('aptitudeTests')} delay={560} />
              <ToolCard href="/build" icon={LayoutTemplate} title="AI Portfolio Generator" description="Instantly transform your resume into a stunning portfolio website." actionText="Create Portfolio" color="secondary" delay={620} />
            </div>
          </div>

          {/* Saved Work Tabs */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '350ms', animationFillMode: 'both' }}
          >
            <Card className="glass-card shadow-lg overflow-hidden">
              <Tabs defaultValue="resumes" className="flex-col">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div>
                      <CardTitle className="text-xl">Your Saved Work</CardTitle>
                      <CardDescription className="mt-1">Manage your resumes, portfolios, cover letters, and ATS checks.</CardDescription>
                    </div>
                    <TabsList className="grid grid-cols-4 w-full sm:w-auto bg-muted/60 p-1 rounded-xl gap-1">
                      <TabsTrigger value="resumes" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">Resumes</TabsTrigger>
                      <TabsTrigger value="portfolios" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">Portfolios</TabsTrigger>
                      <TabsTrigger value="coverletters" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">Cover Letters</TabsTrigger>
                      <TabsTrigger value="atschecks" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">ATS Checks</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>

                <CardContent className="pt-5">
                  <TabsContent value="resumes" className="space-y-4 mt-0">
                    {isResumeLoading ? (
                      <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                    ) : resumes.length > 0 ? (
                      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {resumes.map((r, idx) => {
                          const hasBeenEdited = (r.chatHistory?.length || 0) > 0;
                          const showOriginalPdf = r.initialPreviewUri && !hasBeenEdited;
                          return (
                            <li
                              key={r.id}
                              className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/60 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3 overflow-hidden flex-grow cursor-pointer" onClick={() => router.push(`/resume-builder/editor?id=${r.id}`)}>
                                <div className="w-12 h-16 rounded-lg border border-border/50 bg-white flex-shrink-0 overflow-hidden relative shadow-sm">
                                  {showOriginalPdf ? (
                                    <iframe src={`${r.initialPreviewUri}#toolbar=0&navpanes=0`} className="w-full h-full border-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'scale(0.1)', width: '1000%', height: '1000%', transformOrigin: 'center center' }} title="Original Resume Preview" />
                                  ) : (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'scale(0.08) translate(-50%, -50%)', transformOrigin: 'top left' }} dangerouslySetInnerHTML={{ __html: r.htmlContent || '' }} />
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{r.fileName || 'Untitled Resume'}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {r.lastModified ? (typeof r.lastModified === 'string' ? new Date(r.lastModified).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : r.lastModified.toDate().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center flex-shrink-0 ml-3 gap-1">
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-primary/15 hover:bg-primary/30 border border-primary/20" onClick={() => router.push(`/resume-builder/editor?id=${r.id}`)}><Edit className="h-3.5 w-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent><p>Edit Resume</p></TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'resume', id: r.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete Resume</p></TooltipContent></Tooltip></TooltipProvider>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-center p-10 rounded-xl bg-muted/20 border border-dashed border-border/50">
                        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <CardTitle className="text-base font-semibold text-muted-foreground">No Saved Resumes</CardTitle>
                        <CardDescription className="mt-1 mb-0">You haven&apos;t started editing a resume yet.</CardDescription>
                      </div>
                    )}
                    <div className="pt-4 border-t border-border/40">
                      <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full"><Button onClick={() => handleStartNew('resume')} className="w-full" disabled={maxResumes !== 'unlimited' && resumes.length >= maxResumes}><PlusCircle className="mr-2 h-4 w-4" /> Create New Resume</Button></div></TooltipTrigger>{maxResumes !== 'unlimited' && resumes.length >= maxResumes && (<TooltipContent><p>You have reached the {plan.name} plan limit of {maxResumes} resumes. <Link href="/pricing" className="underline">Upgrade</Link> for more.</p></TooltipContent>)}</Tooltip></TooltipProvider>
                    </div>
                  </TabsContent>

                  <TabsContent value="portfolios" className="space-y-4 mt-0">
                    {isPortfolioLoading ? (
                      <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                    ) : portfolios.length > 0 ? (
                      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {portfolios.map((p, idx) => (
                          <li key={p.id} className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/60 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#45B8AC]/5 transition-all duration-200">
                            <div className="flex items-center gap-3 overflow-hidden flex-grow cursor-pointer" onClick={() => router.push(`/portfolio/edit/${p.id}`)}>
                              <div className="h-12 w-16 rounded-lg border border-border/50 bg-white flex-shrink-0 overflow-hidden relative shadow-sm">
                                <TemplatePreview portfolioData={p} templateId={p.templateId || 'classic'} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate group-hover:text-[#45B8AC] transition-colors">{p.title || 'Untitled Portfolio'}</p>
                                <p className="text-xs text-muted-foreground truncate">{p.personalInfo?.title || 'No title'}</p>
                              </div>
                            </div>
                            <div className="flex items-center flex-shrink-0 ml-3 gap-1">
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-[#45B8AC]/15 hover:bg-[#45B8AC]/30 border border-[#45B8AC]/20" asChild><Link href={`/portfolio?id=${p.id}`}><Eye className="h-3.5 w-3.5 text-[#45B8AC]" /></Link></Button></TooltipTrigger><TooltipContent><p>View Portfolio</p></TooltipContent></Tooltip></TooltipProvider>
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-primary/15 hover:bg-primary/30 border border-primary/20" onClick={() => router.push(`/portfolio/edit/${p.id}`)}><Edit className="h-3.5 w-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent><p>Edit Portfolio</p></TooltipContent></Tooltip></TooltipProvider>
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'portfolio', id: p.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete Portfolio</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center p-10 rounded-xl bg-muted/20 border border-dashed border-border/50">
                        <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <CardTitle className="text-base font-semibold text-muted-foreground">No Portfolios Yet</CardTitle>
                        <CardDescription className="mt-1">You haven&apos;t created a portfolio.</CardDescription>
                      </div>
                    )}
                    <div className="pt-4 border-t border-border/40">
                      <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full"><Button asChild className="w-full" disabled={maxPortfolios !== 'unlimited' && portfolios.length >= maxPortfolios}><Link href="/build"><PlusCircle className="mr-2 h-4 w-4" /> Create New Portfolio</Link></Button></div></TooltipTrigger>{maxPortfolios !== 'unlimited' && portfolios.length >= maxPortfolios && (<TooltipContent><p>You have reached the {plan.name} plan limit of {maxPortfolios} portfolios. <Link href="/pricing" className="underline">Upgrade</Link> for more.</p></TooltipContent>)}</Tooltip></TooltipProvider>
                    </div>
                  </TabsContent>

                  <TabsContent value="coverletters" className="space-y-4 mt-0">
                    {isCoverLetterLoading ? (
                      <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                    ) : coverLetters.length > 0 ? (
                      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {coverLetters.map((cl, idx) => (
                          <li key={cl.id} className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/60 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                            <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-grow" onClick={() => router.push(`/cover-letter-generator?id=${cl.id}`)}>
                              <div className="flex-shrink-0 bg-primary/10 border border-primary/20 p-2.5 rounded-xl">
                                <NotebookPen className="h-4 w-4 text-primary" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{cl.title || 'Untitled Cover Letter'}</p>
                                <p className="text-xs text-muted-foreground truncate">For: {cl.companyName} · {cl.lastModified ? (typeof cl.lastModified === 'string' ? new Date(cl.lastModified).toLocaleDateString() : cl.lastModified.toDate().toLocaleDateString()) : 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center flex-shrink-0 ml-3 gap-1">
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-primary/15 hover:bg-primary/30 border border-primary/20" onClick={() => router.push(`/cover-letter-generator?id=${cl.id}`)}><Edit className="h-3.5 w-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent><p>Edit Cover Letter</p></TooltipContent></Tooltip></TooltipProvider>
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'coverletter', id: cl.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete Cover Letter</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center p-10 rounded-xl bg-muted/20 border border-dashed border-border/50">
                        <NotebookPen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <CardTitle className="text-base font-semibold text-muted-foreground">No Saved Cover Letters</CardTitle>
                        <CardDescription className="mt-1">You haven&apos;t created a cover letter yet.</CardDescription>
                      </div>
                    )}
                    <div className="pt-4 border-t border-border/40">
                      <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full"><Button onClick={() => handleStartNew('coverletter')} className="w-full" disabled={maxCoverLetters !== 'unlimited' && coverLetters.length >= maxCoverLetters}><PlusCircle className="mr-2 h-4 w-4" /> Create New Cover Letter</Button></div></TooltipTrigger>{maxCoverLetters !== 'unlimited' && coverLetters.length >= maxCoverLetters && (<TooltipContent><p>You have reached the {plan.name} plan limit of {maxCoverLetters} cover letters. <Link href="/pricing" className="underline">Upgrade</Link> for more.</p></TooltipContent>)}</Tooltip></TooltipProvider>
                    </div>
                  </TabsContent>

                  <TabsContent value="atschecks" className="space-y-4 mt-0">
                    {isResumeCheckLoading ? (
                      <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                    ) : resumeChecks.length > 0 ? (
                      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {resumeChecks.map((rc, idx) => (
                          <li key={rc.id} className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/60 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#45B8AC]/5 transition-all duration-200">
                            <div className="flex items-center gap-3 overflow-hidden flex-grow">
                              <div className={`flex-shrink-0 p-2.5 rounded-xl border ${rc.isAtsFriendly ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                {rc.isAtsFriendly ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                              </div>
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm truncate">{rc.resumeFileName || 'Resume'}</p>
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rc.isAtsFriendly ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{rc.atsFriendlinessScore}%</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{rc.atsSummary}</p>
                                <p className="text-xs text-muted-foreground/60">{rc.createdAt ? (typeof rc.createdAt === 'string' ? new Date(rc.createdAt).toLocaleDateString() : (rc.createdAt as any).toDate().toLocaleDateString()) : 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center flex-shrink-0 ml-3 gap-1">
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'resumecheck', id: rc.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete ATS Check</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center p-10 rounded-xl bg-muted/20 border border-dashed border-border/50">
                        <SearchCheck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <CardTitle className="text-base font-semibold text-muted-foreground">No ATS Checks Yet</CardTitle>
                        <CardDescription className="mt-1">You haven&apos;t run an ATS check yet.</CardDescription>
                      </div>
                    )}
                    <div className="pt-4 border-t border-border/40">
                      <Button asChild className="w-full bg-[#45B8AC] hover:bg-[#3aa99e] text-white">
                        <Link href="/resume-analyzer"><SearchCheck className="mr-2 h-4 w-4" /> Run New ATS Check</Link>
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
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

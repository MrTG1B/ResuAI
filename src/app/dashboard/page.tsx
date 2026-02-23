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
import { FileText, LayoutTemplate, ArrowRight, SearchCheck, Edit, Eye, PlusCircle, Trash2, ShieldAlert, Sparkles, NotebookPen, MessageCircleQuestion, BrainCircuit, CheckCircle2, XCircle, Lock, Rocket, TrendingUp, Gift, Menu, X, Home, User as UserIcon, CreditCard } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<'overview' | 'resumes' | 'portfolios' | 'coverletters' | 'atschecks'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    if (names.length === 1 && names[0].length >= 2) return `${names[0][0]}${names[0][1]}`.toUpperCase();
    return (name[0] || '').toUpperCase();
  };

  const HEADER_HEIGHT = '57px';

  const formatSectionName = (section: string) => {
    const names: Record<string, string> = {
      overview: 'Dashboard',
      resumes: 'Resumes',
      portfolios: 'Portfolios',
      coverletters: 'Cover Letters',
      atschecks: 'ATS Checks',
    };
    return names[section] ?? section;
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

  const sidebarItems = {
    myWork: [
      { key: 'resumes' as const, icon: FileText, label: 'Resumes', count: resumes.length, loading: isResumeLoading, accentColor: 'text-primary', activeBg: 'bg-primary/15', activeBadge: 'bg-primary/20 text-primary' },
      { key: 'portfolios' as const, icon: LayoutTemplate, label: 'Portfolios', count: portfolios.length, loading: isPortfolioLoading, accentColor: 'text-[#45B8AC]', activeBg: 'bg-[#45B8AC]/15', activeBadge: 'bg-[#45B8AC]/20 text-[#45B8AC]' },
      { key: 'coverletters' as const, icon: NotebookPen, label: 'Cover Letters', count: coverLetters.length, loading: isCoverLetterLoading, accentColor: 'text-violet-400', activeBg: 'bg-violet-500/15', activeBadge: 'bg-violet-500/20 text-violet-400' },
      { key: 'atschecks' as const, icon: SearchCheck, label: 'ATS Checks', count: resumeChecks.length, loading: isResumeCheckLoading, accentColor: 'text-blue-400', activeBg: 'bg-blue-500/15', activeBadge: 'bg-blue-500/20 text-blue-400' },
    ],
    tools: [
      { href: '/resume-builder', icon: FileText, label: 'Resume Editor', locked: false, color: 'primary' as const },
      { href: '/resume-analyzer', icon: SearchCheck, label: 'ATS Checker', locked: false, color: 'secondary' as const },
      { href: '/cover-letter-generator', icon: NotebookPen, label: 'Cover Letter', locked: false, color: 'primary' as const },
      { href: '/interview-prep', icon: MessageCircleQuestion, label: 'Interview Prep', locked: !canAccess('interviewPrep'), color: 'secondary' as const },
      { href: '/aptitude-test', icon: BrainCircuit, label: 'Aptitude Test', locked: !canAccess('aptitudeTests'), color: 'primary' as const },
      { href: '/build', icon: LayoutTemplate, label: 'Portfolio Gen', locked: false, color: 'secondary' as const },
    ],
  };

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* User info */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
            {getInitials(user.displayName) || <UserIcon className="h-4 w-4" />}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-semibold text-sm truncate leading-tight">{user.displayName || user.email}</p>
            <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 mt-0.5 ${PLAN_BADGE_COLORS[planId] ?? PLAN_BADGE_COLORS.free}`}>
              ✦ {plan.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Overview */}
        <button
          onClick={() => { setActiveSection('overview'); onNav?.(); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === 'overview' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          Overview
        </button>

        {/* AI Tools */}
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground/50 px-3 mb-2 tracking-widest">AI Tools</p>
          <div className="space-y-0.5">
            {sidebarItems.tools.map(tool => (
              <Link
                key={tool.href}
                href={tool.locked ? '/pricing' : tool.href}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group ${tool.locked ? 'text-muted-foreground/40 cursor-default' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-3">
                  <tool.icon className="h-4 w-4 flex-shrink-0" />
                  {tool.label}
                </div>
                {tool.locked ? (
                  <Lock className="h-3 w-3 text-amber-500/60 flex-shrink-0" />
                ) : (
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* My Work */}
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground/50 px-3 mb-2 tracking-widest">My Work</p>
          <div className="space-y-0.5">
            {sidebarItems.myWork.map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveSection(item.key); onNav?.(); }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === item.key ? `${item.activeBg} ${item.accentColor}` : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </div>
                {item.loading ? (
                  <span className="h-4 w-4 bg-muted/60 rounded-full animate-pulse flex-shrink-0" />
                ) : (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0 ${activeSection === item.key ? item.activeBadge : 'bg-muted/80 text-muted-foreground'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom links */}
      <div className="p-3 border-t border-border/50 space-y-0.5">
        <Link
          href={canAccess('mentorChat') ? '/mentra' : '/pricing'}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${canAccess('mentorChat') ? 'text-[#45B8AC] hover:bg-[#45B8AC]/10' : 'text-muted-foreground/40'}`}
        >
          <MentraIcon className="h-4 w-4 flex-shrink-0" isAnimated={canAccess('mentorChat')} />
          Chat with Mentra
          {!canAccess('mentorChat') && <Lock className="h-3 w-3 ml-auto text-amber-500/60 flex-shrink-0" />}
        </Link>
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
          <UserIcon className="h-4 w-4 flex-shrink-0" />
          Profile
        </Link>
        <Link href="/pricing" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
          <CreditCard className="h-4 w-4 flex-shrink-0" />
          Plans &amp; Pricing
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="dot-grid fixed inset-0 pointer-events-none opacity-60" />
      <Header />

      <div className="flex flex-1 relative z-10">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/40 glass-card sticky self-start z-30 overflow-hidden"
          style={{ top: HEADER_HEIGHT, height: `calc(100vh - ${HEADER_HEIGHT})` }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed left-0 top-0 h-full w-72 glass-card border-r border-border/50 z-50 animate-slide-in-left">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <span className="font-semibold text-sm">Navigation</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ height: `calc(100% - ${HEADER_HEIGHT})` }}>
                <SidebarContent onNav={() => setSidebarOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        {/* Main content + Footer wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

              {/* Mobile topbar */}
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl glass-card border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {formatSectionName(activeSection)}
                </span>
              </div>

              {/* ── Hero Section (always visible) ── */}
              <div
                className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 p-6 md:p-8 animate-fade-in-down"
                style={{ animationFillMode: 'both' }}
              >
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl animate-float pointer-events-none" />
                <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-[#45B8AC]/10 blur-3xl animate-pulse-glow pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold px-2.5 py-0.5 ${PLAN_BADGE_COLORS[planId] ?? PLAN_BADGE_COLORS.free}`}
                    >
                      ✦ {plan.name} Plan
                    </Badge>
                    {planId === 'free' && (
                      <Link href="/pricing" className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors">
                        🔓 Upgrade for more
                      </Link>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight">
                    Welcome back,{' '}
                    <span className="shimmer-text">{user.displayName || 'Creator'}</span>!
                  </h1>
                  <p className="mt-2 text-base text-muted-foreground max-w-lg animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                    Your career toolkit is ready. Let&apos;s build something amazing today.
                  </p>
                </div>
              </div>

              {/* ── Overview section ── */}
              {activeSection === 'overview' && (
                <div className="space-y-6 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {[
                      { label: 'Resumes', count: resumes.length, loading: isResumeLoading, icon: FileText, color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', iconColor: 'text-primary', iconBg: 'bg-primary/10', onClick: () => setActiveSection('resumes') },
                      { label: 'Portfolios', count: portfolios.length, loading: isPortfolioLoading, icon: LayoutTemplate, color: 'from-[#45B8AC]/20 to-[#45B8AC]/5', border: 'border-[#45B8AC]/20', iconColor: 'text-[#45B8AC]', iconBg: 'bg-[#45B8AC]/10', onClick: () => setActiveSection('portfolios') },
                      { label: 'Cover Letters', count: coverLetters.length, loading: isCoverLetterLoading, icon: NotebookPen, color: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/20', iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10', onClick: () => setActiveSection('coverletters') },
                      { label: 'ATS Checks', count: resumeChecks.length, loading: isResumeCheckLoading, icon: SearchCheck, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', onClick: () => setActiveSection('atschecks') },
                    ].map((stat, i) => (
                      <div key={stat.label} className="animate-scale-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                        <Card
                          onClick={stat.onClick}
                          className={`glass-card relative overflow-hidden border ${stat.border} bg-gradient-to-br ${stat.color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${stat.iconBg} flex-shrink-0`}>
                              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                            </div>
                            <div>
                              <p className="text-2xl font-bold font-heading leading-none">
                                {stat.loading ? <span className="inline-block w-5 h-5 bg-muted/60 rounded animate-pulse" /> : stat.count}
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
                    <Alert variant="destructive">
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

                  {/* Profile Completion */}
                  {profileCompletion < 100 && (
                    <div className="animated-border-glow">
                      <Card className="glass-card border-0 overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Complete Your Profile
                              </CardTitle>
                              <CardDescription className="mt-0.5 text-xs">A complete profile helps our AI craft better results.</CardDescription>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-2xl font-bold font-heading shimmer-text">{profileCompletion}%</span>
                              <p className="text-[10px] text-muted-foreground">complete</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Progress value={profileCompletion} className="h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-primary via-[#45B8AC] to-violet-400" />
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button asChild size="sm"><Link href="/profile">Update Profile <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}

                  {/* Upgrade Banner */}
                  {(planId === 'free' || planId === 'medium') && (
                    <div className="animated-border-glow">
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 p-5 md:p-6">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative flex flex-col sm:flex-row items-center gap-4">
                          <div className="shrink-0 bg-white/15 p-3 rounded-2xl">
                            <Rocket className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
                              <Gift className="h-3 w-3" />
                              {planId === 'free' ? 'Unlock Your Full Potential' : 'Level Up to Pro'}
                            </span>
                            <h2 className="text-lg font-extrabold text-white leading-tight">
                              {planId === 'free' ? "You're on the Free plan — just getting started!" : 'Ready for unlimited power? Go Pro!'}
                            </h2>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 justify-center sm:justify-start text-xs text-white/70">
                              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> 5× more AI requests</span>
                              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Interview Prep &amp; Tests</span>
                              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-white/60" /> Mentra AI Chat</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Button asChild size="sm" className="bg-white text-violet-700 hover:bg-white/90 font-bold shadow-lg whitespace-nowrap">
                              <Link href="/pricing"><Sparkles className="mr-2 h-3.5 w-3.5" />{planId === 'free' ? 'Upgrade Now' : 'Go Pro'}</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tools Grid */}
                  <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Your AI Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      <ToolCard href="/resume-builder" icon={FileText} title="AI Resume Editor" description="Create or enhance your resume with AI-powered suggestions." actionText="Open Editor" color="primary" delay={80} />
                      <ToolCard href="/resume-analyzer" icon={SearchCheck} title="AI ATS Checker" description="Scan your resume against a job description for ATS compatibility." actionText="Analyze Resume" color="secondary" delay={140} />
                      <ToolCard href="/cover-letter-generator" icon={NotebookPen} title="Cover Letter Gen" description="Create a professional cover letter tailored to any job in seconds." actionText="Create Letter" color="primary" delay={200} />
                      <ToolCard href="/interview-prep" icon={MessageCircleQuestion} title="Interview Assister" description="Practice interview questions and get AI-powered feedback." actionText="Start Practice" color="secondary" locked={!canAccess('interviewPrep')} delay={260} />
                      <ToolCard href="/aptitude-test" icon={BrainCircuit} title="Aptitude Test" description="Take a timed test to sharpen your skills for interviews." actionText="Start Test" color="primary" locked={!canAccess('aptitudeTests')} delay={320} />
                      <ToolCard href="/build" icon={LayoutTemplate} title="Portfolio Generator" description="Transform your resume into a stunning portfolio website." actionText="Create Portfolio" color="secondary" delay={380} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Resumes section ── */}
              {activeSection === 'resumes' && (
                <div className="space-y-4 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">My Resumes</h2>
                      <p className="text-sm text-muted-foreground">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    <TooltipProvider><Tooltip>
                      <TooltipTrigger asChild>
                        <div><Button onClick={() => handleStartNew('resume')} disabled={maxResumes !== 'unlimited' && resumes.length >= maxResumes}><PlusCircle className="mr-2 h-4 w-4" />New Resume</Button></div>
                      </TooltipTrigger>
                      {maxResumes !== 'unlimited' && resumes.length >= maxResumes && <TooltipContent><p>Plan limit reached ({maxResumes}). <Link href="/pricing" className="underline">Upgrade</Link></p></TooltipContent>}
                    </Tooltip></TooltipProvider>
                  </div>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      {isResumeLoading ? (
                        <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                      ) : resumes.length > 0 ? (
                        <ul className="space-y-2">
                          {resumes.map(r => {
                            const hasBeenEdited = (r.chatHistory?.length || 0) > 0;
                            const showOriginalPdf = r.initialPreviewUri && !hasBeenEdited;
                            return (
                              <li key={r.id} className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/60 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
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
                                    <p className="text-xs text-muted-foreground truncate">{r.lastModified ? (typeof r.lastModified === 'string' ? new Date(r.lastModified).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : r.lastModified.toDate().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center flex-shrink-0 ml-3 gap-1">
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-primary/15 hover:bg-primary/30 border border-primary/20" onClick={() => router.push(`/resume-builder/editor?id=${r.id}`)}><Edit className="h-3.5 w-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent><p>Edit</p></TooltipContent></Tooltip></TooltipProvider>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'resume', id: r.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip></TooltipProvider>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-center py-12 rounded-xl bg-muted/20 border border-dashed border-border/50">
                          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="font-semibold text-muted-foreground">No Saved Resumes</p>
                          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">You haven&apos;t started editing a resume yet.</p>
                          <Button onClick={() => handleStartNew('resume')} size="sm"><PlusCircle className="mr-2 h-4 w-4" />Create Your First Resume</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Portfolios section ── */}
              {activeSection === 'portfolios' && (
                <div className="space-y-4 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">My Portfolios</h2>
                      <p className="text-sm text-muted-foreground">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    <TooltipProvider><Tooltip>
                      <TooltipTrigger asChild>
                        <div><Button asChild disabled={maxPortfolios !== 'unlimited' && portfolios.length >= maxPortfolios}><Link href="/build"><PlusCircle className="mr-2 h-4 w-4" />New Portfolio</Link></Button></div>
                      </TooltipTrigger>
                      {maxPortfolios !== 'unlimited' && portfolios.length >= maxPortfolios && <TooltipContent><p>Plan limit reached ({maxPortfolios}). <Link href="/pricing" className="underline">Upgrade</Link></p></TooltipContent>}
                    </Tooltip></TooltipProvider>
                  </div>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      {isPortfolioLoading ? (
                        <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                      ) : portfolios.length > 0 ? (
                        <ul className="space-y-2">
                          {portfolios.map(p => (
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
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-[#45B8AC]/15 hover:bg-[#45B8AC]/30 border border-[#45B8AC]/20" asChild><Link href={`/portfolio?id=${p.id}`}><Eye className="h-3.5 w-3.5 text-[#45B8AC]" /></Link></Button></TooltipTrigger><TooltipContent><p>View</p></TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-primary/15 hover:bg-primary/30 border border-primary/20" onClick={() => router.push(`/portfolio/edit/${p.id}`)}><Edit className="h-3.5 w-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent><p>Edit</p></TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'portfolio', id: p.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip></TooltipProvider>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-12 rounded-xl bg-muted/20 border border-dashed border-border/50">
                          <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="font-semibold text-muted-foreground">No Portfolios Yet</p>
                          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">You haven&apos;t created a portfolio.</p>
                          <Button asChild size="sm"><Link href="/build"><PlusCircle className="mr-2 h-4 w-4" />Create Your First Portfolio</Link></Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Cover Letters section ── */}
              {activeSection === 'coverletters' && (
                <div className="space-y-4 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">My Cover Letters</h2>
                      <p className="text-sm text-muted-foreground">{coverLetters.length} cover letter{coverLetters.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    <TooltipProvider><Tooltip>
                      <TooltipTrigger asChild>
                        <div><Button onClick={() => handleStartNew('coverletter')} disabled={maxCoverLetters !== 'unlimited' && coverLetters.length >= maxCoverLetters}><PlusCircle className="mr-2 h-4 w-4" />New Cover Letter</Button></div>
                      </TooltipTrigger>
                      {maxCoverLetters !== 'unlimited' && coverLetters.length >= maxCoverLetters && <TooltipContent><p>Plan limit reached ({maxCoverLetters}). <Link href="/pricing" className="underline">Upgrade</Link></p></TooltipContent>}
                    </Tooltip></TooltipProvider>
                  </div>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      {isCoverLetterLoading ? (
                        <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                      ) : coverLetters.length > 0 ? (
                        <ul className="space-y-2">
                          {coverLetters.map(cl => (
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
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-8 w-8 bg-primary/15 hover:bg-primary/30 border border-primary/20" onClick={() => router.push(`/cover-letter-generator?id=${cl.id}`)}><Edit className="h-3.5 w-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent><p>Edit</p></TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'coverletter', id: cl.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip></TooltipProvider>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-12 rounded-xl bg-muted/20 border border-dashed border-border/50">
                          <NotebookPen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="font-semibold text-muted-foreground">No Saved Cover Letters</p>
                          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">You haven&apos;t created a cover letter yet.</p>
                          <Button onClick={() => handleStartNew('coverletter')} size="sm"><PlusCircle className="mr-2 h-4 w-4" />Create Your First Cover Letter</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── ATS Checks section ── */}
              {activeSection === 'atschecks' && (
                <div className="space-y-4 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">My ATS Checks</h2>
                      <p className="text-sm text-muted-foreground">{resumeChecks.length} check{resumeChecks.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    <Button asChild className="bg-[#45B8AC] hover:bg-[#3aa99e] text-white">
                      <Link href="/resume-analyzer"><SearchCheck className="mr-2 h-4 w-4" />Run New Check</Link>
                    </Button>
                  </div>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      {isResumeCheckLoading ? (
                        <div className="flex items-center justify-center min-h-[200px]"><BrandLoader /></div>
                      ) : resumeChecks.length > 0 ? (
                        <ul className="space-y-2">
                          {resumeChecks.map(rc => (
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
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: 'resumecheck', id: rc.id })}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip></TooltipProvider>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-12 rounded-xl bg-muted/20 border border-dashed border-border/50">
                          <SearchCheck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="font-semibold text-muted-foreground">No ATS Checks Yet</p>
                          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">You haven&apos;t run an ATS check yet.</p>
                          <Button asChild size="sm" className="bg-[#45B8AC] hover:bg-[#3aa99e] text-white"><Link href="/resume-analyzer"><SearchCheck className="mr-2 h-4 w-4" />Run Your First ATS Check</Link></Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          </main>
          <Footer />
        </div>
      </div>

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

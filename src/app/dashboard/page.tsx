
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, getDoc, doc, collection, getDocs, query, orderBy } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, FileText, LayoutTemplate, ArrowRight, SearchCheck, Edit, Eye, PlusCircle } from 'lucide-react';
import { type SavedEditorState } from '@/types/resume';
import { type PortfolioData } from '@/types/portfolio';
import Image from 'next/image';

function SavedItemSkeleton({ title, description }: { title: string, description: string }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center bg-muted/50 rounded-md m-6 mt-0 min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
}

function ToolCard({ href, icon: Icon, title, description, actionText }: { href: string, icon: React.ElementType, title: string, description: string, actionText: string }) {
    return (
        <Card className="shadow-lg hover:shadow-primary/10 transition-shadow duration-300 flex flex-col">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="bg-primary/10 p-3 rounded-lg">
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


export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [savedResume, setSavedResume] = useState<SavedEditorState | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);


  useEffect(() => {
    if (!auth) {
      router.push('/login');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Fetch resume
        try {
            const resumeDoc = await getDoc(doc(db, "resumeEditorState", user.uid));
            if (resumeDoc.exists()) {
                setSavedResume(resumeDoc.data() as SavedEditorState);
            }
        } catch (error) {
            console.error("Failed to fetch saved resume:", error);
        } finally {
            setIsResumeLoading(false);
        }
        
        // Fetch portfolios
        try {
            const q = query(collection(db, `users/${user.uid}/portfolios`), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const userPortfolios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioData));
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

  const handleContinueEditing = () => {
    if (savedResume) {
        sessionStorage.setItem('resumeEditorState', JSON.stringify(savedResume));
        router.push('/resume-builder/editor');
    }
  };

  const handleStartNew = () => {
    sessionStorage.removeItem('resumeEditorState');
    router.push('/resume-builder/editor');
  }

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
                    Let's build something amazing today.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                        <ToolCard 
                            href="/resume-builder/editor"
                            icon={FileText}
                            title="AI Resume Editor"
                            description="Upload and enhance your resume with AI-powered suggestions and formatting."
                            actionText="Start Editing"
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
                    
                    {isResumeLoading ? (
                        <SavedItemSkeleton title="Your Saved Resume" description="Loading your last editing session..."/>
                    ) : savedResume ? (
                        <Card className="flex flex-col shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <CardHeader>
                                <CardTitle>Your Saved Resume</CardTitle>
                                <CardDescription>Continue where you left off or start a new resume.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow m-6 mt-0">
                               <div className="w-full h-[350px] overflow-hidden rounded-md border bg-white flex justify-center items-start">
                                    <div
                                        className="text-black shadow-lg scale-[0.3] origin-top"
                                        style={{
                                            width: '8.27in',
                                            height: '11.69in',
                                            aspectRatio: '1 / 1.414',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: savedResume.htmlContent || '' }}
                                    />
                               </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleStartNew}>Start New</Button>
                                <Button onClick={handleContinueEditing}><Edit className="mr-2 h-4 w-4" /> Continue Editing</Button>
                            </CardFooter>
                        </Card>
                    ) : (
                         <Card className="flex flex-col items-center justify-center text-center shadow-lg animate-fade-in-up p-8 min-h-[200px]" style={{ animationDelay: '200ms' }}>
                            <CardTitle>No Saved Resume</CardTitle>
                            <CardDescription className="mt-2 mb-4">You haven't saved a resume editing session yet.</CardDescription>
                            <Button onClick={handleStartNew}>
                                <Edit className="mr-2 h-4 w-4" /> Create a New Resume
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Right Sidebar Column */}
                <div className="space-y-8">
                     <Card className="flex flex-col shadow-lg animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <CardHeader>
                            <CardTitle>Your Portfolios</CardTitle>
                            <CardDescription>View, edit, and share your generated portfolios.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            {isPortfolioLoading ? (
                                <div className="flex items-center justify-center min-h-[100px]">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : portfolios.length > 0 ? (
                                <ul className="space-y-3">
                                    {portfolios.map(p => (
                                        <li key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className='flex items-center gap-3'>
                                                <Image 
                                                    src={p.personalInfo?.profilePictureDataUri || 'https://placehold.co/40x40.png'} 
                                                    alt="avatar" 
                                                    width={40} height={40} 
                                                    className="rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-semibold text-sm">{p.title || "Untitled Portfolio"}</p>
                                                    <p className="text-xs text-muted-foreground">{p.personalInfo?.title || 'No title'}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/portfolio?id=${p.id}`}>
                                                    <Eye className="mr-2 h-4 w-4"/>
                                                    View
                                                </Link>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">You haven't created any portfolios yet.</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/build"><PlusCircle className="mr-2 h-4 w-4" /> Create New Portfolio</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="flex flex-col shadow-lg animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <CardHeader>
                            <CardTitle>Career Hub</CardTitle>
                            <CardDescription>Learn more about us and our mission.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">Discover how our AI tools can help you accelerate your career journey and stand out to recruiters.</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" asChild>
                                <Link href="/about">About ResuAI</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

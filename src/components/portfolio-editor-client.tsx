

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, getDoc, doc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { BrandLoader } from '@/components/brand-loader';
import { type PortfolioData } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Shapes, Image as ImageIcon, Type, Bot, LayoutDashboard, FolderKanban, UploadCloud, Wrench, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EditorToolbarButton = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center justify-center h-16 w-full rounded-none p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                    <Icon className="h-6 w-6" />
                    <span className="text-xs mt-1">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);


function PortfolioEditorClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const portfolioId = params.id as string;
    if (!portfolioId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docRef = doc(db, 'users', user.uid, 'portfolios', portfolioId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setPortfolio({ id: docSnap.id, ...docSnap.data() } as PortfolioData);
          } else {
            setNotFound(true);
            toast({ title: 'Not Found', description: 'This portfolio does not exist or you do not have permission to edit it.', variant: 'destructive' });
          }
        } catch (error) {
          console.error('Error fetching portfolio:', error);
          toast({ title: 'Error', description: 'Failed to load portfolio data.', variant: 'destructive' });
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [params.id, router, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <BrandLoader size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center text-center p-4">
          <div>
            <h1 className="text-4xl font-bold font-heading">Portfolio Not Found</h1>
            <p className="text-muted-foreground mt-2">The portfolio you are trying to edit does not exist.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-6">
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  const editorActions = (
    <div className="flex items-center gap-2">
      <Button onClick={() => router.push(`/portfolio?id=${params.id}`)} variant="outline">
        Exit Editor
      </Button>
    </div>
  );

  return (
      <div className="h-screen w-full flex flex-col bg-muted/40">
        <Header pageActions={editorActions} />
        <div className="flex flex-1 overflow-hidden">
            {/* Left Toolbar */}
            <nav className="w-20 flex-shrink-0 border-r bg-background flex flex-col items-center py-4 space-y-2 overflow-y-auto">
                <EditorToolbarButton icon={LayoutDashboard} label="Design" />
                <EditorToolbarButton icon={Shapes} label="Elements" />
                <EditorToolbarButton icon={Type} label="Text" />
                <EditorToolbarButton icon={UploadCloud} label="Uploads" />
                <EditorToolbarButton icon={Wrench} label="Tools" />
            </nav>

            {/* Main Canvas */}
            <main className="flex-1 p-4 overflow-auto">
              <div className='flex h-full items-center justify-center bg-background rounded-lg border'>
                  <p className='text-muted-foreground'>Portfolio Canvas Area</p>
              </div>
            </main>

            {/* Right AI Panel */}
            <aside className="w-80 flex-col border-l bg-background hidden lg:flex">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold tracking-tight font-heading flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> AI Assistant</h2>
                </div>
                <div className="p-4">
                    <p className="text-sm text-muted-foreground">AI chat panel placeholder.</p>
                </div>
            </aside>
        </div>
      </div>
  );
}

export default PortfolioEditorClient;



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
import { Shapes, Image as ImageIcon, Type, Bot, LayoutDashboard, UploadCloud, Wrench, Grid, Maximize, HelpCircle, BookOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


const EditorToolbarButton = ({ icon: Icon, label, hoverColor }: { icon: React.ElementType; label: string; hoverColor: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    className={cn(
                        "w-full h-16 rounded-md p-1 text-muted-foreground justify-center",
                        "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                        "relative"
                      )}
                >
                     <div className={cn("absolute inset-0 transition-colors duration-200 opacity-0", hoverColor, "group-hover:opacity-100")}></div>
                     <div className="flex flex-col items-center gap-1 relative">
                        <Icon className="h-6 w-6" />
                        <span className="text-xs">{label}</span>
                    </div>
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
  const [zoom, setZoom] = useState(37);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);


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
            <nav className="w-20 flex-shrink-0 border-r bg-background flex flex-col items-center p-2 space-y-2 overflow-y-auto">
                <EditorToolbarButton icon={LayoutDashboard} label="Design" hoverColor="hover:bg-primary/10" />
                <EditorToolbarButton icon={Shapes} label="Elements" hoverColor="hover:bg-[#45B8AC]/10" />
                <EditorToolbarButton icon={Type} label="Text" hoverColor="hover:bg-[#F71B3D]/10" />
                <EditorToolbarButton icon={UploadCloud} label="Uploads" hoverColor="hover:bg-primary/10" />
                <EditorToolbarButton icon={Wrench} label="Tools" hoverColor="hover:bg-[#45B8AC]/10" />
            </nav>

            {/* Main Canvas */}
            <main className="flex-1 p-4 flex flex-col overflow-auto relative">
              <div className='flex-grow h-full flex items-center justify-center bg-background rounded-lg border'>
                  <p className='text-muted-foreground'>Portfolio Canvas Area</p>
              </div>
               
                <footer className="w-full flex-shrink-0 mt-4 p-2 rounded-lg bg-background border flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-1"/> Notes
                        </Button>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-4 max-w-xs">
                        <Slider
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            max={100}
                            step={1}
                            className="w-full"
                        />
                         <span className="text-muted-foreground w-12 text-center">{zoom}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Grid className="h-4 w-4 mr-1"/> Pages: 1 / 1
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Maximize className="h-4 w-4"/></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><HelpCircle className="h-4 w-4"/></Button>
                    </div>
                </footer>
                <Sheet open={isAiPanelOpen} onOpenChange={setIsAiPanelOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute bottom-20 right-6 h-12 w-12 bg-card text-card-foreground rounded-lg shadow-2xl hover:bg-card/90 transition-all group">
                             <div className="absolute inset-0 bg-primary/20 blur-lg transition-all group-hover:bg-primary/30"></div>
                             <div className="absolute inset-0.5 rounded-md bg-card"></div>
                             <div className="relative h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                 <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
                             </div>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0 flex flex-col">
                         <Card className="h-full flex flex-col border-0 rounded-none">
                            <CardHeader className="p-4 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-primary"/> AI Assistant</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-4">
                                <p className="text-sm text-muted-foreground">AI chat panel placeholder.</p>
                            </CardContent>
                        </Card>
                    </SheetContent>
                </Sheet>
            </main>
        </div>
      </div>
  );
}

export default PortfolioEditorClient;

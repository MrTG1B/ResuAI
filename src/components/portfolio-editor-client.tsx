

'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, getDoc, doc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { BrandLoader } from '@/components/brand-loader';
import { type PortfolioData } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Shapes, Image as ImageIcon, Type, Bot, LayoutDashboard, UploadCloud, Wrench, Grid, Maximize, HelpCircle, BookOpen, PanelRightClose, Sparkles, FolderKanban, Search, SlidersHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';


const EditorToolbarButton = ({ icon: Icon, label, hoverColor, onMouseEnter }: { icon: React.ElementType; label: string; hoverColor: string; onMouseEnter: () => void; }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full h-16 rounded-md p-1 text-muted-foreground justify-center transition-colors duration-200",
                        hoverColor
                    )}
                    onMouseEnter={onMouseEnter}
                >
                     <div className="flex flex-col items-center gap-1">
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
  const [activeToolPanel, setActiveToolPanel] = useState<string | null>(null);
  const toolPanelRef = useRef<HTMLDivElement>(null);


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
  
  const tools = [
      { name: 'Design', icon: LayoutDashboard, hover: 'hover:bg-primary/20' },
      { name: 'Elements', icon: Shapes, hover: 'hover:bg-[#45B8AC]/20' },
      { name: 'Text', icon: Type, hover: 'hover:bg-[#F71B3D]/20' },
      { name: 'Uploads', icon: UploadCloud, hover: 'hover:bg-primary/20' },
      { name: 'Projects', icon: FolderKanban, hover: 'hover:bg-[#45B8AC]/20' },
  ];

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Check if the mouse is leaving to a completely unrelated element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveToolPanel(null);
    }
  };

  return (
      <div className="h-screen w-full flex flex-col bg-muted/40 overflow-hidden">
        <Header pageActions={editorActions} />
        <div className="flex flex-1 overflow-hidden" onMouseLeave={handleMouseLeave}>
            {/* Left Toolbar */}
            <nav className="w-20 flex-shrink-0 border-r bg-background flex flex-col items-center p-2 space-y-1 z-20">
                {tools.map(tool => (
                    <EditorToolbarButton key={tool.name} icon={tool.icon} label={tool.name} hoverColor={tool.hover} onMouseEnter={() => setActiveToolPanel(tool.name)} />
                ))}
            </nav>

             {/* Dynamic Tool Panel */}
            <div
                ref={toolPanelRef}
                className={cn(
                    "bg-card border-r shadow-lg transition-transform duration-300 ease-in-out z-10",
                    activeToolPanel ? 'translate-x-0' : '-translate-x-full',
                    "absolute left-20 h-full w-[350px] top-0 bottom-0"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Use 4+ words to describe..." className="pl-10 h-10" />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                         <div className="mt-4 flex justify-around border-b">
                            <Button variant="link" className="text-foreground font-semibold border-b-2 border-primary rounded-none pb-2">Templates</Button>
                            <Button variant="link" className="text-muted-foreground">Layouts</Button>
                            <Button variant="link" className="text-muted-foreground">Styles</Button>
                        </div>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-sm">Recently used</h3>
                                <Button variant="link" size="sm" className="text-muted-foreground">See all</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted h-24 rounded-md"></div>
                                <div className="bg-muted h-24 rounded-md"></div>
                            </div>
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-sm">Premium Templates for You</h3>
                                <Button variant="link" size="sm" className="text-muted-foreground">See all</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted h-24 rounded-md"></div>
                                <div className="bg-muted h-24 rounded-md"></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-2">All results</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted h-24 rounded-md"></div>
                                <div className="bg-muted h-24 rounded-md"></div>
                                <div className="bg-muted h-24 rounded-md"></div>
                                <div className="bg-muted h-24 rounded-md"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Canvas */}
             <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
              <div className='flex-grow h-full flex items-center justify-center bg-background rounded-lg border overflow-auto'>
                  <p className='text-muted-foreground'>Portfolio Canvas Area</p>
              </div>
               
                <footer className="w-full flex-shrink-0 p-2 rounded-lg bg-background border flex items-center justify-between text-sm">
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
            </main>

            {/* Right AI Panel */}
            <aside className={cn(
                "flex-shrink-0 bg-background border-l transition-all duration-300 ease-in-out",
                isAiPanelOpen ? 'w-[350px]' : 'w-16'
            )}>
                {isAiPanelOpen ? (
                     <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-3 border-b h-14">
                             <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Assistant
                            </h3>
                             <Button variant="ghost" size="icon" onClick={() => setIsAiPanelOpen(false)} className="h-8 w-8">
                                <PanelRightClose className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <p className="text-sm text-muted-foreground">AI chat panel placeholder.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setIsAiPanelOpen(true)} className="h-12 w-12 rounded-lg">
                                        <Sparkles className="h-6 w-6 text-primary" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <p>AI Assistant</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </aside>
        </div>
      </div>
  );
}

export default PortfolioEditorClient;

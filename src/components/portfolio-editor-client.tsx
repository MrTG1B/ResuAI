

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, getDoc, doc, updateDoc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { BrandLoader } from '@/components/brand-loader';
import { type PortfolioData, type TemplateId } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Shapes, Type, UploadCloud, LayoutDashboard, FolderKanban, Maximize, HelpCircle, BookOpen, Plus, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PortfolioLivePreview } from '@/components/portfolio-live-preview';
import Image from 'next/image';


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

const templatePreviews = [
    { id: 'classic', name: 'Classic', image: '/previews/classic.png' },
    { id: 'modern', name: 'Modern', image: '/previews/modern.png' },
    { id: 'minimal', name: 'Minimal', image: '/previews/minimal.png' },
    { id: 'creative', name: 'Creative', image: '/previews/creative.png' },
    { id: 'corporate', name: 'Corporate', image: '/previews/corporate.png' },
];


function PortfolioEditorClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [zoom, setZoom] = useState(70);
  const [activeToolPanel, setActiveToolPanel] = useState<string | null>(null);
  const toolPanelContainerRef = useRef<HTMLDivElement>(null);


  const savePortfolio = useCallback(async (data: Partial<PortfolioData>) => {
    if (!currentUser || !params.id) return;
    setIsSaving(true);
    try {
        const portfolioRef = doc(db, 'users', currentUser.uid, 'portfolios', params.id as string);
        await updateDoc(portfolioRef, data);
    } catch(e) {
        toast({ title: 'Error saving', description: 'Could not save your changes.', variant: 'destructive'})
    } finally {
        setIsSaving(false);
    }
  }, [currentUser, params.id, toast]);

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

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
        setActiveToolPanel(null);
    } else if (!e.relatedTarget) {
        setActiveToolPanel(null);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    if (portfolio) {
        const updatedPortfolio = { ...portfolio, templateId };
        setPortfolio(updatedPortfolio);
        savePortfolio({ templateId });
    }
  }


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

  const toolPanelContent: Record<string, React.ReactNode> = {
    'Design': (
        <div className="flex flex-col h-full">
            <div className="p-4 space-y-4 flex-shrink-0">
                <Input placeholder="Search templates..." className="bg-muted/50" />
            </div>
             <Separator />
            <ScrollArea className="flex-1">
                <div className="p-4 grid grid-cols-2 gap-4">
                    {templatePreviews.map(template => (
                        <div key={template.id} className="space-y-1 cursor-pointer" onClick={() => handleTemplateSelect(template.id as TemplateId)}>
                             <div className={cn("aspect-[3/4] bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground overflow-hidden border-2", portfolio?.templateId === template.id ? 'border-primary' : 'border-transparent')}>
                                <Image src={template.image} alt={template.name} width={150} height={200} className="object-cover h-full w-full"/>
                            </div>
                            <p className="text-sm font-medium text-center">{template.name}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    ),
    'Elements': (
        <div className="p-4">
            <Input placeholder="Search elements..." className="bg-muted/50 mb-4" />
             <div className="grid grid-cols-3 gap-2">
                 <div className="h-16 bg-muted rounded-md flex items-center justify-center cursor-pointer hover:ring-2 ring-primary"><div className="w-8 h-8 bg-muted-foreground/50 rounded-sm"></div></div>
                 <div className="h-16 bg-muted rounded-md flex items-center justify-center cursor-pointer hover:ring-2 ring-primary"><div className="w-8 h-8 bg-muted-foreground/50 rounded-full"></div></div>
                 <div className="h-16 bg-muted rounded-md flex items-center justify-center cursor-pointer hover:ring-2 ring-primary"><div className="w-8 h-8 text-muted-foreground/50">...</div></div>
             </div>
        </div>
    ),
    'Text': (
         <div className="p-4 space-y-2">
            <Button variant="outline" className="w-full justify-start h-16 text-left flex-col items-start"><span className="text-xl font-bold">Add a heading</span><span className="font-normal text-muted-foreground">Main title for a section</span></Button>
            <Button variant="outline" className="w-full justify-start h-16 text-left flex-col items-start"><span className="text-lg font-semibold">Add a subheading</span><span className="font-normal text-muted-foreground">Subtitle for a section</span></Button>
            <Button variant="outline" className="w-full justify-start h-16 text-left flex-col items-start"><span className="text-base">Add body text</span><span className="font-normal text-muted-foreground">Regular text content</span></Button>
        </div>
    ),
    'Uploads': (
         <div className="p-4 space-y-4">
            <Button className="w-full bg-[#45B8AC] hover:bg-[#45B8AC]/90">Upload files</Button>
            <Input placeholder="Search uploads..." className="bg-muted/50"/>
            <p className="text-xs text-muted-foreground text-center">Your uploaded assets will appear here.</p>
        </div>
    ),
    'Projects': (
        <div className="p-4">
            <p className="text-sm text-muted-foreground">Your profile projects are available here to drag and drop.</p>
        </div>
    ),
  };


  return (
      <div className="h-screen w-full flex flex-col bg-muted/40 overflow-hidden">
        <Header pageActions={editorActions} />
        <div className="flex flex-1 overflow-hidden">
            
            <div className="relative" onMouseLeave={handleMouseLeave}>
                {/* Left Toolbar */}
                <nav 
                    className="w-20 flex-shrink-0 border-r bg-background flex flex-col items-center p-2 space-y-1 z-20 h-full"
                >
                    {tools.map(tool => (
                        <EditorToolbarButton key={tool.name} icon={tool.icon} label={tool.name} hoverColor={tool.hover} 
                            onMouseEnter={() => setActiveToolPanel(tool.name)} 
                        />
                    ))}
                </nav>

                <div
                  ref={toolPanelContainerRef}
                  className={cn(
                      "absolute top-2 left-20 z-30 transition-all duration-300 ease-in-out transform-origin-left",
                      "h-[calc(100vh-80px)]",
                      activeToolPanel
                        ? 'translate-x-0 opacity-100 scale-100'
                        : '-translate-x-8 opacity-0 scale-95 pointer-events-none'
                  )}
                >
                    <div className="bg-card border shadow-lg rounded-lg w-[350px] flex flex-col h-full">
                        {activeToolPanel && toolPanelContent[activeToolPanel]}
                    </div>
                </div>
            </div>

            {/* Main Canvas */}
             <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
                 <div className='flex-grow h-full bg-background rounded-lg border overflow-auto'>
                    <div 
                        className="transition-transform duration-300"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                    >
                        {portfolio ? (
                            <PortfolioLivePreview portfolioData={portfolio} />
                        ) : (
                            <p className='text-muted-foreground text-center p-12'>Loading preview...</p>
                        )}
                    </div>
                 </div>
               
                <footer className="w-full flex-shrink-0 p-2 rounded-lg bg-background border flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-1"/> Notes
                        </Button>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-2 max-w-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(20, z - 10))}><Minus className="h-4 w-4"/></Button>
                        <Slider
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            max={100}
                            min={20}
                            step={1}
                            className="w-full"
                        />
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(100, z + 10))}><Plus className="h-4 w-4"/></Button>
                         <span className="text-muted-foreground w-12 text-center">{zoom}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleFullScreen}><Maximize className="h-4 w-4"/></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><HelpCircle className="h-4 w-4"/></Button>
                    </div>
                </footer>
            </main>
        </div>
      </div>
  );
}

export default PortfolioEditorClient;

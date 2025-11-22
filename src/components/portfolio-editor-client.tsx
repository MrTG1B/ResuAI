

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
import { Shapes, Type, UploadCloud, LayoutDashboard, FolderKanban, Maximize, HelpCircle, BookOpen, Plus, Minus, Search, Save, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PortfolioLivePreview } from '@/components/portfolio-live-preview';
import { TemplatePreview } from './template-preview';


const EditorToolbarButton = ({ icon: Icon, label, onMouseEnter }: { icon: React.ElementType; label: string; onMouseEnter: () => void; }) => (
    <Button
        variant="ghost"
        className="w-full h-16 rounded-md p-1 text-muted-foreground justify-center transition-colors duration-200 hover:bg-primary/20"
        onMouseEnter={onMouseEnter}
    >
            <div className="flex flex-col items-center gap-1">
            <Icon className="h-6 w-6" />
            <span className="text-xs">{label}</span>
        </div>
    </Button>
);

const templatePreviews: { id: TemplateId, name: string }[] = [
    { id: 'classic', name: 'Classic' },
    { id: 'modern', name: 'Modern' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'creative', name: 'Creative' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'geist', name: 'Geist' },
    { id: 'orion', name: 'Orion' },
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


  const savePortfolio = useCallback(async (dataToSave?: Partial<PortfolioData>): Promise<boolean> => {
    if (!currentUser || !params.id || !db) return false;
    
    const finalData = dataToSave || portfolio;
    if (!finalData) return false;

    setIsSaving(true);
    try {
        const portfolioRef = doc(db, 'users', currentUser.uid, 'portfolios', params.id as string);
        await updateDoc(portfolioRef, finalData);
        toast({
            title: "Portfolio Saved",
            description: "Your changes have been successfully saved.",
        });
        return true;
    } catch(e) {
        toast({ title: 'Error saving', description: 'Could not save your changes.', variant: 'destructive'})
        return false;
    } finally {
        setIsSaving(false);
    }
  }, [currentUser, params.id, toast, portfolio]);

  useEffect(() => {
    const portfolioId = params.id as string;
    if (!portfolioId || !auth || !db) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const dbInstance = db;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docRef = doc(dbInstance, 'users', user.uid, 'portfolios', portfolioId);
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
    if (toolPanelContainerRef.current && !toolPanelContainerRef.current.contains(e.relatedTarget as Node)) {
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
  };

  const handleExit = async () => {
    const saved = await savePortfolio();
    if (saved) {
      router.push(`/portfolio?id=${params.id}`);
    }
  };

  const handlePreview = async () => {
    const saved = await savePortfolio();
    if (saved && typeof window !== 'undefined') {
        window.open(`/public/portfolio/${params.id}`, '_blank');
    }
  };


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
        <Button onClick={handlePreview} variant="outline" size="sm" disabled={isSaving}>
            <ExternalLink className="mr-2 h-4 w-4" /> Preview
        </Button>
        <Button onClick={handleExit} variant="outline" size="sm" disabled={isSaving}>
            Exit Editor
        </Button>
        <Button onClick={() => savePortfolio()} disabled={isSaving}>
            {isSaving ? <BrandLoader size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Save
        </Button>
    </div>
  );
  
  const tools = [
      { name: 'Design', icon: LayoutDashboard },
      { name: 'Elements', icon: Shapes },
      { name: 'Text', icon: Type },
      { name: 'Uploads', icon: UploadCloud },
      { name: 'Projects', icon: FolderKanban },
  ];

  const toolPanelContent: Record<string, React.ReactNode> = {
    'Design': (
        <div className="flex flex-col h-full">
            <div className="p-4 space-y-4 flex-shrink-0">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search templates..." className="bg-muted/50 pl-9 border-border focus:bg-background" />
                </div>
            </div>
             <Separator />
            <ScrollArea className="flex-1">
                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-6">
                    {templatePreviews.map(template => (
                        <div key={template.id} className="space-y-2 cursor-pointer group" onClick={() => handleTemplateSelect(template.id as TemplateId)}>
                            <div
                                className={cn(
                                "aspect-[3/4] bg-background rounded-md flex items-center justify-center text-xs text-muted-foreground overflow-hidden border-2 relative transition-all duration-300 transform group-hover:scale-105",
                                portfolio?.templateId === template.id ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-muted group-hover:border-primary/50'
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>
                               {portfolio && <TemplatePreview portfolioData={portfolio} templateId={template.id} />}
                            </div>
                            <p className="text-sm font-medium text-center transition-colors group-hover:text-primary">{template.name}</p>
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
                        <EditorToolbarButton key={tool.name} icon={tool.icon} label={tool.name}
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
                 <div className='flex-grow h-full bg-background rounded-lg border overflow-auto p-4 flex justify-center items-start'>
                    <div 
                        className="transition-transform duration-300"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
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

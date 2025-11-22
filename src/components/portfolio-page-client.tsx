
'use client';

import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { type PortfolioData } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PenSquare, Share2, ExternalLink } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, getDoc, doc, Timestamp } from "@/lib/firebase";
import { BrandLoader } from "@/components/brand-loader";
import { TemplateClassic } from "./portfolio-templates/template-classic";
import { TemplateModern } from "./portfolio-templates/template-modern";
import { TemplateMinimal } from "./portfolio-templates/template-minimal";
import { TemplateCreative } from "./portfolio-templates/template-creative";
import { TemplateCorporate } from "./portfolio-templates/template-corporate";
import { TemplateGeist } from "./portfolio-templates/template-geist";
import { TemplateOrion } from "./portfolio-templates/template-orion";

function PortfolioSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-2xl overflow-hidden w-full">
        <div className="p-8 md:flex md:items-center md:gap-8 border-b">
            <div className="h-32 w-32 rounded-full bg-muted flex-shrink-0 mx-auto md:mx-0" />
            <div className="flex-1 space-y-3 mt-6 md:mt-0 text-center md:text-left">
                <div className="h-8 w-3/4 mx-auto md:mx-0 bg-muted rounded" />
                <div className="h-6 w-1/2 mx-auto md:mx-0 bg-muted rounded" />
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-5 w-24 bg-muted rounded" />
                </div>
            </div>
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
                <div>
                    <div className="h-7 w-1/4 mb-4 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-full mt-2 bg-muted rounded" />
                    <div className="h-4 w-3/4 mt-2 bg-muted rounded" />
                </div>
                <div>
                    <div className="h-7 w-1/4 mb-4 bg-muted rounded" />
                    <div className="space-y-6">
                        <div className="h-24 w-full bg-muted rounded" />
                        <div className="h-24 w-full bg-muted rounded" />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-10">
                <div>
                    <div className="h-7 w-1/3 mb-4 bg-muted rounded" />
                    <div className="flex flex-wrap gap-2">
                        <div className="h-8 w-20 bg-muted rounded-full" />
                        <div className="h-8 w-24 bg-muted rounded-full" />
                        <div className="h-8 w-16 bg-muted rounded-full" />
                        <div className="h-8 w-28 bg-muted rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default function PortfolioPageClient({ portfolioId }: { portfolioId: string }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !auth) {
        toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
  
    const dbInstance = db;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const portfolioDocRef = doc(dbInstance, `users/${user.uid}/portfolios`, portfolioId);
            const portfolioSnap = await getDoc(portfolioDocRef);

            if (portfolioSnap.exists()) {
                const data = portfolioSnap.data();
                 // Sanitize Firestore Timestamps
                for (const key in data) {
                    if (data[key] instanceof Timestamp) {
                        data[key] = data[key].toDate().toISOString();
                    }
                }
                setPortfolio({ id: portfolioSnap.id, ...data } as PortfolioData);
                setIsOwner(true);
            } else {
                setNotFound(true);
                toast({ title: "Not Found", description: "This portfolio does not exist or you do not have permission to view it.", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to fetch portfolio data.", variant: "destructive" });
            setNotFound(true);
        } finally {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [portfolioId, router, toast]);

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && portfolio?.id) {
      const shareUrl = `${window.location.origin}/public/portfolio/${portfolio.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied", description: "Public portfolio URL copied to clipboard!" });
    }
  };

  const handleView = () => {
    if (typeof window !== 'undefined' && portfolio?.id) {
      const viewUrl = `${window.location.origin}/public/portfolio/${portfolio.id}`;
      window.open(viewUrl, '_blank');
    }
  };
  
  const handleEdit = () => {
    if (portfolio?.id) {
      router.push(`/portfolio/edit/${portfolio.id}`);
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
                    <p className="text-muted-foreground mt-2">The portfolio you are looking for does not exist or you do not have permission to view it.</p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-6">Go to Dashboard</Button>
                </div>
            </main>
        </div>
    )
  }

  if (!portfolio) {
    return (
        <div className="flex h-screen items-center justify-center">
            <BrandLoader size="lg" />
        </div>
    );
  }

  const templateId = portfolio.templateId || 'classic';
  
  const renderTemplate = () => {
    switch (templateId) {
        case 'classic':
            return <TemplateClassic portfolioData={portfolio} />;
        case 'modern':
            return <TemplateModern portfolioData={portfolio} />;
        case 'minimal':
            return <TemplateMinimal portfolioData={portfolio} />;
        case 'creative':
            return <TemplateCreative portfolioData={portfolio} />;
        case 'corporate':
            return <TemplateCorporate portfolioData={portfolio} />;
        case 'geist':
            return <TemplateGeist portfolioData={portfolio} />;
        case 'orion':
            return <TemplateOrion portfolioData={portfolio} />;
        default:
            return <TemplateClassic portfolioData={portfolio} />;
    }
  };
  
  const pageActions = isOwner ? (
    <div className="flex items-center gap-2">
        <Button onClick={copyToClipboard} variant="outline" size="sm" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground border-foreground/20">
            <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button onClick={handleView} variant="outline" size="sm" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground border-foreground/20">
            <ExternalLink className="mr-2 h-4 w-4" /> View Public
        </Button>
        <Button onClick={handleEdit} size="sm" style={{backgroundColor: '#45B8AC', color: 'white'}} className="hover:opacity-90 shadow-lg shadow-[#45B8AC]/20 transition-all transform hover:-translate-y-px">
            <PenSquare className="mr-2 h-4 w-4" /> Edit Portfolio
        </Button>
    </div>
  ) : null;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'hsl(var(--muted)/0.4)' }}>
      <Header pageActions={pageActions} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="w-full">
            {renderTemplate()}
        </div>
      </main>
    </div>
  );
}

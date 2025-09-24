
"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { type PortfolioData, PersonalInfo, Project, SocialLink, type ColorPalette } from "@/types/portfolio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, ClipboardCopy, Award, Edit, Save, Trash2, Camera, Github, Linkedin, Loader2, Palette, Eye, CheckCircle } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, getDoc, setDoc, doc, serverTimestamp } from "@/lib/firebase";
import { uploadImageAction } from "@/app/actions";
import { BrandLoader } from "@/components/brand-loader";

function PortfolioSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 md:flex md:items-center md:gap-8 border-b">
            <Skeleton className="h-32 w-32 rounded-full flex-shrink-0 mx-auto md:mx-0" />
            <div className="flex-1 space-y-3 mt-6 md:mt-0 text-center md:text-left">
                <Skeleton className="h-8 w-3/4 mx-auto md:mx-0" />
                <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" />
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
                <div>
                    <Skeleton className="h-7 w-1/4 mb-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </div>
                <div>
                    <Skeleton className="h-7 w-1/4 mb-4" />
                    <div className="space-y-6">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-10">
                <div>
                    <Skeleton className="h-7 w-1/3 mb-4" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-28" />
                    </div>
                </div>
                <div>
                    <Skeleton className="h-7 w-1/3 mb-4" />
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
                 <div>
                    <Skeleton className="h-7 w-1/3 mb-4" />
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved';

function PortfolioPageContent() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [editablePortfolio, setEditablePortfolio] = useState<PortfolioData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  const autoSaveChanges = useCallback(async (data: PortfolioData) => {
    if (!currentUser || !data.id || !db) return;
    setSaveStatus('saving');
    try {
        const { id, ...dataToSave } = data;
        await setDoc(doc(db, "users", currentUser.uid, "portfolios", id), {
            ...dataToSave,
            lastModified: serverTimestamp()
        }, { merge: true });
        setSaveStatus('saved');
    } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus('idle'); // Or an 'error' state
        toast({ title: "Auto-save failed", description: "Could not save changes automatically.", variant: "destructive" });
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!isEditMode || !editablePortfolio || saveStatus === 'saving') return;
    
    const handler = setTimeout(() => {
        if(JSON.stringify(editablePortfolio) !== JSON.stringify(portfolio)) {
            autoSaveChanges(editablePortfolio);
        }
    }, 2000); // 2-second debounce

    return () => {
        clearTimeout(handler);
    };
  }, [editablePortfolio, isEditMode, autoSaveChanges, portfolio, saveStatus]);


  useEffect(() => {
    if (!db || !auth) {
        toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
        setIsPageLoading(false);
        setIsLoading(false);
        return;
    }
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setCurrentUser(user);
            const portfolioId = searchParams.get('id');
            
            if (!portfolioId) {
                setNotFound(true);
                toast({ title: "Not Found", description: "Portfolio ID is missing.", variant: "destructive" });
                setIsLoading(false);
                setIsPageLoading(false);
                return;
            }

            try {
                // For now, we assume if you are logged in, you can try to view it.
                // Firestore rules will determine if you are the owner.
                setIsOwner(true); 

                const portfolioDocRef = doc(db, `users/${user.uid}/portfolios`, portfolioId);
                const portfolioDoc = await getDoc(portfolioDocRef);

                if (portfolioDoc.exists()) {
                    const data = { id: portfolioDoc.id, ...portfolioDoc.data() } as PortfolioData;
                    setPortfolio(data);
                    setEditablePortfolio(JSON.parse(JSON.stringify(data))); // Deep copy for editing
                } else {
                    setNotFound(true);
                    toast({ title: "Not Found", description: "This portfolio does not exist or you do not have permission to view it.", variant: "destructive" });
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch portfolio data. You may not have permission to view this.", variant: "destructive" });
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        } else {
            toast({ title: "Authentication Required", description: "You must be logged in to view a portfolio.", variant: "destructive" });
            router.push('/login');
        }
        setIsPageLoading(false);
    });

    return () => unsubscribe();
  }, [router, searchParams, toast]);

  const handleCancel = () => {
    setEditablePortfolio(portfolio);
    setIsEditMode(false);
  };
  
  const handleSaveChanges = async () => {
    if (!currentUser || !editablePortfolio || !editablePortfolio.id) return;

    try {
        await autoSaveChanges(editablePortfolio);
        setPortfolio(editablePortfolio);
        setIsEditMode(false);
        toast({ title: "Portfolio Saved", description: "Your changes have been saved." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to save portfolio.", variant: "destructive" });
    }
  };

  const handleFieldChange = (updateFn: (prev: PortfolioData) => PortfolioData) => {
    setEditablePortfolio(prev => {
        if (!prev) return prev;
        setSaveStatus('idle'); // Reset save status on new change
        return updateFn(prev);
    });
  };
  
  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    handleFieldChange(prev => ({
        ...prev,
        personalInfo: { ...(prev.personalInfo as PersonalInfo), [field]: value }
    }));
  };

  const handleImageUpload = async (
    file: File, 
    uploadId: string, 
    updateFunction: (url: string) => void
  ) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Image Too Large',
        description: `Please select an image smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(uploadId);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      const result = await uploadImageAction(dataUri);
      if (result.success && result.data) {
        updateFunction(result.data.url);
        toast({ title: 'Image Uploaded', description: 'Your image has been updated.' });
      } else {
        toast({ title: 'Upload Failed', description: result.error, variant: 'destructive' });
      }
      setIsUploading(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'profile', (url) => {
        handleFieldChange(prev => ({
          ...prev,
          personalInfo: { ...(prev.personalInfo as PersonalInfo), profilePictureUrl: url }
        }));
      });
    }
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    handleFieldChange(prev => ({ ...prev, summary: value }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange(prev => ({ ...prev, skills: value }));
  };
  
  const handleProjectChange = (index: number, field: keyof Project, value: string) => {
    handleFieldChange(prev => {
        const newProjects = JSON.parse(JSON.stringify(prev.projects || []));
        const technologies = (field === 'technologies') ? value.split(',').map(t => t.trim()).filter(Boolean) : newProjects[index].technologies;
        newProjects[index] = { 
            ...newProjects[index], 
            [field]: field === 'technologies' ? technologies : value 
        };
        return { ...prev, projects: newProjects };
    });
  };

  const handleProjectImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, `project-${index}`, (url) => {
        handleFieldChange(prev => {
          const newProjects = JSON.parse(JSON.stringify(prev.projects || []));
          newProjects[index] = { ...newProjects[index], previewImage: url };
          return { ...prev, projects: newProjects };
        });
      });
    }
  };
  
  const handleSocialChange = (index: number, field: keyof SocialLink, value: string) => {
    handleFieldChange(prev => {
        const newSocials = JSON.parse(JSON.stringify(prev.personalInfo?.socials || []));
        newSocials[index] = { ...newSocials[index], [field]: value };
        return { ...prev, personalInfo: { ...(prev.personalInfo as PersonalInfo), socials: newSocials } };
    });
  };

  const handleAddSocial = () => {
    handleFieldChange(prev => {
      const newSocials = [...(prev.personalInfo?.socials || []), { platform: '', url: '' }];
      return { ...prev, personalInfo: { ...(prev.personalInfo as PersonalInfo), socials: newSocials } };
    });
  };

  const handleRemoveSocial = (index: number) => {
    handleFieldChange(prev => {
      const newSocials = prev.personalInfo?.socials?.filter((_, i) => i !== index) || [];
      return { ...prev, personalInfo: { ...(prev.personalInfo as PersonalInfo), socials: newSocials } };
    });
  };

  const handleColorChange = (field: keyof ColorPalette, value: string) => {
    handleFieldChange(prev => {
        const newPalette = { ...(prev.colorPalette || {}), [field]: value };
        return { ...prev, colorPalette: newPalette as ColorPalette };
    });
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && currentUser && portfolio?.id) {
      // Note: This creates a public share link, but we don't have public rules for this yet.
      // For now, it only works for the logged-in user.
      const shareUrl = `${window.location.origin}/portfolio?id=${portfolio.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied", description: "Portfolio URL copied to clipboard!" });
    }
  };

   const handleView = () => {
    if (typeof window !== 'undefined' && portfolio?.id) {
      const viewUrl = `${window.location.origin}/portfolio?id=${portfolio.id}`;
      window.open(viewUrl, '_blank');
    }
  };

  const SocialIcon = ({ platform, className }: { platform: string, className?: string }) => {
    const lowerCasePlatform = platform.toLowerCase();
    if (lowerCasePlatform.includes('github')) {
        return <Github className={className} />;
    }
    if (lowerCasePlatform.includes('linkedin')) {
        return <Linkedin className={className} />;
    }
    return <Globe className={className} />;
  };
  
  if (isPageLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <BrandLoader size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl">
          <PortfolioSkeleton />
        </main>
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

  if (!portfolio || !editablePortfolio) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow flex items-center justify-center text-center p-4">
                 <BrandLoader size="lg" />
            </main>
        </div>
    );
  }
  
  const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette } = isEditMode ? editablePortfolio : portfolio;

  const portfolioStyles = colorPalette ? {
    '--p-bg': colorPalette.background,
    '--p-fg': colorPalette.foreground,
    '--p-primary': colorPalette.primary,
    '--p-secondary': colorPalette.secondary,
    '--p-accent': colorPalette.accent,
  } as React.CSSProperties : {};
  
  const SaveStatusIndicator = () => {
    let content;
    switch (saveStatus) {
        case 'saving':
            content = <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>;
            break;
        case 'saved':
            content = <><CheckCircle className="h-4 w-4" /> Saved</>;
            break;
        default:
            return null;
    }
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {content}
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--p-bg, hsl(var(--muted)/0.4))' }}>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl" style={portfolioStyles}>
        {isOwner && (
             <div className="flex justify-end mb-4 gap-2 items-center">
                {isEditMode ? (
                  <>
                    <SaveStatusIndicator />
                    <Button onClick={handleCancel} variant="outline">Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={!!isUploading || saveStatus === 'saving'}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={copyToClipboard} variant="outline"><ClipboardCopy className="mr-2 h-4 w-4" /> Share</Button>
                    <Button onClick={handleView} variant="outline"><Eye className="mr-2 h-4 w-4" /> View</Button>
                    <Button onClick={() => setIsEditMode(true)}><Edit className="mr-2 h-4 w-4" /> Edit Portfolio</Button>
                  </>
                )}
            </div>
        )}

        <div className="rounded-xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--p-secondary, hsl(var(--card)))', color: 'var(--p-fg, hsl(var(--foreground)))' }}>
            {/* Profile Header */}
            <div className="p-6 md:p-8 md:flex md:items-center md:gap-8 border-b" style={{ borderColor: 'var(--p-primary, hsl(var(--border)))' }}>
                <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative h-24 w-24 md:h-32 md:w-32 group">
                      <Image
                          unoptimized
                          src={personalInfo?.profilePictureUrl || 'https://placehold.co/128x128.png'}
                          alt={`${personalInfo?.name || 'User'}'s profile picture`}
                          width={128}
                          height={128}
                          className="rounded-full object-cover h-full w-full border-4 shadow-md"
                          style={{ borderColor: 'var(--p-primary, hsl(var(--primary)))' }}
                          priority
                      />
                      {isEditMode && (
                        <>
                          <label htmlFor="profile-picture-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            {isUploading === 'profile' ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8"/>}
                          </label>
                          <Input id="profile-picture-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} disabled={isUploading === 'profile'} />
                        </>
                      )}
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left mt-6 md:mt-0">
                    {isEditMode ? (
                      <Input value={personalInfo?.name || ''} onChange={(e) => handlePersonalInfoChange('name', e.target.value)} className="text-3xl md:text-4xl font-bold tracking-tight h-auto p-0 border-0 focus-visible:ring-0 bg-transparent font-heading" />
                    ) : (
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-heading" style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}>{personalInfo?.name}</h1>
                    )}
                    {isEditMode ? (
                      <Input value={personalInfo?.title || ''} onChange={(e) => handlePersonalInfoChange('title', e.target.value)} className="text-lg md:text-xl mt-1 h-auto p-0 border-0 focus-visible:ring-0 bg-transparent" />
                    ) : (
                      <p className="text-lg md:text-xl mt-1" style={{color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.8}}>{personalInfo?.title}</p>
                    )}
                    <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-sm">
                        {isEditMode ? <Input value={personalInfo?.email || ''} onChange={(e) => handlePersonalInfoChange('email', e.target.value)} placeholder="Email" className="bg-transparent"/> : (personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2" style={{ color: 'var(--p-fg, hsl(var(--foreground)))' }}><Mail className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.email}</a>)}
                        {isEditMode ? <Input value={personalInfo?.phone || ''} onChange={(e) => handlePersonalInfoChange('phone', e.target.value)} placeholder="Phone" className="bg-transparent"/> : (personalInfo?.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.phone}</span>)}
                        {isEditMode ? <Input value={personalInfo?.website || ''} onChange={(e) => handlePersonalInfoChange('website', e.target.value)} placeholder="Website" className="bg-transparent"/> : (personalInfo?.website && <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: 'var(--p-fg, hsl(var(--foreground)))' }}><Globe className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.website}</a>)}
                        {isEditMode ? <Input value={personalInfo?.location || ''} onChange={(e) => handlePersonalInfoChange('location', e.target.value)} placeholder="Location" className="bg-transparent"/> : (personalInfo?.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.location}</span>)}
                    </div>

                    {isEditMode ? (
                        <div className="mt-4 space-y-2 text-left">
                          <Label>Social Links</Label>
                          {editablePortfolio.personalInfo?.socials?.map((social, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input value={social.platform || ''} onChange={(e) => handleSocialChange(index, 'platform', e.target.value)} placeholder="Platform (e.g. GitHub)" className="bg-transparent"/>
                              <Input value={social.url || ''} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} placeholder="URL" className="bg-transparent"/>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveSocial(index)} className="shrink-0">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={handleAddSocial}>Add Link</Button>
                        </div>
                    ) : (
                        personalInfo?.socials && personalInfo.socials.length > 0 && (
                          <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-4">
                            {personalInfo.socials.map((social, index) => (
                              <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform} style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))' }}>
                                <SocialIcon platform={social.platform} className="h-6 w-6" />
                              </a>
                            ))}
                          </div>
                        )
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
                <div className="lg:col-span-2 space-y-12">
                    {summary && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><BookUser style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Professional Summary</h2>
                            {isEditMode ? (
                              <Textarea value={summary || ''} onChange={handleSummaryChange} rows={5} className="bg-transparent" />
                            ) : (
                              <p className="whitespace-pre-line leading-relaxed" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.9 }}>{summary}</p>
                            )}
                        </section>
                    )}
                    
                    {experience && experience.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><Briefcase style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Work Experience</h2>
                            <div className="space-y-8">
                            {experience.map((job, index) => (
                                <div key={index} className="pl-6 border-l-2 relative" style={{ borderColor: 'var(--p-primary, hsl(var(--primary)))' }}>
                                    <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4" style={{ backgroundColor: 'var(--p-primary, hsl(var(--primary)))', borderColor: 'var(--p-secondary, hsl(var(--card)))' }}></div>
                                    <h3 className="font-semibold text-lg font-heading">{job.role}</h3>
                                    <p className="text-md font-medium" style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}>{job.company} - {job.location}</p>
                                    <p className="text-sm" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.8 }}>{job.dates}</p>
                                    <ul className="mt-2 list-disc list-inside space-y-1.5" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.9 }}>
                                        {job.description?.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            ))}
                            </div>
                        </section>
                    )}

                    {projects && projects.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><Lightbulb style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Projects</h2>
                            <div className="space-y-8">
                            {projects.map((project, index) => (
                                <div key={index} className="pl-6 border-l-2 relative" style={{ borderColor: 'var(--p-primary, hsl(var(--primary)))' }}>
                                    <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4" style={{ backgroundColor: 'var(--p-primary, hsl(var(--primary)))', borderColor: 'var(--p-secondary, hsl(var(--card)))' }}></div>
                                    {isEditMode ? (
                                      <div className="space-y-4">
                                        <Input value={project.name || ''} onChange={e => handleProjectChange(index, 'name', e.target.value)} placeholder="Project Name" className="bg-transparent font-heading"/>
                                        <Textarea value={project.description || ''} onChange={e => handleProjectChange(index, 'description', e.target.value)} placeholder="Project Description" className="bg-transparent"/>
                                        <Input value={project.url || ''} onChange={e => handleProjectChange(index, 'url', e.target.value)} placeholder="Project URL" className="bg-transparent"/>
                                        <Textarea value={project.technologies?.join(', ') || ''} onChange={e => handleProjectChange(index, 'technologies', e.target.value)} placeholder="Technologies (comma-separated)" className="bg-transparent"/>
                                        <div>
                                            <Label htmlFor={`project-image-${index}`}>Project Preview</Label>
                                            <div className="flex items-center gap-2">
                                                <Input id={`project-image-${index}`} type="file" accept="image/*" onChange={e => handleProjectImageChange(index, e)} disabled={isUploading === `project-${index}`} />
                                                {isUploading === `project-${index}` && <Loader2 className="h-4 w-4 animate-spin" />}
                                            </div>
                                            {project.previewImage && <Image src={project.previewImage} alt="preview" width={200} height={100} className="mt-2 rounded-md object-cover" />}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        {project.previewImage && (
                                            <Image src={project.previewImage} alt={`${project.name} preview`} width={800} height={450} className="rounded-lg mb-4 border" data-ai-hint="app screenshot" style={{ borderColor: 'var(--p-border, hsl(var(--border)))' }} />
                                        )}
                                        <h3 className="font-semibold text-lg font-heading">{project.name}</h3>
                                        {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--p-accent, hsl(var(--primary)))' }}>{project.url}</a>}
                                        <p className="mt-2" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.9 }}>{project.description}</p>
                                        {project.technologies?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {project.technologies.map(tech => <Badge key={tech} variant="secondary" style={{ backgroundColor: 'var(--p-bg, hsl(var(--secondary)))' }}>{tech}</Badge>)}
                                            </div>
                                        )}
                                      </>
                                    )}
                                </div>
                            ))}
                            </div>
                        </section>
                    )}
                </div>
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-12">
                    {skills && skills.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><Wrench style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Skills</h2>
                            {isEditMode ? (
                              <Textarea value={skills?.join(', ') || ''} onChange={handleSkillsChange} placeholder="Skills (comma-separated)" rows={4} className="bg-transparent"/>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                  {skills.map((skill, index) => <Badge key={index} variant="outline" className="text-base py-1 px-3 shadow-sm">{skill}</Badge>)}
                              </div>
                            )}
                        </section>
                    )}

                    {education && education.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><GraduationCap style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Education</h2>
                            <div className="space-y-4">
                            {education.map((edu, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-lg font-heading">{edu.degree}</h3>
                                    <p className="text-sm font-medium" style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}>{edu.school}</p>
                                    <p className="text-xs" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.8 }}>{edu.dates}</p>
                                </div>
                            ))}
                            </div>
                        </section>
                    )}

                    {certifications && certifications.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><Award style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Certifications</h2>
                            <div className="space-y-4">
                            {certifications.map((cert, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-lg font-heading">{cert.name}</h3>
                                    <p className="text-sm font-medium" style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}>{cert.issuingOrganization}</p>
                                    <p className="text-xs" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.8 }}>{cert.date}</p>
                                </div>
                            ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><Palette style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Theme</h2>
                        {isEditMode ? (
                        <div className="space-y-4 p-4 border rounded-lg bg-background">
                            {(Object.keys(editablePortfolio.colorPalette || {}) as Array<keyof ColorPalette>).map((key) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={`color-${key}`} className="capitalize text-card-foreground">{key}</Label>
                                <Input
                                id={`color-${key}`}
                                type="color"
                                value={editablePortfolio.colorPalette?.[key] || '#000000'}
                                onChange={(e) => handleColorChange(key, e.target.value)}
                                className="p-1 h-10 w-16"
                                />
                            </div>
                            ))}
                        </div>
                        ) : (
                        colorPalette && (
                            <div className="flex flex-wrap gap-4">
                            {Object.entries(colorPalette).map(([key, value]) => (
                                <div key={key} className="flex flex-col items-center gap-1 text-xs">
                                <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: value, borderColor: 'var(--p-fg, hsl(var(--border)))' }}></div>
                                <span className="capitalize">{key}</span>
                                </div>
                            ))}
                            </div>
                        )
                        )}
                    </section>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}


export default function PortfolioPage() {
    return (
        <Suspense fallback={<PortfolioSkeleton />}>
            <PortfolioPageContent />
        </Suspense>
    )
}

    
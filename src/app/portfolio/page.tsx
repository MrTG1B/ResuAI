"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { type PortfolioData } from "@/types/portfolio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, GraduationCap, Wrench, Lightbulb, User, Mail, Phone, Globe, MapPin, ClipboardCopy, Award } from "lucide-react";

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

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Partial<PortfolioData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const data = localStorage.getItem("portfolioData");
    if (data) {
      try {
        setPortfolio(JSON.parse(data));
      } catch (error) {
        toast({ title: "Error", description: "Could not parse portfolio data.", variant: "destructive" });
        router.push("/");
      }
    } else {
      toast({ title: "No Data", description: "No portfolio data found. Please upload a resume first.", variant: "destructive" });
      router.push("/");
    }
    setIsLoading(false);
  }, [router, toast]);

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Portfolio URL copied to clipboard!" });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl">
          <PortfolioSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!portfolio) {
    return null; // Or a message saying "No portfolio to display"
  }
  
  const { 
    personalInfo = { name: '', title: '', email: '', phone: '', website: '', location: '', profilePictureDataUri: '' },
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = []
  } = portfolio;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="flex justify-end mb-4">
            <Button onClick={copyToClipboard} variant="outline">
                <ClipboardCopy className="mr-2 h-4 w-4" /> Share Link
            </Button>
        </div>

        <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
            {/* Profile Header */}
            <div className="p-8 md:flex md:items-center md:gap-8 bg-card border-b">
                {personalInfo.profilePictureDataUri && (
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <Image
                            src={personalInfo.profilePictureDataUri}
                            alt={`${personalInfo.name}'s profile picture`}
                            width={128}
                            height={128}
                            className="rounded-full object-cover h-32 w-32 border-4 border-primary/20 shadow-md"
                            priority
                        />
                    </div>
                )}
                <div className="flex-1 text-center md:text-left mt-6 md:mt-0">
                    <h1 className="text-4xl font-bold tracking-tight text-primary">{personalInfo.name}</h1>
                    <p className="text-xl text-muted-foreground mt-1">{personalInfo.title}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-sm text-foreground">
                        {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4 text-primary/80"/>{personalInfo.email}</a>}
                        {personalInfo.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary/80"/>{personalInfo.phone}</span>}
                        {personalInfo.website && <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary"><Globe className="h-4 w-4 text-primary/80"/>{personalInfo.website}</a>}
                        {personalInfo.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/80"/>{personalInfo.location}</span>}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
                {/* Left Column (main content) */}
                <div className="lg:col-span-2 space-y-12">
                    {summary && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><User className="text-primary"/> Professional Summary</h2>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{summary}</p>
                        </section>
                    )}
                    
                    {experience?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><Briefcase className="text-primary"/> Work Experience</h2>
                            <div className="space-y-8">
                            {experience.map((job, index) => (
                                <div key={index} className="pl-6 border-l-2 border-primary/50 relative">
                                    <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-primary border-4 border-card"></div>
                                    <h3 className="font-semibold text-lg">{job.role}</h3>
                                    <p className="text-md font-medium text-primary">{job.company} - {job.location}</p>
                                    <p className="text-sm text-muted-foreground">{job.dates}</p>
                                    <ul className="mt-2 list-disc list-inside space-y-1.5 text-muted-foreground">
                                        {job.description?.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            ))}
                            </div>
                        </section>
                    )}

                    {projects?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><Lightbulb className="text-primary"/> Projects</h2>
                            <div className="space-y-8">
                            {projects.map((project, index) => (
                                <div key={index} className="pl-6 border-l-2 border-primary/50 relative">
                                      <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-primary border-4 border-card"></div>
                                    <h3 className="font-semibold text-lg">{project.name}</h3>
                                    {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{project.url}</a>}
                                    <p className="mt-2 text-muted-foreground">{project.description}</p>
                                    {project.technologies?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {project.technologies.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            </div>
                        </section>
                    )}
                </div>
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-12">
                    {skills?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><Wrench className="text-primary"/> Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, index) => <Badge key={index} variant="outline" className="text-base py-1 px-3 shadow-sm">{skill}</Badge>)}
                            </div>
                        </section>
                    )}

                    {education?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><GraduationCap className="text-primary"/> Education</h2>
                            <div className="space-y-4">
                            {education.map((edu, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-lg">{edu.degree}</h3>
                                    <p className="text-sm font-medium text-primary">{edu.school}</p>
                                    <p className="text-xs text-muted-foreground">{edu.dates}</p>
                                </div>
                            ))}
                            </div>
                        </section>
                    )}

                    {certifications?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4"><Award className="text-primary"/> Certifications</h2>
                            <div className="space-y-4">
                            {certifications.map((cert, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-lg">{cert.name}</h3>
                                    <p className="text-sm font-medium text-primary">{cert.issuingOrganization}</p>
                                    <p className="text-xs text-muted-foreground">{cert.date}</p>
                                </div>
                            ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

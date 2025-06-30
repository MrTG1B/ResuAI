"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { type PortfolioData } from "@/types/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, GraduationCap, Wrench, Lightbulb, User, Mail, Phone, Globe, MapPin, ClipboardCopy, FileText } from "lucide-react";

function PortfolioSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4 mt-1" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-5/6 mt-2" />
          </div>
          <div>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4 mt-1" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-5/6 mt-2" />
          </div>
        </CardContent>
      </Card>
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
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
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
    personalInfo = { name: '', title: '', email: '', phone: '', website: '', location: '' },
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = []
  } = portfolio;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-end mb-4">
            <Button onClick={copyToClipboard} variant="outline">
                <ClipboardCopy className="mr-2 h-4 w-4" /> Share Link
            </Button>
        </div>

        {/* Personal Info Header */}
        <Card className="mb-8 overflow-hidden shadow-lg">
          <div className="bg-card p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-primary">{personalInfo.name}</h1>
              <p className="text-xl text-muted-foreground mt-1">{personalInfo.title}</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-foreground">
              {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4 text-primary/80"/>{personalInfo.email}</a>}
              {personalInfo.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary/80"/>{personalInfo.phone}</span>}
              {personalInfo.website && <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary"><Globe className="h-4 w-4 text-primary/80"/>{personalInfo.website}</a>}
              {personalInfo.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/80"/>{personalInfo.location}</span>}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                {/* Summary */}
                {summary && (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl"><User className="text-primary"/> Professional Summary</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-muted-foreground">{summary}</p></CardContent>
                    </Card>
                )}
                
                {/* Experience */}
                {experience?.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-3 text-2xl"><Briefcase className="text-primary"/> Work Experience</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                    {experience.map((job, index) => (
                        <div key={index} className="pl-4 border-l-2 border-primary/50">
                            <h3 className="font-semibold text-lg">{job.role}</h3>
                            <p className="text-md text-primary">{job.company} - {job.location}</p>
                            <p className="text-sm text-muted-foreground">{job.dates}</p>
                            <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                                {job.description?.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    ))}
                    </CardContent>
                </Card>
                )}

                 {/* Projects */}
                 {projects?.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-3 text-2xl"><Lightbulb className="text-primary"/> Projects</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                    {projects.map((project, index) => (
                        <div key={index} className="pl-4 border-l-2 border-primary/50">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{project.url}</a>}
                            <p className="mt-2 text-muted-foreground">{project.description}</p>
                            {project.technologies?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {project.technologies.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                                </div>
                            )}
                        </div>
                    ))}
                    </CardContent>
                </Card>
                )}

            </div>
            <div className="md:col-span-1 space-y-8">
                 {/* Skills */}
                 {skills?.length > 0 && (
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-3 text-2xl"><Wrench className="text-primary"/> Skills</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => <Badge key={index} variant="outline" className="text-base py-1 px-3">{skill}</Badge>)}
                        </CardContent>
                    </Card>
                )}

                {/* Education */}
                {education?.length > 0 && (
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-3 text-2xl"><GraduationCap className="text-primary"/> Education</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                        {education.map((edu, index) => (
                            <div key={index}>
                                <h3 className="font-semibold">{edu.degree}</h3>
                                <p className="text-sm text-primary">{edu.school}</p>
                                <p className="text-xs text-muted-foreground">{edu.dates}</p>
                            </div>
                        ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

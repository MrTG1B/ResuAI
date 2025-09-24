
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { type PortfolioData, PersonalInfo, Project, SocialLink, type ColorPalette } from "@/types/portfolio";
import { getPublicPortfolioAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/brand-loader";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


function PortfolioSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 md:flex md:items-center md:gap-8 border-b">
            <div className="h-32 w-32 rounded-full flex-shrink-0 mx-auto md:mx-0 bg-muted animate-pulse" />
            <div className="flex-1 space-y-3 mt-6 md:mt-0 text-center md:text-left">
                <div className="h-8 w-3/4 mx-auto md:mx-0 bg-muted animate-pulse rounded" />
                <div className="h-6 w-1/2 mx-auto md:mx-0 bg-muted animate-pulse rounded" />
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4">
                    <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </div>
            </div>
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
                <div>
                    <div className="h-7 w-1/4 mb-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 mt-2 bg-muted animate-pulse rounded" />
                </div>
                <div>
                    <div className="h-7 w-1/4 mb-4 bg-muted animate-pulse rounded" />
                    <div className="space-y-6">
                        <div className="h-24 w-full bg-muted animate-pulse rounded" />
                        <div className="h-24 w-full bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-10">
                <div>
                    <div className="h-7 w-1/3 mb-4 bg-muted animate-pulse rounded" />
                    <div className="flex flex-wrap gap-2">
                        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
                        <div className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                        <div className="h-8 w-16 bg-muted animate-pulse rounded-full" />
                        <div className="h-8 w-28 bg-muted animate-pulse rounded-full" />
                    </div>
                </div>
                <div>
                    <div className="h-7 w-1/3 mb-4 bg-muted animate-pulse rounded" />
                    <div className="space-y-4">
                        <div className="h-16 w-full bg-muted animate-pulse rounded" />
                    </div>
                </div>
                 <div>
                    <div className="h-7 w-1/3 mb-4 bg-muted animate-pulse rounded" />
                    <div className="space-y-4">
                        <div className="h-16 w-full bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

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

export default function PublicPortfolioPageContent({ portfolioId }: { portfolioId: string }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!portfolioId) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      try {
        const result = await getPublicPortfolioAction(portfolioId);
        if (result.success && result.data) {
          setPortfolio(result.data);
        } else {
          setNotFound(true);
          toast({ title: "Not Found", description: "This portfolio does not exist or is private.", variant: "destructive" });
        }
      } catch (error) {
        setNotFound(true);
        toast({ title: "Error", description: "Failed to fetch portfolio data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [portfolioId, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <BrandLoader size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-destructive">404 - Portfolio Not Found</h1>
          <p className="text-muted-foreground mt-2">The portfolio you are looking for does not exist or is private.</p>
           <Button asChild className="mt-6">
                <Link href="/">Back to Home</Link>
           </Button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return <PortfolioSkeleton />;
  }

  const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette } = portfolio;

  const portfolioStyles = colorPalette ? {
    '--p-bg': colorPalette.background,
    '--p-fg': colorPalette.foreground,
    '--p-primary': colorPalette.primary,
    '--p-secondary': colorPalette.secondary,
    '--p-accent': colorPalette.accent,
  } as React.CSSProperties : {};
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--p-bg, hsl(var(--background)))', ...portfolioStyles }}>
      <main className="w-full" style={{ color: 'var(--p-fg, hsl(var(--foreground)))' }}>
        <div className="max-w-5xl mx-auto" style={{ backgroundColor: 'var(--p-secondary, hsl(var(--card)))' }}>
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
              </div>
            </div>
            <div className="flex-1 text-center md:text-left mt-6 md:mt-0">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-heading" style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}>{personalInfo?.name}</h1>
              <p className="text-lg md:text-xl mt-1" style={{color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.8}}>{personalInfo?.title}</p>
              <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-sm">
                {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2" style={{ color: 'var(--p-fg, hsl(var(--foreground)))' }}><Mail className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.email}</a>}
                {personalInfo?.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.phone}</span>}
                {personalInfo?.website && <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: 'var(--p-fg, hsl(var(--foreground)))' }}><Globe className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.website}</a>}
                {personalInfo?.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{color: 'var(--p-primary, hsl(var(--primary)))'}}/>{personalInfo.location}</span>}
              </div>
              {personalInfo?.socials && personalInfo.socials.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-4">
                  {personalInfo.socials.map((social, index) => (
                    <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform} style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))' }}>
                      <SocialIcon platform={social.platform} className="h-6 w-6" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
            <div className="lg:col-span-2 space-y-12">
              {summary && (
                <section>
                  <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading"><BookUser style={{ color: 'var(--p-primary, hsl(var(--primary)))' }}/> Professional Summary</h2>
                  <p className="whitespace-pre-line leading-relaxed" style={{ color: 'var(--p-fg, hsl(var(--muted-foreground)))', opacity: 0.9 }}>{summary}</p>
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
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => <Badge key={index} variant="outline" className="text-base py-1 px-3 shadow-sm">{skill}</Badge>)}
                    </div>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { type PortfolioData, PersonalInfo, Project, SocialLink, type ColorPalette } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Github, Linkedin } from 'lucide-react';
import { getPublicPortfolioAction } from '@/app/actions';
import { BrandLoader } from '@/components/brand-loader';
import { notFound } from 'next/navigation';

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
            </div>
        </div>
    </div>
  );
}

function PublicPortfolioPageContent({ params }: { params: { id: string } }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPortfolio = async () => {
      const portfolioId = params.id;
      if (!portfolioId) {
        setIsLoading(false);
        return notFound();
      }

      try {
        const result = await getPublicPortfolioAction(portfolioId);
        if (result.success && result.data) {
          setPortfolio(result.data);
        } else {
          throw new Error(result.error || 'Portfolio not found.');
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [params.id, toast]);

  const SocialIcon = ({ platform, className }: { platform: string, className?: string }) => {
    const lowerCasePlatform = platform.toLowerCase();
    if (lowerCasePlatform.includes('github')) return <Github className={className} />;
    if (lowerCasePlatform.includes('linkedin')) return <Linkedin className={className} />;
    return <Globe className={className} />;
  };

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

  if (!portfolio) {
    return notFound();
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
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--p-bg, hsl(var(--muted)/0.4))' }}>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl" style={portfolioStyles}>
        <div className="rounded-xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--p-secondary, hsl(var(--card)))', color: 'var(--p-fg, hsl(var(--foreground)))' }}>
          {/* Profile Header */}
          <div className="p-6 md:p-8 md:flex md:items-center md:gap-8 border-b" style={{ borderColor: 'var(--p-primary, hsl(var(--border)))' }}>
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <Image
                unoptimized
                src={personalInfo?.profilePictureUrl || 'https://placehold.co/128x128.png'}
                alt={`${personalInfo?.name || 'User'}'s profile picture`}
                width={128}
                height={128}
                className="rounded-full object-cover h-24 w-24 md:h-32 md:w-32 border-4 shadow-md"
                style={{ borderColor: 'var(--p-primary, hsl(var(--primary)))' }}
                priority
              />
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
          {/* Main Content */}
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
                        {project.previewImage && <Image src={project.previewImage} alt={`${project.name} preview`} width={800} height={450} className="rounded-lg mb-4 border" style={{ borderColor: 'var(--p-border, hsl(var(--border)))' }} />}
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
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>Powered by <a href="/" className="font-semibold hover:underline" style={{color: 'var(--p-primary)'}}>ResuAI</a></p>
        </div>
      </main>
    </div>
  );
}

export default function PublicPortfolioPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<PortfolioSkeleton />}>
            <PublicPortfolioPageContent params={params} />
        </Suspense>
    )
}

    
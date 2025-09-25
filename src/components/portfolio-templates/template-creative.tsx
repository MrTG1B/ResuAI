
'use client';

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Languages, Smile, FileText } from "lucide-react";
import { type PortfolioData } from "@/types/portfolio";
import { SocialIcon } from "./social-icon";
import { cn } from "@/lib/utils";

interface TemplateProps {
    portfolioData: PortfolioData;
}

export function TemplateCreative({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': '#1a1a1a',
        '--p-fg': '#e0e0e0',
        '--p-primary': '#ff4757',
        '--p-secondary': '#2c2c2c',
        '--p-accent': '#5352ed',
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-sans" style={portfolioStyles}>
            <div className="max-w-5xl mx-auto" style={{ backgroundColor: 'var(--p-bg)', color: 'var(--p-fg)' }}>
                {/* Header */}
                <header className="p-8 relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-accent)] opacity-20 blur-3xl"></div>
                    {personalInfo?.profilePictureUrl && (
                        <Image
                            unoptimized
                            src={personalInfo.profilePictureUrl}
                            alt={`${personalInfo.name || 'User'}'s profile picture`}
                            width={144}
                            height={144}
                            className="rounded-full object-cover h-36 w-36 border-4 shadow-lg mx-auto z-10 relative"
                            style={{ borderColor: 'var(--p-primary)' }}
                        />
                    )}
                    <h1 className="text-5xl font-bold tracking-tight font-heading mt-4 z-10 relative">{personalInfo?.name}</h1>
                    <p className="text-xl mt-1 opacity-90 z-10 relative" style={{ color: 'var(--p-accent)' }}>{personalInfo?.title}</p>
                </header>

                <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Rail */}
                    <aside className="md:col-span-4 space-y-8">
                        <Section icon={BookUser} title="Contact & Info">
                            <div className="space-y-3 text-sm">
                                {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-3 hover:underline"><Mail className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--p-accent)' }} /><span>{personalInfo.email}</span></a>}
                                {personalInfo?.phone && <span className="flex items-center gap-3"><Phone className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--p-accent)' }} /><span>{personalInfo.phone}</span></span>}
                                {personalInfo?.location && <span className="flex items-center gap-3"><MapPin className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--p-accent)' }} /><span>{personalInfo.location}</span></span>}
                            </div>
                             {personalInfo?.socials && personalInfo.socials.length > 0 && (
                                <div className="mt-4 flex flex-wrap items-center gap-4">
                                    {personalInfo.socials.map((social, index) => (
                                        <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform} style={{ color: 'var(--p-fg)' }}>
                                            <SocialIcon platform={social.platform} className="h-6 w-6" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </Section>
                        {skills && skills.length > 0 && <Section icon={Wrench} title="Skills"><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <Badge key={index} className="text-base py-1 px-3" style={{backgroundColor: 'var(--p-secondary)', color: 'var(--p-fg)'}}>{skill}</Badge>)}</div></Section>}
                        {education && education.length > 0 && <Section icon={GraduationCap} title="Education">{education.map((edu, index) => <InfoItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                        {languages && languages.length > 0 && <Section icon={Languages} title="Languages">{languages.map((lang, index) => <InfoItem key={index} title={lang.language} subtitle={lang.proficiency} />)}</Section>}
                    </aside>

                    {/* Right Content */}
                    <main className="md:col-span-8 space-y-8">
                        {summary && <Section icon={BookUser} title="About Me"><p className="text-lg leading-relaxed">{summary}</p></Section>}
                        {experience && experience.length > 0 && <Section icon={Briefcase} title="Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={`${job.company} - ${job.location}`} date={job.dates} items={job.description} />)}</Section>}
                        {projects && projects.length > 0 && <Section icon={Lightbulb} title="Projects"><div className="grid grid-cols-1 gap-6">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</div></Section>}
                        {certifications && certifications.length > 0 && <Section icon={Award} title="Certifications">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</Section>}
                        {publications && publications.length > 0 && <Section icon={FileText} title="Publications">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</Section>}
                        {interests && interests.length > 0 && <Section icon={Smile} title="Interests"><p className="text-sm">{interests.join(', ')}</p></Section>}
                    </main>
                </div>
            </div>
        </div>
    );
}

const Section = ({ icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => {
    const Icon = icon;
    return (
        <section>
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 font-heading" style={{ color: 'var(--p-primary)' }}><Icon /> {title}</h2>
            <div className="space-y-4 text-sm">
                {children}
            </div>
        </section>
    )
};

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items: string[] }) => (
    <div>
        <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-xs opacity-70">{date}</p>
        </div>
        <p className="text-md font-medium" style={{ color: 'var(--p-accent)' }}>{subtitle}</p>
        <ul className="mt-2 list-disc list-inside space-y-1 opacity-90">
            {items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

const InfoItem = ({ title, subtitle, date }: { title: string, subtitle?: string, date?: string }) => (
    <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-sm" style={{ color: 'var(--p-accent)' }}>{subtitle}</p>}
        {date && <p className="text-xs opacity-70">{date}</p>}
    </div>
);

const ProjectItem = ({ name, description, technologies, url, previewImage }: { name: string, description: string, technologies?: string[], url?: string, previewImage?: string }) => (
    <div className="rounded-lg p-4 transition-all" style={{ backgroundColor: 'var(--p-secondary)' }}>
        {previewImage && <Image src={previewImage} alt={`${name} preview`} width={800} height={450} className="rounded-md mb-4 border" style={{ borderColor: 'var(--p-accent)' }} />}
        <h3 className="font-semibold text-lg">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline break-all" style={{ color: 'var(--p-accent)' }}>{url}</a>}
        <p className="mt-2 opacity-90">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {technologies.map(tech => <Badge key={tech} className="text-xs" style={{backgroundColor: 'var(--p-bg)', color: 'var(--p-fg)'}}>{tech}</Badge>)}
            </div>
        )}
    </div>
);

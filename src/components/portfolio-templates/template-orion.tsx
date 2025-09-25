
'use client';

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Languages, Smile, FileText } from "lucide-react";
import { type PortfolioData } from "@/types/portfolio";
import { SocialIcon } from "./social-icon";
import { Separator } from "../ui/separator";

interface TemplateProps {
    portfolioData: PortfolioData;
}

export function TemplateOrion({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': '#1e293b',
        '--p-fg': '#e2e8f0',
        '--p-primary': '#38bdf8',
        '--p-secondary': '#334155',
        '--p-accent': '#f472b6',
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-sans" style={portfolioStyles}>
            <div className="max-w-5xl mx-auto flex" style={{ backgroundColor: 'var(--p-bg)', color: 'var(--p-fg)' }}>
                {/* Left Fixed Rail */}
                <aside className="w-1/3 p-8" style={{ backgroundColor: 'var(--p-secondary)' }}>
                    <div className="sticky top-8">
                        {personalInfo?.profilePictureUrl && (
                            <Image
                                unoptimized
                                src={personalInfo.profilePictureUrl}
                                alt={`${personalInfo.name || 'User'}'s profile picture`}
                                width={160}
                                height={160}
                                className="rounded-full object-cover h-40 w-40 border-4 shadow-lg mx-auto"
                                style={{ borderColor: 'var(--p-primary)' }}
                            />
                        )}
                        <div className="text-center mt-6">
                            <h1 className="text-3xl font-bold tracking-tight font-heading">{personalInfo?.name}</h1>
                            <p className="text-lg mt-1" style={{ color: 'var(--p-primary)' }}>{personalInfo?.title}</p>
                        </div>
                        <Separator className="my-6 bg-slate-500" />
                        <div className="space-y-4 text-sm">
                            <h3 className="font-semibold text-base" style={{ color: 'var(--p-primary)' }}>Contact</h3>
                            {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-3 hover:underline"><Mail className="h-4 w-4 flex-shrink-0" /><span>{personalInfo.email}</span></a>}
                            {personalInfo?.phone && <span className="flex items-center gap-3"><Phone className="h-4 w-4 flex-shrink-0" /><span>{personalInfo.phone}</span></span>}
                            {personalInfo?.location && <span className="flex items-center gap-3"><MapPin className="h-4 w-4 flex-shrink-0" /><span>{personalInfo.location}</span></span>}
                        </div>
                        <Separator className="my-6 bg-slate-500" />
                        <div className="space-y-4">
                            <h3 className="font-semibold text-base" style={{ color: 'var(--p-primary)' }}>Skills</h3>
                            <div className="flex flex-wrap gap-2">{skills?.map((skill, index) => <Badge key={index} style={{ backgroundColor: 'var(--p-primary)', color: 'var(--p-bg)' }}>{skill}</Badge>)}</div>
                        </div>
                         <Separator className="my-6 bg-slate-500" />
                        {personalInfo?.socials && personalInfo.socials.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-base" style={{ color: 'var(--p-primary)' }}>Socials</h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    {personalInfo.socials.map((social, index) => (
                                        <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform}>
                                            <SocialIcon platform={social.platform} className="h-6 w-6" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Scrollable Content */}
                <main className="w-2/3 p-8 space-y-10">
                    {summary && <Section title="About Me"><p className="text-lg leading-relaxed">{summary}</p></Section>}
                    {experience && experience.length > 0 && <Section title="Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={`${job.company} - ${job.location}`} date={job.dates} items={job.description} />)}</Section>}
                    {projects && projects.length > 0 && <Section title="Projects"><div className="grid grid-cols-1 gap-6">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</div></Section>}
                    {education && education.length > 0 && <Section title="Education">{education.map((edu, index) => <TimelineItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                    {certifications && certifications.length > 0 && <Section title="Certifications"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</div></Section>}
                    {publications && publications.length > 0 && <Section title="Publications"><div className="space-y-4">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</div></Section>}
                </main>
            </div>
        </div>
    );
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section>
        <h2 className="text-2xl font-bold font-heading mb-4" style={{ color: 'var(--p-primary)' }}>{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </section>
);

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items?: string[] }) => (
    <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:h-full before:w-px before:bg-slate-600 after:absolute after:left-[7px] after:top-2 after:h-2.5 after:w-2.5 after:rounded-full" style={{ '::after': { backgroundColor: 'var(--p-primary)'}}}>
        <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-xs opacity-70">{date}</p>
        </div>
        <p className="text-md font-medium" style={{ color: 'var(--p-accent)' }}>{subtitle}</p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-sm opacity-90">
            {items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

const InfoItem = ({ title, subtitle, date }: { title: string, subtitle?: string, date?: string }) => (
    <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
        {date && <p className="text-xs opacity-70">{date}</p>}
    </div>
);

const ProjectItem = ({ name, description, technologies, url }: { name: string, description: string, technologies?: string[], url?: string }) => (
     <div className="rounded-lg p-4 transition-all" style={{ backgroundColor: 'var(--p-secondary)' }}>
        <h3 className="font-semibold text-lg">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline break-all" style={{ color: 'var(--p-accent)' }}>{url}</a>}
        <p className="mt-2 opacity-90 text-sm">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {technologies.map(tech => <Badge key={tech} className="text-xs" style={{backgroundColor: 'var(--p-primary)', color: 'var(--p-bg)'}}>{tech}</Badge>)}
            </div>
        )}
    </div>
);

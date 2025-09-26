
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

export function TemplateGeist({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': '#ffffff',
        '--p-fg': '#111827',
        '--p-primary': '#0070f3',
        '--p-secondary': '#fafafa',
        '--p-accent': '#7928ca',
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-sans" style={portfolioStyles}>
            <div className="p-12" style={{ backgroundColor: 'var(--p-bg)', color: 'var(--p-fg)' }}>
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between pb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight font-heading">{personalInfo?.name}</h1>
                        <p className="text-lg mt-1" style={{ color: 'var(--p-primary)' }}>{personalInfo?.title}</p>
                    </div>
                    <div className="text-sm text-right mt-4 md:mt-0">
                        {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="block hover:underline">{personalInfo.email}</a>}
                        {personalInfo?.phone && <span className="block">{personalInfo.phone}</span>}
                        {personalInfo?.location && <span className="block">{personalInfo.location}</span>}
                         {personalInfo?.socials && (
                            <div className="flex justify-end gap-3 mt-2">
                                {personalInfo.socials.map((social, index) => (
                                    <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform} style={{ color: 'var(--p-fg)' }}>
                                        <SocialIcon platform={social.platform} className="h-5 w-5" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <main className="space-y-10">
                    {summary && <Section><p className="text-center italic" style={{color: 'var(--p-accent)'}}>{summary}</p></Section>}
                    
                    {skills && skills.length > 0 && <Section title="Skills"><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <Badge key={index} variant="secondary">{skill}</Badge>)}</div></Section>}
                    
                    {experience && experience.length > 0 && <Section title="Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={job.company} date={job.dates} items={job.description} />)}</Section>}
                    
                    {projects && projects.length > 0 && <Section title="Projects">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</Section>}
                    
                    {education && education.length > 0 && <Section title="Education">{education.map((edu, index) => <TimelineItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                    
                    {certifications && certifications.length > 0 && <Section title="Certifications"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</div></Section>}
                    
                    {publications && publications.length > 0 && <Section title="Publications"><div className="space-y-4">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</div></Section>}
                    
                    <div className="grid grid-cols-2 gap-8">
                        {languages && languages.length > 0 && <Section title="Languages">{languages.map((lang, index) => <p key={index}><span className="font-semibold">{lang.language}:</span> {lang.proficiency}</p>)}</Section>}
                        {interests && interests.length > 0 && <Section title="Interests"><p className="text-sm text-gray-600">{interests.join(', ')}</p></Section>}
                    </div>
                </main>
            </div>
        </div>
    );
}

const Section = ({ title, children }: { title?: string, children: React.ReactNode }) => (
    <section>
        {title && <h2 className="text-xl font-bold font-heading mb-4 border-b pb-2" style={{ color: 'var(--p-primary)', borderColor: 'var(--p-primary)' }}>{title}</h2>}
        <div className="space-y-4">
            {children}
        </div>
    </section>
);

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items?: string[] }) => (
    <div className="mb-4">
        <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-base">{title} at <span className="font-bold" style={{color: 'var(--p-accent)'}}>{subtitle}</span></h3>
            <p className="text-xs text-gray-500">{date}</p>
        </div>
        <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-gray-700">
            {items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

const InfoItem = ({ title, subtitle, date }: { title: string, subtitle?: string, date?: string }) => (
    <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        {date && <p className="text-xs text-gray-500">{date}</p>}
    </div>
);

const ProjectItem = ({ name, description, technologies, url }: { name: string, description: string, technologies?: string[], url?: string }) => (
     <div className="mb-4">
        <h3 className="font-semibold">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: 'var(--p-primary)' }}>{url}</a>}
        <p className="mt-1 text-sm text-gray-700">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
                {technologies.map(tech => <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>)}
            </div>
        )}
    </div>
);

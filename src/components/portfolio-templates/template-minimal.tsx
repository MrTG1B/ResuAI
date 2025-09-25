
'use client';

import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Languages, Smile, FileText } from "lucide-react";
import { type PortfolioData } from "@/types/portfolio";
import { SocialIcon } from "./social-icon";

interface TemplateProps {
    portfolioData: PortfolioData;
}

export function TemplateMinimal({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': '#ffffff',
        '--p-fg': '#333333',
        '--p-primary': '#1a1a1a',
        '--p-secondary': '#f0f0f0',
        '--p-accent': '#888888',
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-serif" style={portfolioStyles}>
            <div className="max-w-4xl mx-auto p-12" style={{ backgroundColor: 'var(--p-bg)', color: 'var(--p-fg)' }}>
                {/* Header */}
                <header className="text-center pb-8 border-b" style={{ borderColor: 'var(--p-primary)' }}>
                    <h1 className="text-5xl font-bold tracking-wider font-heading uppercase" style={{ color: 'var(--p-primary)' }}>{personalInfo?.name}</h1>
                    <p className="text-lg mt-2 tracking-widest" style={{ color: 'var(--p-accent)' }}>{personalInfo?.title}</p>
                </header>

                 {/* Contact */}
                <div className="text-center my-8 text-xs tracking-wider" style={{ color: 'var(--p-accent)' }}>
                    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
                        {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="hover:underline">{personalInfo.email}</a>}
                        {personalInfo?.phone && <span>{personalInfo.phone}</span>}
                        {personalInfo?.location && <span>{personalInfo.location}</span>}
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="space-y-12">
                    {summary && <Section title="Summary"><p className="leading-relaxed text-center">{summary}</p></Section>}
                    {skills && skills.length > 0 && <Section title="Skills"><div className="flex flex-wrap justify-center gap-2">{skills.map((skill, index) => <Badge key={index} variant="outline" className="text-sm font-normal border-gray-400">{skill}</Badge>)}</div></Section>}
                    {experience && experience.length > 0 && <Section title="Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={job.company} date={job.dates} items={job.description} />)}</Section>}
                    {projects && projects.length > 0 && <Section title="Projects">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</Section>}
                    {education && education.length > 0 && <Section title="Education">{education.map((edu, index) => <TimelineItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                    {certifications && certifications.length > 0 && <Section title="Certifications">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</Section>}
                    {publications && publications.length > 0 && <Section title="Publications">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</Section>}
                    {languages && languages.length > 0 && <Section title="Languages"><p className="text-center">{languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}</p></Section>}
                    {interests && interests.length > 0 && <Section title="Interests"><p className="text-center text-sm" style={{color: 'var(--p-accent)'}}>{interests.join(' · ')}</p></Section>}
                </main>
                 {/* Socials */}
                {personalInfo?.socials && personalInfo.socials.length > 0 && (
                    <footer className="text-center mt-12 pt-8 border-t" style={{ borderColor: 'var(--p-secondary)' }}>
                        <div className="flex flex-wrap justify-center items-center gap-6">
                            {personalInfo.socials.map((social, index) => (
                                <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform} style={{ color: 'var(--p-accent)' }} className="hover:text-[var(--p-primary)]">
                                    <SocialIcon platform={social.platform} className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section>
        <h2 className="text-sm font-bold text-center tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--p-accent)' }}>{title}</h2>
        <div className="space-y-6">
            {children}
        </div>
    </section>
);

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items?: string[] }) => (
    <div className="grid grid-cols-4 gap-4 items-start">
        <div className="col-span-1 text-right">
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm" style={{color: 'var(--p-accent)'}}>{subtitle}</p>
            <p className="text-xs mt-1" style={{color: 'var(--p-accent)'}}>{date}</p>
        </div>
        <div className="col-span-3 border-l-2 pl-4" style={{borderColor: 'var(--p-secondary)'}}>
            <ul className="list-disc list-inside space-y-1 text-sm">
                {items?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    </div>
);

const InfoItem = ({ title, subtitle, date }: { title: string, subtitle: string, date?: string }) => (
    <div className="text-center">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm" style={{color: 'var(--p-accent)'}}>{subtitle}</p>
        {date && <p className="text-xs mt-1" style={{color: 'var(--p-accent)'}}>{date}</p>}
    </div>
);

const ProjectItem = ({ name, description, technologies, url }: { name: string, description: string, technologies?: string[], url?: string }) => (
    <div className="text-center">
        <h3 className="font-bold">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: 'var(--p-accent)' }}>{url}</a>}
        <p className="mt-1 text-sm">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
                {technologies.map(tech => <Badge key={tech} variant="outline" className="text-xs border-gray-300">{tech}</Badge>)}
            </div>
        )}
    </div>
);

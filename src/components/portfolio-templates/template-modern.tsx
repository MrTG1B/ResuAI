
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

export function TemplateModern({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': colorPalette.background,
        '--p-fg': colorPalette.foreground,
        '--p-primary': colorPalette.primary,
        '--p-secondary': colorPalette.secondary,
        '--p-accent': colorPalette.accent,
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-sans" style={portfolioStyles}>
            <div className="grid grid-cols-12 max-w-5xl mx-auto" style={{ backgroundColor: 'var(--p-bg)', color: 'var(--p-fg)' }}>
                {/* Left Rail */}
                <aside className="col-span-4 p-8" style={{ backgroundColor: 'var(--p-secondary)' }}>
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

                    <div className="mt-8 space-y-6">
                        <Section icon={BookUser} title="Contact">
                            <div className="space-y-2 text-sm">
                                {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-3 hover:underline"><Mail className="h-4 w-4" /><span>{personalInfo.email}</span></a>}
                                {personalInfo?.phone && <span className="flex items-center gap-3"><Phone className="h-4 w-4" /><span>{personalInfo.phone}</span></span>}
                                {personalInfo?.location && <span className="flex items-center gap-3"><MapPin className="h-4 w-4" /><span>{personalInfo.location}</span></span>}
                            </div>
                        </Section>

                        {skills && skills.length > 0 && <Section icon={Wrench} title="Skills"><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <Badge key={index} style={{ backgroundColor: 'var(--p-primary)', color: 'var(--p-fg)' }}>{skill}</Badge>)}</div></Section>}
                        {education && education.length > 0 && <Section icon={GraduationCap} title="Education">{education.map((edu, index) => <InfoItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                        {languages && languages.length > 0 && <Section icon={Languages} title="Languages">{languages.map((lang, index) => <InfoItem key={index} title={lang.language} subtitle={lang.proficiency} />)}</Section>}

                        {personalInfo?.socials && personalInfo.socials.length > 0 && (
                            <Section icon={Globe} title="Socials">
                                <div className="flex flex-wrap items-center gap-4">
                                    {personalInfo.socials.map((social, index) => (
                                        <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform}>
                                            <SocialIcon platform={social.platform} className="h-6 w-6" />
                                        </a>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>
                </aside>

                {/* Right Content */}
                <main className="col-span-8 p-8 space-y-10">
                    {summary && <Section icon={BookUser} title="About Me"><p className="text-lg leading-relaxed">{summary}</p></Section>}
                    {experience && experience.length > 0 && <Section icon={Briefcase} title="Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={`${job.company} - ${job.location}`} date={job.dates} items={job.description} />)}</Section>}
                    {projects && projects.length > 0 && <Section icon={Lightbulb} title="Projects"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</div></Section>}
                    {certifications && certifications.length > 0 && <Section icon={Award} title="Certifications"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</div></Section>}
                    {publications && publications.length > 0 && <Section icon={FileText} title="Publications"><div className="space-y-4">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</div></Section>}
                    {interests && interests.length > 0 && <Section icon={Smile} title="Interests"><p className="text-sm">{interests.join(', ')}</p></Section>}
                </main>
            </div>
        </div>
    );
}

const Section = ({ icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => {
    const Icon = icon;
    return (
        <section>
            <h2 className="text-xl font-bold flex items-center gap-3 mb-4 font-heading" style={{ color: 'var(--p-primary)' }}><Icon /> {title}</h2>
            <div className="space-y-4 text-sm">
                {children}
            </div>
        </section>
    )
};

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items: string[] }) => (
    <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:h-full before:w-px before:bg-gray-200 after:absolute after:left-[7px] after:top-2 after:h-2.5 after:w-2.5 after:rounded-full" style={{ '::after': { backgroundColor: 'var(--p-primary)'}}}>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-md font-medium" style={{ color: 'var(--p-primary)' }}>{subtitle}</p>
        <p className="text-xs opacity-70 mb-2">{date}</p>
        <ul className="list-disc list-inside space-y-1 opacity-90">
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

const ProjectItem = ({ name, description, technologies, url, previewImage }: { name: string, description: string, technologies?: string[], url?: string, previewImage?: string }) => (
    <div className="rounded-lg p-4 transition-all" style={{ backgroundColor: 'var(--p-secondary)' }}>
        {previewImage && <Image src={previewImage} alt={`${name} preview`} width={400} height={225} className="rounded-md mb-4 border" style={{ borderColor: 'var(--p-primary)' }} />}
        <h3 className="font-semibold text-lg">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline break-all" style={{ color: 'var(--p-accent)' }}>{url}</a>}
        <p className="mt-2 opacity-90 text-sm">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {technologies.map(tech => <Badge key={tech} className="text-xs" style={{backgroundColor: 'var(--p-primary)', color: 'var(--p-fg)'}}>{tech}</Badge>)}
            </div>
        )}
    </div>
);

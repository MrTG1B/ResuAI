
'use client';

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Github, Linkedin, Languages, Smile, FileText } from "lucide-react";
import { type PortfolioData } from "@/types/portfolio";
import { SocialIcon } from "./social-icon";

interface TemplateProps {
    portfolioData: PortfolioData;
}

export function TemplateClassic({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': colorPalette.background,
        '--p-fg': colorPalette.foreground,
        '--p-primary': colorPalette.primary,
        '--p-secondary': colorPalette.secondary,
        '--p-accent': colorPalette.accent,
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-sans" style={{ backgroundColor: 'var(--p-bg, #ffffff)', color: 'var(--p-fg, #111827)', ...portfolioStyles }}>
            <div className="max-w-5xl mx-auto p-8" style={{ backgroundColor: 'var(--p-secondary, #f9fafb)' }}>
                {/* Profile Header */}
                <header className="md:flex md:items-center md:gap-8 pb-8 border-b" style={{ borderColor: 'var(--p-primary, #e5e7eb)' }}>
                    {personalInfo?.profilePictureUrl && (
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                            <div className="relative h-32 w-32 group">
                                <Image
                                    unoptimized
                                    src={personalInfo.profilePictureUrl}
                                    alt={`${personalInfo.name || 'User'}'s profile picture`}
                                    width={128}
                                    height={128}
                                    className="rounded-full object-cover h-full w-full border-4 shadow-md"
                                    style={{ borderColor: 'var(--p-primary, #e5e7eb)' }}
                                    priority
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex-1 text-center md:text-left mt-6 md:mt-0">
                        <h1 className="text-4xl font-bold tracking-tight font-heading" style={{ color: 'var(--p-primary, #111827)' }}>{personalInfo?.name}</h1>
                        <p className="text-xl mt-1" style={{ color: 'var(--p-fg, #4b5563)', opacity: 0.8 }}>{personalInfo?.title}</p>
                        <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-sm">
                            {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2 hover:underline"><Mail className="h-4 w-4" style={{ color: 'var(--p-primary, #4b5563)' }} />{personalInfo.email}</a>}
                            {personalInfo?.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: 'var(--p-primary, #4b5563)' }} />{personalInfo.phone}</span>}
                            {personalInfo?.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: 'var(--p-primary, #4b5563)' }} />{personalInfo.location}</span>}
                        </div>
                        {personalInfo?.socials && personalInfo.socials.length > 0 && (
                            <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-4">
                                {personalInfo.socials.map((social, index) => (
                                    <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform} style={{ color: 'var(--p-fg, #4b5563)' }}>
                                        <SocialIcon platform={social.platform} className="h-6 w-6" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="pt-8 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
                    <div className="lg:col-span-2 space-y-12">
                        {summary && <Section icon={BookUser} title="Professional Summary"><p className="whitespace-pre-line leading-relaxed" style={{ opacity: 0.9 }}>{summary}</p></Section>}
                        {experience && experience.length > 0 && <Section icon={Briefcase} title="Work Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={`${job.company} - ${job.location}`} date={job.dates} items={job.description} />)}</Section>}
                        {projects && projects.length > 0 && <Section icon={Lightbulb} title="Projects">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</Section>}
                    </div>
                    {/* Right Column */}
                    <aside className="lg:col-span-1 space-y-12">
                        {skills && skills.length > 0 && <Section icon={Wrench} title="Skills"><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <Badge key={index} variant="outline" className="text-base py-1 px-3 shadow-sm">{skill}</Badge>)}</div></Section>}
                        {education && education.length > 0 && <Section icon={GraduationCap} title="Education">{education.map((edu, index) => <InfoItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                        {certifications && certifications.length > 0 && <Section icon={Award} title="Certifications">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</Section>}
                        {publications && publications.length > 0 && <Section icon={FileText} title="Publications">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</Section>}
                        {languages && languages.length > 0 && <Section icon={Languages} title="Languages">{languages.map((lang, index) => <InfoItem key={index} title={lang.language} subtitle={lang.proficiency} />)}</Section>}
                        {interests && interests.length > 0 && <Section icon={Smile} title="Interests"><div className="flex flex-wrap gap-2">{interests.map((interest, index) => <Badge key={index} variant="secondary">{interest}</Badge>)}</div></Section>}
                    </aside>
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
            <div className="space-y-4">
                {children}
            </div>
        </section>
    )
};

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items: string[] }) => (
    <div className="pl-6 border-l-2 relative" style={{ borderColor: 'var(--p-primary)' }}>
        <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4" style={{ backgroundColor: 'var(--p-primary)', borderColor: 'var(--p-secondary)' }}></div>
        <h3 className="font-semibold text-lg font-heading">{title}</h3>
        <p className="text-md font-medium" style={{ color: 'var(--p-primary)' }}>{subtitle}</p>
        <p className="text-sm opacity-80">{date}</p>
        <ul className="mt-2 list-disc list-inside space-y-1.5 opacity-90">
            {items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

const InfoItem = ({ title, subtitle, date }: { title: string, subtitle?: string, date?: string }) => (
    <div>
        <h3 className="font-semibold text-lg font-heading">{title}</h3>
        {subtitle && <p className="text-sm font-medium" style={{ color: 'var(--p-primary)' }}>{subtitle}</p>}
        {date && <p className="text-xs opacity-80">{date}</p>}
    </div>
);

const ProjectItem = ({ name, description, technologies, url, previewImage }: { name: string, description: string, technologies?: string[], url?: string, previewImage?: string }) => (
    <div className="pl-6 border-l-2 relative" style={{ borderColor: 'var(--p-primary)' }}>
        <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4" style={{ backgroundColor: 'var(--p-primary)', borderColor: 'var(--p-secondary)' }}></div>
        {previewImage && <Image src={previewImage} alt={`${name} preview`} width={800} height={450} className="rounded-lg mb-4 border" />}
        <h3 className="font-semibold text-lg font-heading">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--p-accent)' }}>{url}</a>}
        <p className="mt-2 opacity-90">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {technologies.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
            </div>
        )}
    </div>
);

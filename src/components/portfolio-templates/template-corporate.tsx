
'use client';

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Wrench, Lightbulb, BookUser, Mail, Phone, Globe, MapPin, Award, Github, Linkedin, Languages, Smile, FileText } from "lucide-react";
import { type PortfolioData } from "@/types/portfolio";
import { SocialIcon } from "./social-icon";

interface TemplateProps {
    portfolioData: PortfolioData;
}

export function TemplateCorporate({ portfolioData }: TemplateProps) {
    const { personalInfo, summary, experience, education, skills, projects, certifications, colorPalette, languages, interests, publications } = portfolioData;

    const portfolioStyles = colorPalette ? {
        '--p-bg': '#F8F9FA',
        '--p-fg': '#212529',
        '--p-primary': '#005A9C',
        '--p-secondary': '#FFFFFF',
        '--p-accent': '#007BFF',
    } as React.CSSProperties : {};

    return (
        <div className="w-full font-sans" style={portfolioStyles}>
            <div style={{ backgroundColor: 'var(--p-bg)' }}>
                {/* Header */}
                <header className="p-8 text-white" style={{ backgroundColor: 'var(--p-primary)' }}>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {personalInfo?.profilePictureUrl && (
                            <Image
                                unoptimized
                                src={personalInfo.profilePictureUrl}
                                alt={`${personalInfo.name || 'User'}'s profile picture`}
                                width={128}
                                height={128}
                                className="rounded-full object-cover h-32 w-32 border-4 border-white shadow-lg"
                            />
                        )}
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold tracking-tight font-heading">{personalInfo?.name}</h1>
                            <p className="text-xl mt-1 opacity-90">{personalInfo?.title}</p>
                        </div>
                    </div>
                </header>

                {/* Contact & Socials Bar */}
                <div className="bg-white p-4 shadow-md">
                    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--p-fg)' }}>
                        {personalInfo?.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2 hover:underline"><Mail className="h-4 w-4" style={{ color: 'var(--p-primary)' }} />{personalInfo.email}</a>}
                        {personalInfo?.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: 'var(--p-primary)' }} />{personalInfo.phone}</span>}
                        {personalInfo?.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: 'var(--p-primary)' }} />{personalInfo.location}</span>}
                        {personalInfo?.socials?.map((social, index) => (
                            <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                                <SocialIcon platform={social.platform} className="h-4 w-4" />
                                {social.platform}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="md:col-span-1 space-y-8">
                        {summary && <Section icon={BookUser} title="About Me"><p className="text-sm leading-relaxed">{summary}</p></Section>}
                        {skills && skills.length > 0 && <Section icon={Wrench} title="Skills"><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <Badge key={index} className="bg-gray-200 text-gray-800">{skill}</Badge>)}</div></Section>}
                        {education && education.length > 0 && <Section icon={GraduationCap} title="Education">{education.map((edu, index) => <InfoItem key={index} title={edu.degree} subtitle={edu.school} date={edu.dates} />)}</Section>}
                        {certifications && certifications.length > 0 && <Section icon={Award} title="Certifications">{certifications.map((cert, index) => <InfoItem key={index} title={cert.name} subtitle={cert.issuingOrganization} date={cert.date} />)}</Section>}
                        {languages && languages.length > 0 && <Section icon={Languages} title="Languages">{languages.map((lang, index) => <InfoItem key={index} title={lang.language} subtitle={lang.proficiency} />)}</Section>}
                    </div>

                    {/* Right Column */}
                    <div className="md:col-span-2 space-y-8">
                        {experience && experience.length > 0 && <Section icon={Briefcase} title="Work Experience">{experience.map((job, index) => <TimelineItem key={index} title={job.role} subtitle={`${job.company} - ${job.location}`} date={job.dates} items={job.description} />)}</Section>}
                        {projects && projects.length > 0 && <Section icon={Lightbulb} title="Projects">{projects.map((project, index) => <ProjectItem key={index} {...project} />)}</Section>}
                        {publications && publications.length > 0 && <Section icon={FileText} title="Publications">{publications.map((pub, index) => <InfoItem key={index} title={pub.title} subtitle={pub.journal} date={pub.date} />)}</Section>}
                    </div>
                </main>
            </div>
        </div>
    );
}

const Section = ({ icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => {
    const Icon = icon;
    return (
        <section>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 font-heading border-b-2 pb-2" style={{ color: 'var(--p-primary)', borderColor: 'var(--p-primary)' }}><Icon /> {title}</h2>
            <div className="space-y-4 text-gray-700">
                {children}
            </div>
        </section>
    )
};

const TimelineItem = ({ title, subtitle, date, items }: { title: string, subtitle: string, date: string, items: string[] }) => (
    <div className="mb-6">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-md font-medium" style={{ color: 'var(--p-primary)' }}>{subtitle}</p>
        <p className="text-sm text-gray-500 mb-2">{date}</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
     <div className="mb-6">
        <h3 className="font-semibold text-lg">{name}</h3>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--p-accent)' }}>{url}</a>}
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        {technologies && technologies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
                {technologies.map(tech => <Badge key={tech} className="bg-gray-200 text-gray-800 text-xs">{tech}</Badge>)}
            </div>
        )}
    </div>
);

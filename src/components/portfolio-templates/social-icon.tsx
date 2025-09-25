
'use client';
import { Github, Linkedin, Globe } from "lucide-react";

export const SocialIcon = ({ platform, className }: { platform: string, className?: string }) => {
    const lowerCasePlatform = platform.toLowerCase();
    if (lowerCasePlatform.includes('github')) {
        return <Github className={className} />;
    }
    if (lowerCasePlatform.includes('linkedin')) {
        return <Linkedin className={className} />;
    }
    return <Globe className={className} />;
};

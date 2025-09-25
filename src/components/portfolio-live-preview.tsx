
'use client';

import { type PortfolioData } from "@/types/portfolio";
import { TemplateClassic } from "./portfolio-templates/template-classic";
import { TemplateModern } from "./portfolio-templates/template-modern";
import { TemplateMinimal } from "./portfolio-templates/template-minimal";
import { TemplateCreative } from "./portfolio-templates/template-creative";
import { TemplateCorporate } from "./portfolio-templates/template-corporate";
import { TemplateGeist } from "./portfolio-templates/template-geist";
import { TemplateOrion } from "./portfolio-templates/template-orion";

interface PortfolioLivePreviewProps {
    portfolioData: PortfolioData;
}

export function PortfolioLivePreview({ portfolioData }: PortfolioLivePreviewProps) {
    const templateId = portfolioData.templateId || 'classic';

    const renderTemplate = () => {
        switch (templateId) {
            case 'classic':
                return <TemplateClassic portfolioData={portfolioData} />;
            case 'modern':
                return <TemplateModern portfolioData={portfolioData} />;
            case 'minimal':
                return <TemplateMinimal portfolioData={portfolioData} />;
            case 'creative':
                return <TemplateCreative portfolioData={portfolioData} />;
            case 'corporate':
                return <TemplateCorporate portfolioData={portfolioData} />;
            case 'geist':
                return <TemplateGeist portfolioData={portfolioData} />;
            case 'orion':
                return <TemplateOrion portfolioData={portfolioData} />;
            default:
                return <TemplateClassic portfolioData={portfolioData} />;
        }
    };

    return (
        <div className="w-full">
            {renderTemplate()}
        </div>
    );
}


'use client';

import { type PortfolioData, type TemplateId } from '@/types/portfolio';
import { TemplateClassic } from './portfolio-templates/template-classic';
import { TemplateModern } from './portfolio-templates/template-modern';
import { TemplateMinimal } from './portfolio-templates/template-minimal';
import { TemplateCreative } from './portfolio-templates/template-creative';
import { TemplateCorporate } from './portfolio-templates/template-corporate';
import { TemplateGeist } from './portfolio-templates/template-geist';
import { TemplateOrion } from './portfolio-templates/template-orion';

interface TemplatePreviewProps {
  portfolioData: PortfolioData;
  templateId: TemplateId;
}

// This component is specifically for rendering small, scaled-down previews.
export function TemplatePreview({ portfolioData, templateId }: TemplatePreviewProps) {
  // Create a copy of the data and override the templateId for preview purposes
  const previewData = { ...portfolioData, templateId };

  const renderTemplate = () => {
    switch (templateId) {
      case 'classic':
        return <TemplateClassic portfolioData={previewData} />;
      case 'modern':
        return <TemplateModern portfolioData={previewData} />;
      case 'minimal':
        return <TemplateMinimal portfolioData={previewData} />;
      case 'creative':
        return <TemplateCreative portfolioData={previewData} />;
      case 'corporate':
        return <TemplateCorporate portfolioData={previewData} />;
      case 'geist':
        return <TemplateGeist portfolioData={previewData} />;
      case 'orion':
        return <TemplateOrion portfolioData={previewData} />;
      default:
        return <TemplateClassic portfolioData={previewData} />;
    }
  };

  return (
    <div className="w-full h-full transform origin-top-left overflow-hidden absolute inset-0">
        <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}>
         {renderTemplate()}
        </div>
    </div>
  );
}


'use client';

import { type PortfolioData, type TemplateId } from '@/types/portfolio';
import { TemplateClassic } from './portfolio-templates/template-classic';
import { TemplateModern } from './portfolio-templates/template-modern';
import { TemplateMinimal } from './portfolio-templates/template-minimal';
import { TemplateCreative } from './portfolio-templates/template-creative';
import { TemplateCorporate } from './portfolio-templates/template-corporate';

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
      default:
        return <TemplateClassic portfolioData={previewData} />;
    }
  };

  return (
    <div className="w-full h-full transform origin-top-left" style={{ scale: '0.15' }}>
        {renderTemplate()}
    </div>
  );
}

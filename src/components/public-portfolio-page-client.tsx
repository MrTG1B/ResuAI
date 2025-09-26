
"use client";

import Image from "next/image";
import { type PortfolioData } from "@/types/portfolio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TemplateClassic } from "./portfolio-templates/template-classic";
import { TemplateModern } from "./portfolio-templates/template-modern";
import { TemplateMinimal } from "./portfolio-templates/template-minimal";
import { TemplateCreative } from "./portfolio-templates/template-creative";
import { TemplateCorporate } from "./portfolio-templates/template-corporate";
import { TemplateGeist } from "./portfolio-templates/template-geist";
import { TemplateOrion } from "./portfolio-templates/template-orion";


export default function PublicPortfolioPageContent({ portfolio }: { portfolio: PortfolioData }) {

  const templateId = portfolio.templateId || 'classic';

  const renderTemplate = () => {
      switch (templateId) {
          case 'classic':
              return <TemplateClassic portfolioData={portfolio} />;
          case 'modern':
              return <TemplateModern portfolioData={portfolio} />;
          case 'minimal':
              return <TemplateMinimal portfolioData={portfolio} />;
          case 'creative':
              return <TemplateCreative portfolioData={portfolio} />;
          case 'corporate':
              return <TemplateCorporate portfolioData={portfolio} />;
          case 'geist':
              return <TemplateGeist portfolioData={portfolio} />;
          case 'orion':
              return <TemplateOrion portfolioData={portfolio} />;
      }
  };

  const portfolioStyles = portfolio.colorPalette ? {
    '--p-bg': portfolio.colorPalette.background,
    '--p-fg': portfolio.colorPalette.foreground,
    '--p-primary': portfolio.colorPalette.primary,
    '--p-secondary': portfolio.colorPalette.secondary,
    '--p-accent': portfolio.colorPalette.accent,
  } as React.CSSProperties : {};
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--p-bg, hsl(var(--background)))', ...portfolioStyles }}>
      <main className="w-full" style={{ color: 'var(--p-fg, hsl(var(--foreground)))' }}>
          {renderTemplate()}
      </main>
      <footer className="text-center p-4 text-xs" style={{ color: 'var(--p-fg)', opacity: 0.6 }}>
        <p>
          Powered by <Link href="/" className="font-bold hover:underline">ResuAI</Link>
        </p>
      </footer>
    </div>
  );
}

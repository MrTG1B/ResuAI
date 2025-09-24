
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BrandLoader } from '@/components/brand-loader';

const PortfolioEditorClient = dynamic(() => import('@/components/portfolio-editor-client'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-screen items-center justify-center bg-background">
      <BrandLoader size="lg" />
      <p className="mt-4 text-muted-foreground">Loading Portfolio Editor...</p>
    </div>
  ),
});

export default function PortfolioEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <BrandLoader size="lg" />
        </div>
      }
    >
      <PortfolioEditorClient />
    </Suspense>
  );
}

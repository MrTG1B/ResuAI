
'use client';

import { Suspense } from 'react';
import PublicPortfolioPageContent from '@/components/public-portfolio-page-client';
import { BrandLoader } from '@/components/brand-loader';

// This is the main Server Component for the route
export default function PublicPortfolioPage({ params }: { params: { id: string } }) {
  
  // It provides a Suspense boundary for the client component that does the data fetching.
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <BrandLoader size="lg" />
      </div>
    }>
      <PublicPortfolioPageContent portfolioId={params.id} />
    </Suspense>
  );
}

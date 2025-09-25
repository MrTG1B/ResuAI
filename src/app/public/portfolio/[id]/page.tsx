
import { Suspense } from 'react';
import PublicPortfolioPageContent from '@/components/public-portfolio-page-client';
import { BrandLoader } from '@/components/brand-loader';

// This is a Server Component that fetches the ID and passes it to the Client Component.
export default function PublicPortfolioPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <BrandLoader size="lg" />
      </div>
    }>
      <PublicPortfolioPageContent portfolioId={id} />
    </Suspense>
  );
}

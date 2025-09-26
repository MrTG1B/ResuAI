
import { Suspense } from 'react';
import { BrandLoader } from '@/components/brand-loader';
import PublicPortfolioPageContent from '@/components/public-portfolio-page-client';
import { getPublicPortfolioAction } from '@/app/actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PublicPortfolioPage({ params }: { params: { id: string } }) {
  const { data: portfolioData, error } = await getPublicPortfolioAction(params.id);

  if (error || !portfolioData) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <BrandLoader size="lg" />
        </div>
      }
    >
      <PublicPortfolioPageContent portfolio={portfolioData} />
    </Suspense>
  );
}

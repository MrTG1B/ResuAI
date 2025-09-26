
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicPortfolioAction } from '@/app/actions';
import PublicPortfolioPageContent from '@/components/public-portfolio-page-client';
import { BrandLoader } from '@/components/brand-loader';

// This line ensures the page is always dynamically rendered
export const dynamic = 'force-dynamic';

export default async function PublicPortfolioPage({ params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    notFound();
  }

  const result = await getPublicPortfolioAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
            <BrandLoader size="lg" />
        </div>
    }>
        <PublicPortfolioPageContent portfolio={result.data} />
    </Suspense>
  );
}

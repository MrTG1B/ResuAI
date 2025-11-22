
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type PortfolioData } from '@/types/portfolio';
import PublicPortfolioPageContent from '@/components/public-portfolio-page-client';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';
import PortfolioPageClient from '@/components/portfolio-page-client';
import { BrandLoader } from '@/components/brand-loader';

// Force dynamic rendering to prevent caching and ensure fresh data
export const dynamic = 'force-dynamic';

async function getPortfolioData(id: string, userId?: string): Promise<PortfolioData | null> {
    if (!db) return null;

    let portfolioDoc;

    if (userId) {
        portfolioDoc = await getDoc(doc(db, `users/${userId}/portfolios`, id));
    } else {
         // This path is for public viewing, which might need a different logic
         // For now, we assume authenticated viewing is the primary path from dashboard
         return null;
    }

    if (!portfolioDoc.exists()) {
        return null;
    }

    const data = portfolioDoc.data();

    // Sanitize Firestore Timestamps to strings
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    
    return { id: portfolioDoc.id, ...data } as PortfolioData;
}


export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ id: string }> }) {
    const params = await searchParams;
    const portfolioId = params.id;

    if (!portfolioId) {
        notFound();
    }
    
    // In a server component, we can't use onAuthStateChanged. 
    // A robust solution would involve a session management library or checking auth tokens.
    // For this context, let's assume we can get the user ID if they are logged in.
    // This is a simplified check. A real app would use a more secure session check.
    const user = auth?.currentUser; // This is often null on server, so a better check is needed
    
    // A better approach in a real app would be to get the UID from a session cookie or server-side auth state.
    // Since we don't have a full auth session management here, we can't reliably get the UID on the server.
    // The fetching logic has been moved to a client component to use the existing client-side auth state.

    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <BrandLoader size="lg" />
            </div>
        }>
            <PortfolioPageClient portfolioId={portfolioId} />
        </Suspense>
    )
}

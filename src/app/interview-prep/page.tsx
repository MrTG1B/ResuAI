'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const InterviewPrepClient = dynamic(
    () => import('@/components/interview-prep-client'),
    { 
        ssr: false,
        loading: () => (
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Interview Prep...</p>
            </div>
        )
    }
);


export default function InterviewPrepPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Interview Prep...</p>
            </div>
        }>
            <InterviewPrepClient />
        </Suspense>
    )
}

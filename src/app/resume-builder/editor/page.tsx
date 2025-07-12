
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ResumeEditorClient = dynamic(
    () => import('@/components/resume-editor-client'),
    { 
        ssr: false,
        loading: () => (
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Editor...</p>
            </div>
        )
    }
);


export default function ResumeEditorPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Editor...</p>
            </div>
        }>
            <ResumeEditorClient />
        </Suspense>
    )
}

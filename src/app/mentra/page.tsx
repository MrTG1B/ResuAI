'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client component to ensure it's not server-rendered
const MentraChatClient = dynamic(() => import('@/components/mentra-chat-client'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
});

export default function MentraPage() {
  return (
    // Suspense is a good practice for dynamic imports, providing a fallback.
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    }>
      <MentraChatClient />
    </Suspense>
  );
}


'use client';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { FileSearch } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center text-center p-4">
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 text-primary/10">
                <FileSearch className="absolute inset-0 h-full w-full animate-pulse" style={{ animationDuration: '4s' }} />
                <FileSearch className="absolute inset-0 h-full w-full animate-wobble" />
                <span 
                    className="absolute -top-4 -right-4 text-8xl font-bold font-heading text-primary/80"
                    style={{ textShadow: '0 0 15px hsl(var(--primary) / 0.5)' }}
                >
                    404
                </span>
            </div>
            
            <h1 className="mt-8 text-4xl font-bold tracking-tight font-heading sm:text-5xl bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">
                Page Not Found
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
                Oops! It looks like the page you were trying to reach has been misplaced in our digital filing cabinet.
            </p>
            <Button asChild className="mt-8 text-lg" size="lg">
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { type AtsAnalyzerOutput } from '@/ai/flows/job-match-analyzer';

function getProgressColor(score: number) {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
}

interface AtsResultProps {
    result: AtsAnalyzerOutput;
    onTryAgain: () => void;
}

export function AtsResult({ result, onTryAgain }: AtsResultProps) {
    const router = useRouter();
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowDetails(true);
        }, 1500); // Wait for the animation to finish before showing details

        return () => clearTimeout(timer);
    }, []);

    const handleApplySuggestionsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // The resume data URI should already be in sessionStorage from the upload page.
        // We just need to add the suggestions.
        sessionStorage.setItem('resumeSuggestions', result.detailedAnalysis);
        router.push('/resume-builder/editor?from=analysis');
    };

    return (
        <Card className="shadow-2xl overflow-hidden">
            <CardHeader className="text-center border-b pb-6 p-6">
                <div className="flex flex-col items-center justify-center transition-all duration-500 ease-in-out" style={{ minHeight: '200px' }}>
                    {result.isAtsFriendly ? (
                        <CheckCircle2 className="w-24 h-24 text-green-500 animate-in fade-in zoom-in-50" />
                    ) : (
                        <XCircle className="w-24 h-24 text-red-500 animate-in fade-in zoom-in-50" />
                    )}
                    <CardTitle className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl font-heading transition-opacity duration-500 delay-300 ${showDetails ? 'opacity-100' : 'opacity-0'} ${result.isAtsFriendly ? 'text-green-500' : 'text-red-500'}`}>
                        {result.isAtsFriendly ? 'ATS Check: Passed' : 'ATS Check: Needs Improvement'}
                    </CardTitle>
                </div>
                <div className={`max-w-xl mx-auto pt-4 transition-opacity duration-500 delay-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-xl font-semibold mb-2">{result.atsFriendlinessScore}% ATS-Friendly</p>
                    <Progress value={result.atsFriendlinessScore} className="h-3" indicatorClassName={getProgressColor(result.atsFriendlinessScore)} />
                    <CardDescription className="mt-3 text-base">
                        {result.atsSummary}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className={`p-6 md:p-8 transition-opacity duration-500 delay-700 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
                <div className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:font-heading prose-headings:text-primary">
                    <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ node, children, href, ...rest }) => {
                                // Specifically handle the link to the editor
                                if (href === '/resume-builder/editor') {
                                    return <a href={href} onClick={handleApplySuggestionsClick} {...rest} className="font-bold no-underline">{children}</a>;
                                }
                                if (href && href.startsWith('/')) {
                                    return <Link href={href} {...rest}>{children}</Link>;
                                }
                                return <a href={href} {...rest} target="_blank" rel="noopener noreferrer">{children}</a>;
                            }
                        }}
                    >
                        {result.detailedAnalysis}
                    </ReactMarkdown>
                </div>
            </CardContent>
            <div className={`mt-6 text-center p-6 border-t transition-opacity duration-500 delay-1000 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
                 <Button variant="outline" onClick={onTryAgain}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Resume
                </Button>
            </div>
        </Card>
    );
}

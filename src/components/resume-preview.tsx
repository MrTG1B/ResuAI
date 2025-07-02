import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { type ParsedResume } from "@/types/resume";

interface ResumePreviewProps {
    resume: ParsedResume;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4 sm:p-6 bg-muted/30 flex justify-center overflow-y-auto">
                <div className="bg-white text-black w-full max-w-4xl p-10 sm:p-12 shadow-lg min-h-full">
                    <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-sm max-w-none"
                    >
                        {resume.htmlContent}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    );
}

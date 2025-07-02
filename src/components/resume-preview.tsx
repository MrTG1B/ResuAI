import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { type ParsedResume } from "@/types/resume";

interface ResumePreviewProps {
    resume: ParsedResume;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md bg-background h-[calc(100vh-250px)] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs font-sans">{resume.rawText}</pre>
                </div>
            </CardContent>
        </Card>
    );
}

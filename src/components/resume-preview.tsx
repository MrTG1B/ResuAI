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
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{resume.rawText}</pre>
                </div>
            </CardContent>
        </Card>
    );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { analyzeResumeAction } from "@/app/actions";
import { auth, db, doc, setDoc } from "@/lib/firebase";
import { useDynamicText } from "@/hooks/use-dynamic-text";

const analysisTexts = [
  "Analyzing...",
  "Extracting skills...",
  "Identifying keywords...",
  "Building your profile...",
  "Finalizing...",
];


export function ResumeForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const dynamicAnalysisText = useDynamicText(analysisTexts);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose a resume file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!auth?.currentUser || !db) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create a portfolio.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const resumeDataUri = reader.result as string;
        const result = await analyzeResumeAction({ resumeDataUri });

        if (result.success && result.data) {
          await setDoc(doc(db, "portfolios", user.uid), result.data);
          router.push("/portfolio");
        } else {
          throw new Error(result.error || "Analysis failed");
        }
      } catch (error: any) {
        toast({
          title: "Failed to build portfolio",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({
        title: "File Read Error",
        description: "There was an error reading your file.",
        variant: "destructive",
      });
    };
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="relative">
        <label
          htmlFor="resume-upload"
          className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-primary" />
            <p className="mb-2 text-sm text-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PDF or DOCX (MAX. 5MB)</p>
            {fileName && <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>}
          </div>
          <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
        </label>
      </div>
      <Button type="submit" className="w-full text-lg" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <PenSquare className="mr-2 h-5 w-5 animate-spin" />
            {dynamicAnalysisText}
          </>
        ) : (
          "Build My Portfolio"
        )}
      </Button>
    </form>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { analyzeResumeAction, generateAvatarAction, generateProjectImageAction, uploadImageAction } from "@/app/actions";
import { type User } from "firebase/auth";
import { CreativeLoader } from "./creative-loader";
import { db, collection, addDoc, serverTimestamp, getDoc, doc, setDoc } from "@/lib/firebase";
import type { PortfolioData, Project } from "@/types/portfolio";


const analysisTexts = [
  "Analyzing resume...",
  "Extracting skills & experience...",
  "Generating a professional design...",
  "Building your portfolio...",
  "Finalizing...",
];


export function ResumeForm({ user }: { user: User }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a resume file to upload.", variant: "destructive" });
      return;
    }
    if (!user || !db) {
      toast({ title: "Authentication Error", description: "Please log in to create a portfolio.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const resumeDataUri = reader.result as string;
        
        // 1. Get AI analysis from server action (no DB writes here)
        const analysisResult = await analyzeResumeAction({ resumeDataUri });
        if (!analysisResult.success || !analysisResult.data) {
          throw new Error(analysisResult.error || "AI analysis failed.");
        }
        
        const { portfolioDraft, avatarPrompt, colorPalette } = analysisResult.data;

        // 2. Handle DB operations on the client-side
        const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
        const portfolioCollectionRef = collection(db, 'users', user.uid, 'portfolios');
        
        const profileSnap = await getDoc(profileDocRef);
        const userProfile = profileSnap.exists() ? profileSnap.data() : {};
        
        // Merge AI data with existing profile data
        const finalPortfolioData: Partial<PortfolioData> = {
          ...portfolioDraft,
          personalInfo: { ...portfolioDraft.personalInfo, ...userProfile },
          summary: userProfile.summary || portfolioDraft.summary || portfolioDraft.personalInfo?.summary,
          experience: userProfile.experience?.length ? userProfile.experience : portfolioDraft.experience,
          education: userProfile.education?.length ? userProfile.education : portfolioDraft.education,
          skills: userProfile.skills?.length ? userProfile.skills : portfolioDraft.skills,
          projects: userProfile.projects?.length ? userProfile.projects : portfolioDraft.projects,
          certifications: userProfile.certifications?.length ? userProfile.certifications : portfolioDraft.certifications,
          languages: userProfile.languages?.length ? userProfile.languages : portfolioDraft.languages,
          interests: userProfile.interests?.length ? userProfile.interests : portfolioDraft.interests,
          publications: userProfile.publications?.length ? userProfile.publications : portfolioDraft.publications,
          title: `Portfolio from ${new Date().toLocaleDateString()}`,
          createdAt: serverTimestamp(),
          colorPalette: colorPalette,
        };

        // 3. Generate and upload images on the client side
        let avatarPromise;
        if (userProfile.profilePictureUrl) {
            avatarPromise = Promise.resolve(userProfile.profilePictureUrl);
        } else {
            avatarPromise = generateAvatarAction({ prompt: avatarPrompt })
                .then(res => uploadImageAction(res.data.imageDataUri))
                .then(async (uploadResult) => {
                    if(!uploadResult.success || !uploadResult.data) throw new Error("Avatar upload failed");
                    await setDoc(profileDocRef, { 
                        profilePictureUrl: uploadResult.data.url,
                        profilePictureDeleteUrl: uploadResult.data.deleteUrl
                    }, { merge: true });
                    return uploadResult.data.url;
                })
                .catch(err => {
                    console.error("Avatar generation/upload failed:", err);
                    return 'https://placehold.co/128x128.png';
                });
        }
        
        const projectImagePromises = (finalPortfolioData.projects || []).map(async (project: Project) => {
            if (!project.previewImage) {
                try {
                    const imageResult = await generateProjectImageAction({ description: project.description });
                    const uploadResult = await uploadImageAction(imageResult.data.imageDataUri);
                    if(uploadResult.success && uploadResult.data) {
                      project.previewImage = uploadResult.data.url;
                    }
                } catch (e) {
                    console.warn(`Failed to generate image for project: ${project.name}`, e);
                    project.previewImage = 'https://placehold.co/800x450.png';
                }
            }
            return project;
        });

        const [avatarUrl, updatedProjects] = await Promise.all([
            avatarPromise,
            Promise.all(projectImagePromises),
        ]);

        finalPortfolioData.projects = updatedProjects;
        if (finalPortfolioData.personalInfo) {
            finalPortfolioData.personalInfo.profilePictureUrl = avatarUrl;
        } else {
            finalPortfolioData.personalInfo = { name: '', title: '', email: '', phone: '', location: '', socials: [], profilePictureUrl: avatarUrl };
        }

        // 4. Save final portfolio to Firestore from the client
        const newDocRef = await addDoc(portfolioCollectionRef, finalPortfolioData);
        
        router.push(`/portfolio?id=${newDocRef.id}`);

      } catch (error: any) {
        toast({ title: "Failed to build portfolio", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({ title: "File Read Error", description: "There was an error reading your file.", variant: "destructive" });
    };
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-8 h-80">
           <CreativeLoader texts={analysisTexts} />
        </div>
    );
  }

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
            <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
            {fileName && <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>}
          </div>
          <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
        </label>
      </div>
      <Button type="submit" className="w-full text-lg" size="lg" disabled={isLoading}>
          Build My Portfolio
      </Button>
    </form>
  );
}

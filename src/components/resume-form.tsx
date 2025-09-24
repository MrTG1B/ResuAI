
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { analyzeResumeForPortfolioAction, generateAvatarAction, generateProjectImageAction, uploadImageAction } from "@/app/actions";
import { type User } from "firebase/auth";
import { db, collection, addDoc, serverTimestamp, getDoc, doc, setDoc } from "@/lib/firebase";
import type { PortfolioData, Project, Publication } from "@/types/portfolio";


interface ResumeFormProps {
    user: User;
    setIsProcessing: (isProcessing: boolean) => void;
}

export function ResumeForm({ user, setIsProcessing }: ResumeFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
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

    setIsProcessing(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const resumeDataUri = reader.result as string;
        
        console.log("Step 1: Starting AI analysis...");
        const analysisResult = await analyzeResumeForPortfolioAction({ resumeDataUri });
        if (!analysisResult.success || !analysisResult.data) {
          throw new Error(analysisResult.error || "AI analysis failed.");
        }
        console.log("Step 1 Success: AI analysis complete.");
        
        const { portfolioDraft, avatarPrompt, colorPalette } = analysisResult.data;

        console.log("Step 2: Merging AI data with user profile...");
        const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
        const portfolioCollectionRef = collection(db, 'users', user.uid, 'portfolios');
        
        const profileSnap = await getDoc(profileDocRef);
        const userProfile = profileSnap.exists() ? profileSnap.data() : {};
        
        const finalPortfolioData: Partial<PortfolioData> & { publications?: Publication[] } = {
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
          publications: userProfile.publications?.length ? userProfile.publications : (portfolioDraft.publications || []),
          title: `Portfolio for ${portfolioDraft.personalInfo?.name || user.displayName || 'User'}`,
          createdAt: serverTimestamp(),
          colorPalette: colorPalette,
        };
        console.log("Step 2 Success: Data merged.");
        console.log("Final data to be saved:", JSON.stringify(finalPortfolioData, null, 2));


        console.log("Step 3: Generating and uploading images...");
        let avatarPromise;
        if (userProfile.profilePictureUrl) {
            avatarPromise = Promise.resolve(userProfile.profilePictureUrl);
        } else {
            avatarPromise = generateAvatarAction({ prompt: avatarPrompt })
                .then(res => {
                    if(!res.success || !res.data) throw new Error("Avatar generation failed");
                    return uploadImageAction(res.data.imageDataUri);
                })
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
                     if(!imageResult.success || !imageResult.data) throw new Error(`Image generation failed for project: ${project.name}`);
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
        console.log("Step 3 Success: All images processed.");


        finalPortfolioData.projects = updatedProjects;
        if (finalPortfolioData.personalInfo) {
            finalPortfolioData.personalInfo.profilePictureUrl = avatarUrl;
        } else {
            finalPortfolioData.personalInfo = { name: '', title: '', email: '', phone: '', location: '', socials: [], profilePictureUrl: avatarUrl };
        }
        
        console.log("Step 4: Saving final data to Firestore...");
        
        const newDocRef = await addDoc(portfolioCollectionRef, finalPortfolioData);
        console.log("Step 4 Success: Portfolio saved with ID:", newDocRef.id);
        
        router.push(`/portfolio?id=${newDocRef.id}`);

      } catch (error: any) {
        console.error(">>> PORTFOLIO BUILD FAILED <<<", error);
        toast({ 
            title: "Failed to build portfolio", 
            description: "An unexpected error occurred. Please check the console for more details.",
            variant: "destructive" 
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      toast({ title: "File Read Error", description: "There was an error reading your file.", variant: "destructive" });
    };
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="relative">
        <label
          htmlFor="resume-upload"
          className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 border-muted-foreground/30 hover:border-primary transition-colors duration-300"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary transition-colors" style={{color: '#45B8AC'}} />
            <p className="mb-2 text-sm text-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
            {fileName && <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>}
          </div>
          <Input id="resume-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
        </label>
      </div>
      <Button
        type="submit"
        className="w-full text-lg"
        size="lg"
      >
          <Bot className="mr-2 h-5 w-5"/>
          Build My Portfolio
      </Button>
    </form>
  );
}

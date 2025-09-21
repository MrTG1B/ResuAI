
"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput } from "@/ai/flows/resume-analysis";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import { parseResume as parseResumeFlow, type ParseResumeInput } from "@/ai/flows/parse-resume";
import { editResumeFlow, type EditResumeInput } from "@/ai/flows/edit-resume";
import { atsAnalyzerFlow, type AtsAnalyzerOutput } from "@/ai/flows/job-match-analyzer";
import { coachChat as coachChatFlow, type CoachChatInput } from "@/ai/flows/coach-chat";
import { generateProjectImage as generateProjectImageFlow } from "@/ai/flows/generate-project-image";
import { analyzeCertificate as analyzeCertificateFlow, type AnalyzeCertificateInput } from "@/ai/flows/analyze-certificate";
import { aiAssistantChat as aiAssistantChatFlow, type AIAssistantChatInput } from "@/ai/flows/ai-assistant-chat";
import { refineSummary as refineSummaryFlow, type RefineSummaryInput } from "@/ai/flows/refine-summary";
import { generateCoverLetter as generateCoverLetterFlow, type GenerateCoverLetterInput } from "@/ai/flows/generate-cover-letter";
import { interviewPrep as interviewPrepFlow, type InterviewPrepInput } from "@/ai/flows/interview-prep";
import { generateAptitudeExam as generateAptitudeExamFlow } from "@/ai/flows/generate-aptitude-exam";
import { type PortfolioData, type Project, type PersonalInfo } from "@/types/portfolio";
import { type ParsedResume, type EditedResume, type CoachChatResponse } from "@/types/resume";
import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, getDoc, setDoc, query, orderBy, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage, deleteImage } from "@/services/image-upload-service";
import { type CoverLetter } from "@/types/cover-letter";


async function maybeAutoFillProfile(userId: string, resumeDataUri: string) {
    if (!db) return;
    try {
        const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
        const profileSnap = await getDoc(profileDocRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        
        // Only auto-fill if the profile has never been filled from a resume before.
        if (profileData.profileFilledFromResume) {
            return;
        }

        // Analyze resume to get structured data for profile
        const analysisResult = await analyzeResumeFlow({ resumeDataUri });
        const { portfolioDraft } = analysisResult;
        
        // Structure the extracted data, ensuring arrays are not undefined
        const extractedProfileData = {
            name: portfolioDraft.personalInfo?.name,
            title: portfolioDraft.personalInfo?.title,
            email: portfolioDraft.personalInfo?.email,
            phone: portfolioDraft.personalInfo?.phone,
            location: portfolioDraft.personalInfo?.location,
            summary: portfolioDraft.summary || portfolioDraft.personalInfo?.summary,
            socials: portfolioDraft.personalInfo?.socials || [],
            skills: portfolioDraft.skills || [],
            experience: portfolioDraft.experience || [],
            education: portfolioDraft.education || [],
            projects: portfolioDraft.projects || [],
            certifications: portfolioDraft.certifications || [],
            languages: portfolioDraft.languages || [],
            interests: portfolioDraft.interests || [],
            publications: [], // publications is not in the resume analysis output
        };

        // Merge with existing data, giving precedence to what's already in the profile
        const finalProfileData = {
            ...extractedProfileData,
            ...profileData,
            profileFilledFromResume: true, // Set flag to prevent future auto-fills
        };

        await setDoc(profileDocRef, finalProfileData, { merge: true });
        
    } catch (error) {
        console.error("Error during profile auto-fill:", error);
        // Do not block the main action if this fails, but log the error.
    }
}


export async function analyzeResumeAction(userId: string, input: AnalyzeResumeInput) {
  try {
    if (!db) throw new Error("Firestore is not initialized.");

    await maybeAutoFillProfile(userId, input.resumeDataUri);
    
    const portfolioCollectionRef = collection(db, 'users', userId, 'portfolios');
    const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
    const profileSnap = await getDoc(profileDocRef);
    const userProfile = profileSnap.exists() ? profileSnap.data() : {};

    const analysisResult = await analyzeResumeFlow(input);
    const portfolioDraftFromAI: Partial<PortfolioData> = analysisResult.portfolioDraft;

    const finalPortfolioData: Partial<PortfolioData> = {
        ...portfolioDraftFromAI,
        personalInfo: { ...portfolioDraftFromAI.personalInfo, ...userProfile },
        summary: userProfile.summary || portfolioDraftFromAI.summary || portfolioDraftFromAI.personalInfo?.summary,
        experience: userProfile.experience && userProfile.experience.length > 0 ? userProfile.experience : portfolioDraftFromAI.experience,
        education: userProfile.education && userProfile.education.length > 0 ? userProfile.education : portfolioDraftFromAI.education,
        skills: userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills : portfolioDraftFromAI.skills,
        projects: userProfile.projects && userProfile.projects.length > 0 ? userProfile.projects : portfolioDraftFromAI.projects,
        certifications: userProfile.certifications && userProfile.certifications.length > 0 ? userProfile.certifications : portfolioDraftFromAI.certifications,
        languages: userProfile.languages && userProfile.languages.length > 0 ? userProfile.languages : portfolioDraftFromAI.languages,
        interests: userProfile.interests && userProfile.interests.length > 0 ? userProfile.interests : portfolioDraftFromAI.interests,
        publications: userProfile.publications && userProfile.publications.length > 0 ? userProfile.publications : portfolioDraftFromAI.publications,
    };
    
    finalPortfolioData.title = `Portfolio from ${new Date().toLocaleDateString()}`;
    finalPortfolioData.createdAt = serverTimestamp();
    finalPortfolioData.colorPalette = analysisResult.colorPalette;

    let avatarPromise;
    if (userProfile.profilePictureUrl) {
      avatarPromise = Promise.resolve(userProfile.profilePictureUrl);
    } else {
      avatarPromise = generateAvatarFlow({ prompt: analysisResult.avatarPrompt })
        .then(res => uploadImage(res.imageDataUri))
        .then(async (uploadResult) => {
            await setDoc(profileDocRef, { 
                profilePictureUrl: uploadResult.url,
                profilePictureDeleteUrl: uploadResult.deleteUrl
            }, { merge: true });
            return uploadResult.url;
        })
        .catch(err => {
            console.error("Avatar generation/upload failed:", err);
            return 'https://placehold.co/128x128.png';
        });
    }

    const projectImagePromises = (finalPortfolioData.projects || []).map(async (project: Project) => {
        try {
            if (!project.previewImage) {
                const imageResult = await generateProjectImageFlow({ description: project.description });
                project.previewImage = (await uploadImage(imageResult.imageDataUri)).url;
            }
        } catch (e) {
            console.warn(`Failed to generate/upload image for project: ${project.name}`, e);
            if (!project.previewImage) {
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
        finalPortfolioData.personalInfo = {
            name: '', title: '', email: '', phone: '', location: '', socials: [],
            profilePictureUrl: avatarUrl,
        }
    }

    const newDocRef = await addDoc(portfolioCollectionRef, finalPortfolioData);
    
    return { success: true, data: { ...finalPortfolioData, id: newDocRef.id } };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return { success: false, error: "Failed to analyze resume. Please check the file format and try again." };
  }
}

export async function uploadImageAction(dataUri: string): Promise<{ success: boolean; data?: { url: string; deleteUrl: string }; error?: string }> {
    try {
        const result = await uploadImage(dataUri);
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Image upload action failed:", errorMessage);
        return { success: false, error: `Failed to upload image: ${errorMessage}` };
    }
}

export async function deleteImageAction(deleteUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteImage(deleteUrl);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Image delete action failed:", errorMessage);
        return { success: false, error: `Failed to delete image: ${errorMessage}` };
    }
}

export async function parseResumeAction(userId: string, input: ParseResumeInput) {
  try {
    await maybeAutoFillProfile(userId, input.resumeDataUri);
    
    const result = await parseResumeFlow(input);
    const parsedData: ParsedResume = {
      htmlContent: result.htmlContent,
    };
    return { success: true, data: parsedData };
  } catch (error) {
    console.error("Error parsing resume:", error);
    return { success: false, error: "Failed to parse resume. Please check the file format and try again." };
  }
}

export async function editResumeAction(input: EditResumeInput) {
  try {
    const result = await editResumeFlow(input);
    const editedData: EditedResume = {
      newHtmlContent: result.newHtmlContent,
      response: result.response,
    };
    return { success: true, data: editedData };
  } catch (error: any) {
    console.error("Error editing resume:", error);
    if (error.message && error.message.includes('Zod')) {
      return { success: false, error: "The AI's response could not be processed. This can happen with complex requests. Please try rephrasing your instruction to be more specific (e.g., 'Change my name to Jane Doe')." };
    }
    return { success: false, error: "Failed to edit resume. The AI model might be busy, please try again." };
  }
}

export async function atsAnalyzeAction(input: AtsAnalyzerInput) {
    try {
      const result = await atsAnalyzerFlow(input);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("Error analyzing resume for ATS:", error);
      return { success: false, error: `Failed to analyze resume. ${error.message}` };
    }
  }

export async function coachChatAction(input: CoachChatInput) {
  try {
    const result = await coachChatFlow(input);
    const responseData: CoachChatResponse = {
      response: result.response,
    };
    return { success: true, data: responseData };
  } catch (error: any) {
    console.error("Error in coach chat:", error);
    return { success: false, error: "The AI coach is unavailable. Please try again later." };
  }
}

export async function analyzeCertificateAction(input: AnalyzeCertificateInput) {
  try {
    const result = await analyzeCertificateFlow(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error analyzing certificate:", error);
    return { success: false, error: "The AI failed to analyze the certificate. Please check the file and try again." };
  }
}

export async function refineSummaryAction(input: RefineSummaryInput): Promise<{success: boolean, data?: { refinedSummary: string }, error?: string}> {
    try {
        const result = await refineSummaryFlow(input);
        if (result.refinedSummary) {
            return { success: true, data: result };
        } else {
            return { success: false, error: "The AI could not refine the summary." };
        }
    } catch (error: any) {
        console.error("Error refining summary:", error);
        return { success: false, error: "Failed to refine summary. Please try again." };
    }
}

interface GenerateCoverLetterActionInput {
    title: string;
    jobDescription: string;
    companyName: string;
    hiringManager?: string;
    tone: 'Professional' | 'Enthusiastic' | 'Formal' | 'Creative';
    id?: string;
}

export async function generateCoverLetterAction(userId: string, input: GenerateCoverLetterActionInput): Promise<{ success: boolean; data?: { coverLetter: string, id: string }; error?: string }> {
    if (!db) {
        return { success: false, error: "Database not available." };
    }

    try {
        const { id, title, ...aiInput } = input;
        
        const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
        const profileSnap = await getDoc(profileDocRef);
        if (!profileSnap.exists()) {
            return { success: false, error: "User profile not found. Please complete your profile first." };
        }
        const userProfile = profileSnap.data() as PersonalInfo;
        
        const result = await generateCoverLetterFlow({ ...aiInput, userProfile });

        if (!result.coverLetter) {
             throw new Error("AI failed to generate the cover letter content.");
        }

        const letterData: Omit<CoverLetter, 'id' | 'createdAt'> & { lastModified: any, createdAt?: any } = {
            title: title,
            content: result.coverLetter,
            jobDescription: aiInput.jobDescription,
            companyName: aiInput.companyName,
            hiringManager: aiInput.hiringManager,
            tone: aiInput.tone,
            lastModified: serverTimestamp(),
        };

        const collectionRef = collection(db, 'users', userId, 'coverletters');
        let docId = id;

        if (docId) {
            await setDoc(doc(collectionRef, docId), letterData, { merge: true });
        } else {
            letterData.createdAt = serverTimestamp();
            const newDocRef = await addDoc(collectionRef, letterData);
            docId = newDocRef.id;
        }

        return { success: true, data: { coverLetter: result.coverLetter, id: docId! } };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Cover letter generation/saving failed:", errorMessage);
        if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
            return { success: false, error: `Permission denied. Please ensure you are logged in.` };
        }
        return { success: false, error: `Failed to process cover letter: ${errorMessage}` };
    }
}

interface InterviewPrepActionInput {
    jobTitle: string;
    jobDescription: string;
    history: any[];
    prompt: string;
}

export async function interviewPrepAction(userId: string, input: InterviewPrepActionInput): Promise<{ success: boolean; data?: { response: string }; error?: string }> {
    const { jobTitle, jobDescription, history, prompt } = input;
    
    if (!db) {
        return { success: false, error: "Database service is not available." };
    }

    try {
        const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
        const profileSnap = await getDoc(profileDocRef);
        const userProfile = profileSnap.exists() ? profileSnap.data() : {};

        const result = await interviewPrepFlow({
            jobTitle,
            jobDescription,
            userProfile,
            history,
            prompt,
        });

        return { success: true, data: { response: result.response } };

    } catch (error: any) {
        console.error("Error in interview prep action:", error);
        return { success: false, error: "The AI coach is unavailable. Please try again later." };
    }
}

export async function generateAptitudeExamAction() {
    try {
      const result = await generateAptitudeExamFlow({
        logicalReasoningCount: 5,
        quantitativeAnalysisCount: 5,
        verbalAbilityCount: 5,
      });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error generating aptitude exam:', error);
      return { success: false, error: error.message || 'Failed to generate exam questions.' };
    }
}

export async function aiAssistantChatAction(input: AIAssistantChatInput) {
    try {
        const result = await aiAssistantChatFlow(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error in AI assistant chat action:", error);
        return { success: false, error: "The AI assistant is unavailable. Please try again later." };
    }
}

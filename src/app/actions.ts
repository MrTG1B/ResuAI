
"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput } from "@/ai/flows/resume-analysis";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import { parseResume as parseResumeFlow, type ParseResumeInput } from "@/ai/flows/parse-resume";
import { editResumeFlow, type EditResumeInput } from "@/ai/flows/edit-resume";
import { jobMatchAnalyzerFlow, type JobMatchAnalyzerInput } from "@/ai/flows/job-match-analyzer";
import { coachChat as coachChatFlow, type CoachChatInput } from "@/ai/flows/coach-chat";
import { generateProjectImage as generateProjectImageFlow } from "@/ai/flows/generate-project-image";
import { analyzeCertificate as analyzeCertificateFlow, type AnalyzeCertificateInput } from "@/ai/flows/analyze-certificate";
import { getUsers as getUsersFlow } from "@/ai/flows/admin-get-users";
import { submitFeedback as submitFeedbackFlow, type SubmitFeedbackInput } from "@/ai/flows/submit-feedback";
import { getFeedback as getFeedbackFlow } from "@/ai/flows/admin-get-feedback";
import { type PortfolioData, type Project, type PersonalInfo } from "@/types/portfolio";
import { type ParsedResume, type EditedResume, type JobMatchAnalysis, type CoachChatResponse } from "@/types/resume";
import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, getDoc, setDoc, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types/user";
import { Feedback } from "@/types/feedback";
import { uploadImage } from "@/services/image-upload-service";

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
        
        // Structure the extracted data
        const extractedProfileData = {
            name: portfolioDraft.personalInfo?.name,
            title: portfolioDraft.personalInfo?.title,
            email: portfolioDraft.personalInfo?.email,
            phone: portfolioDraft.personalInfo?.phone,
            location: portfolioDraft.personalInfo?.location,
            socials: portfolioDraft.personalInfo?.socials,
            experience: (portfolioDraft.experience || []).map(exp => ({...exp, description: exp.description.join('\\n')})),
            education: portfolioDraft.education,
            projects: (portfolioDraft.projects || []).map(proj => ({...proj, technologies: proj.technologies?.join(', ')})),
            certifications: portfolioDraft.certifications,
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
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }
    
    // Attempt to auto-fill profile if it's the user's first time
    await maybeAutoFillProfile(userId, input.resumeDataUri);
    
    const portfolioCollectionRef = collection(db, 'users', userId, 'portfolios');
    
    // Fetch user profile data to merge with the portfolio
    const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
    const profileSnap = await getDoc(profileDocRef);
    const userProfile = profileSnap.exists() ? profileSnap.data() as PersonalInfo : {};


    // Step 1: Analyze resume for text content, get an avatar prompt, and color palette
    const analysisResult = await analyzeResumeFlow(input);
    
    const portfolioDraft: Partial<PortfolioData> = analysisResult.portfolioDraft;

    // Merge profile data with analysis result for the portfolio
    // The user's manually-saved profile data takes precedence
    if (portfolioDraft.personalInfo) {
      portfolioDraft.personalInfo = { ...portfolioDraft.personalInfo, ...userProfile };
    } else {
      portfolioDraft.personalInfo = userProfile;
    }

    // Add a title and creation date
    portfolioDraft.title = `Portfolio from ${new Date().toLocaleDateString()}`;
    portfolioDraft.createdAt = serverTimestamp();

    // Step 3: Add the color palette
    portfolioDraft.colorPalette = analysisResult.colorPalette;

    // Step 4: Generate avatar and project images in parallel
    const avatarPromise = generateAvatarFlow({ prompt: analysisResult.avatarPrompt })
        .then(res => uploadImage(res.imageDataUri))
        .catch(err => {
            console.error("Avatar generation/upload failed:", err);
            return 'https://placehold.co/128x128.png'; // Fallback URL
        });

    const projectImagePromises = (portfolioDraft.projects || []).map(async (project: Project) => {
        try {
            const imageResult = await generateProjectImageFlow({ description: project.description });
            project.previewImage = await uploadImage(imageResult.imageDataUri);
        } catch (e) {
            console.warn(`Failed to generate/upload image for project: ${project.name}`, e);
            // Use a placeholder if generation fails
            project.previewImage = 'https://placehold.co/800x450.png';
        }
        return project;
    });

    // Wait for all image generation to complete
    const [avatarUrl, updatedProjects] = await Promise.all([
        avatarPromise,
        Promise.all(projectImagePromises),
    ]);

    // Step 5: Combine all the results
    portfolioDraft.projects = updatedProjects;
    
    if (portfolioDraft.personalInfo) {
      portfolioDraft.personalInfo.profilePictureUrl = avatarUrl;
    } else {
        portfolioDraft.personalInfo = {
            name: '', title: '', email: '', phone: '', location: '', socials: [],
            profilePictureUrl: avatarUrl,
        }
    }

    // Step 6: Save as a new document in the user's portfolios subcollection
    const newDocRef = await addDoc(portfolioCollectionRef, portfolioDraft);
    
    return { success: true, data: { ...portfolioDraft, id: newDocRef.id } };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    // It's good practice to not expose detailed internal errors to the client.
    return { success: false, error: "Failed to analyze resume. Please check the file format and try again." };
  }
}

export async function uploadImageAction(dataUri: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const url = await uploadImage(dataUri);
        return { success: true, url };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Image upload action failed:", errorMessage);
        return { success: false, error: `Failed to upload image: ${errorMessage}` };
    }
}

export async function parseResumeAction(userId: string, input: ParseResumeInput) {
  try {
     // Attempt to auto-fill profile if it's the user's first time
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
  } catch (error) {
    console.error("Error editing resume:", error);
    return { success: false, error: "Failed to edit resume. The AI model might be busy, please try again." };
  }
}

export async function jobMatchAnalyzeAction(input: JobMatchAnalyzerInput) {
  try {
    const result = await jobMatchAnalyzerFlow(input);
    const analysisData: JobMatchAnalysis = {
      analysis: result.analysis,
    };
    return { success: true, data: analysisData };
  } catch (error) {
    console.error("Error analyzing resume for job match:", error);
    return { success: false, error: "Failed to analyze resume. The AI model might be busy, please try again." };
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

export async function getUsersAction(): Promise<User[]> {
    return await getUsersFlow();
}

export async function submitFeedbackAction(input: SubmitFeedbackInput): Promise<{success: boolean, error?: string}> {
    try {
        const result = await submitFeedbackFlow(input);
        return { success: result.success };
    } catch (error: any) {
        console.error("Error submitting feedback:", error);
        return { success: false, error: "Failed to submit feedback. Please try again." };
    }
}

export async function getFeedbackAction(): Promise<Feedback[]> {
    return await getFeedbackFlow();
}

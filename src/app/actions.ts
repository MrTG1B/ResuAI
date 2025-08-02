
"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput } from "@/ai/flows/resume-analysis";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import { parseResume as parseResumeFlow, type ParseResumeInput } from "@/ai/flows/parse-resume";
import { editResumeFlow, type EditResumeInput } from "@/ai/flows/edit-resume";
import { atsAnalyzerFlow, type AtsAnalyzerInput, type AtsAnalyzerOutput } from "@/ai/flows/job-match-analyzer";
import { coachChat as coachChatFlow, type CoachChatInput } from "@/ai/flows/coach-chat";
import { generateProjectImage as generateProjectImageFlow } from "@/ai/flows/generate-project-image";
import { analyzeCertificate as analyzeCertificateFlow, type AnalyzeCertificateInput } from "@/ai/flows/analyze-certificate";
import { submitFeedback as submitFeedbackFlow, type SubmitFeedbackInput } from "@/ai/flows/submit-feedback";
import { aiAssistantChat as aiAssistantChatFlow, type AIAssistantChatInput } from "@/ai/flows/ai-assistant-chat";
import { refineSummary as refineSummaryFlow, type RefineSummaryInput } from "@/ai/flows/refine-summary";
import { generateCoverLetter as generateCoverLetterFlow, type GenerateCoverLetterInput } from "@/ai/flows/generate-cover-letter";
import { type PortfolioData, type Project, type PersonalInfo } from "@/types/portfolio";
import { type ParsedResume, type EditedResume, type CoachChatResponse, type ChatMessage } from "@/types/resume";
import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, getDoc, setDoc, query, orderBy, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types/user";
import { Feedback } from "@/types/feedback";
import { uploadImage, deleteImage } from "@/services/image-upload-service";
import { type ChatSession } from "@/types/chat";


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
    const userProfile = profileSnap.exists() ? profileSnap.data() : {};


    // Step 1: Analyze resume for text content, get an avatar prompt, and color palette
    const analysisResult = await analyzeResumeFlow(input);
    
    // This is the draft from the resume file analysis
    const portfolioDraftFromAI: Partial<PortfolioData> = analysisResult.portfolioDraft;

    // Step 2: Merge profile data with analysis result, giving profile data precedence
    const finalPortfolioData: Partial<PortfolioData> = {
        // Start with AI-parsed data as a base
        ...portfolioDraftFromAI,
        // Overwrite with user profile data if it exists
        personalInfo: { ...portfolioDraftFromAI.personalInfo, ...userProfile },
        summary: userProfile.summary || portfolioDraftFromAI.summary || portfolioDraftFromAI.personalInfo?.summary,
        experience: userProfile.experience && userProfile.experience.length > 0 ? userProfile.experience : portfolioDraftFromAI.experience,
        education: userProfile.education && userProfile.education.length > 0 ? userProfile.education : portfolioDraftFromAI.education,
        skills: userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills : portfolioDraftFromAI.skills,
        projects: userProfile.projects && userProfile.projects.length > 0 ? userProfile.projects : portfolioDraftFromAI.projects,
        certifications: userProfile.certifications && userProfile.certifications.length > 0 ? userProfile.certifications : portfolioDraftFromAI.certifications,
        languages: userProfile.languages && userProfile.languages.length > 0 ? userProfile.languages : portfolioDraftFromAI.languages,
        interests: userProfile.interests && userProfile.interests.length > 0 ? userProfile.interests : portfolioDraftFromAI.interests,
    };
    
    // Add a title and creation date
    finalPortfolioData.title = `Portfolio from ${new Date().toLocaleDateString()}`;
    finalPortfolioData.createdAt = serverTimestamp();

    // Step 3: Add the color palette from the initial analysis
    finalPortfolioData.colorPalette = analysisResult.colorPalette;

    // Step 4: Generate avatar (if needed) and project images in parallel
    let avatarPromise;
    if (userProfile.profilePictureUrl) {
      // If URL exists in profile, use it directly
      avatarPromise = Promise.resolve(userProfile.profilePictureUrl);
    } else {
      // Otherwise, generate a new one, upload it, and save it back to the user's profile
      avatarPromise = generateAvatarFlow({ prompt: analysisResult.avatarPrompt })
        .then(res => uploadImage(res.imageDataUri))
        .then(async (uploadResult) => {
            // Save the new URL and delete URL back to the user's profile for future use
            await setDoc(profileDocRef, { 
                profilePictureUrl: uploadResult.url,
                profilePictureDeleteUrl: uploadResult.deleteUrl
            }, { merge: true });
            return uploadResult.url;
        })
        .catch(err => {
            console.error("Avatar generation/upload failed:", err);
            return 'https://placehold.co/128x128.png'; // Fallback URL
        });
    }

    const projectImagePromises = (finalPortfolioData.projects || []).map(async (project: Project) => {
        try {
            // Only generate an image if one doesn't already exist from the profile
            if (!project.previewImage) {
                const imageResult = await generateProjectImageFlow({ description: project.description });
                project.previewImage = (await uploadImage(imageResult.imageDataUri)).url;
            }
        } catch (e) {
            console.warn(`Failed to generate/upload image for project: ${project.name}`, e);
            // Use a placeholder if generation fails and one doesn't exist
            if (!project.previewImage) {
                project.previewImage = 'https://placehold.co/800x450.png';
            }
        }
        return project;
    });

    // Wait for all image generation to complete
    const [avatarUrl, updatedProjects] = await Promise.all([
        avatarPromise,
        Promise.all(projectImagePromises),
    ]);

    // Step 5: Combine all the results
    finalPortfolioData.projects = updatedProjects;
    
    if (finalPortfolioData.personalInfo) {
      finalPortfolioData.personalInfo.profilePictureUrl = avatarUrl;
    } else {
        finalPortfolioData.personalInfo = {
            name: '', title: '', email: '', phone: '', location: '', socials: [],
            profilePictureUrl: avatarUrl,
        }
    }

    // Step 6: Save as a new document in the user's portfolios subcollection
    const newDocRef = await addDoc(portfolioCollectionRef, finalPortfolioData);
    
    return { success: true, data: { ...finalPortfolioData, id: newDocRef.id } };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    // It's good practice to not expose detailed internal errors to the client.
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
  } catch (error) {
    console.error("Error analyzing resume for ATS:", error);
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

interface AIAssistantChatActionInput extends AIAssistantChatInput {
    userId: string;
    chatId?: string;
}

interface AIAssistantChatActionResult {
    success: boolean;
    data?: {
        response: string;
        chatId: string;
    };
    error?: string;
}

export async function aiAssistantChatAction(input: AIAssistantChatActionInput): Promise<AIAssistantChatActionResult> {
    const { userId, chatId, ...aiInput } = input;
    if (!db) return { success: false, error: "Database not initialized" };

    try {
        const result = await aiAssistantChatFlow(aiInput);
        let currentChatId = chatId;
        const userMessage: ChatMessage = { role: 'user', content: aiInput.prompt };
        const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };
        const chatCollectionRef = collection(db, 'users', userId, 'chats');

        if (currentChatId) {
            // Update existing chat
            const chatDocRef = doc(chatCollectionRef, currentChatId);
            const chatDoc = await getDoc(chatDocRef);
            if (chatDoc.exists()) {
                const existingMessages = chatDoc.data().messages || [];
                await updateDoc(chatDocRef, {
                    messages: [...existingMessages, userMessage, assistantMessage],
                    lastModified: serverTimestamp(),
                });
            }
        } else {
            // Create a new chat
            const newChat: Omit<ChatSession, 'id'> = {
                title: input.prompt.substring(0, 40) + '...',
                messages: [userMessage, assistantMessage],
                createdAt: serverTimestamp() as Timestamp,
                lastModified: serverTimestamp() as Timestamp,
            };
            const newDocRef = await addDoc(chatCollectionRef, newChat);
            currentChatId = newDocRef.id;
        }

        return { success: true, data: { response: result.response, chatId: currentChatId! } };
    } catch (error: any) {
        console.error("Error in AI assistant chat:", error);
        return { success: false, error: "The AI assistant is unavailable. Please try again later." };
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

export async function submitFeedbackAction(input: SubmitFeedbackInput): Promise<{success: boolean, error?: string}> {
    try {
        const result = await submitFeedbackFlow(input);
        return { success: result.success };
    } catch (error: any) {
        console.error("Error submitting feedback:", error);
        return { success: false, error: "Failed to submit feedback. Please try again." };
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

export async function generateCoverLetterAction(input: GenerateCoverLetterInput): Promise<{ success: boolean; data?: { coverLetter: string }; error?: string }> {
    try {
        const result = await generateCoverLetterFlow(input);
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Cover letter generation failed:", errorMessage);
        return { success: false, error: `Failed to generate cover letter: ${errorMessage}` };
    }
}

    

"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput } from "@/ai/flows/resume-analysis";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import { parseResume as parseResumeFlow, type ParseResumeInput } from "@/ai/flows/parse-resume";
import { editResumeFlow, type EditResumeInput } from "@/ai/flows/edit-resume";
import { jobMatchAnalyzerFlow, type JobMatchAnalyzerInput } from "@/ai/flows/job-match-analyzer";
import { coachChat as coachChatFlow, type CoachChatInput } from "@/ai/flows/coach-chat";
import { generateProjectImage as generateProjectImageFlow } from "@/ai/flows/generate-project-image";
import { analyzeCertificate as analyzeCertificateFlow, type AnalyzeCertificateInput } from "@/ai/flows/analyze-certificate";
import { type PortfolioData, type Project, type PersonalInfo } from "@/types/portfolio";
import { type ParsedResume, type EditedResume, type JobMatchAnalysis, type CoachChatResponse } from "@/types/resume";
import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types/user";

export async function analyzeResumeAction(userId: string, input: AnalyzeResumeInput) {
  try {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }
    const portfolioCollectionRef = collection(db, 'users', userId, 'portfolios');

    // Check portfolio limit
    const portfolioSnapshot = await getDocs(portfolioCollectionRef);
    if (portfolioSnapshot.size >= 5) {
        return { success: false, error: "You have reached the limit of 5 free portfolios." };
    }
    
    // Fetch user profile data to merge
    const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
    const profileSnap = await getDoc(profileDocRef);
    const userProfile = profileSnap.exists() ? profileSnap.data() as PersonalInfo : {};


    // Step 1: Analyze resume for text content, get an avatar prompt, and color palette
    const analysisResult = await analyzeResumeFlow(input);
    
    // Step 2: The portfolio draft is now a structured object, no parsing needed.
    const portfolioDraft: Partial<PortfolioData> = analysisResult.portfolioDraft;

    // Merge profile data with analysis result
    if (portfolioDraft.personalInfo) {
      portfolioDraft.personalInfo = { ...userProfile, ...portfolioDraft.personalInfo };
    } else {
      portfolioDraft.personalInfo = userProfile;
    }

    // Add a title and creation date
    portfolioDraft.title = `Portfolio from ${new Date().toLocaleDateString()}`;
    portfolioDraft.createdAt = serverTimestamp();

    // Step 3: Add the color palette
    portfolioDraft.colorPalette = analysisResult.colorPalette;

    // Step 4: Generate avatar and project images in parallel
    const avatarPromise = generateAvatarFlow({ prompt: analysisResult.avatarPrompt });

    const projectImagePromises = (portfolioDraft.projects || []).map(async (project: Project) => {
        try {
            const imageResult = await generateProjectImageFlow({ description: project.description });
            project.previewImage = imageResult.imageDataUri;
        } catch (e) {
            console.warn(`Failed to generate image for project: ${project.name}`, e);
            // Use a placeholder if generation fails
            project.previewImage = 'https://placehold.co/800x450.png';
        }
        return project;
    });

    // Wait for all image generation to complete
    const [avatarResult, updatedProjects] = await Promise.all([
        avatarPromise,
        Promise.all(projectImagePromises),
    ]);

    // Step 5: Combine all the results
    portfolioDraft.projects = updatedProjects;
    
    if (portfolioDraft.personalInfo) {
      portfolioDraft.personalInfo.profilePictureDataUri = avatarResult.imageDataUri;
    } else {
        portfolioDraft.personalInfo = {
            name: '', title: '', email: '', phone: '', website: '', location: '', socials: [],
            profilePictureDataUri: avatarResult.imageDataUri,
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

export async function parseResumeAction(input: ParseResumeInput) {
  try {
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

export async function deleteResumeAction(userId: string, resumeId: string) {
    if (!userId || !resumeId) {
        return { success: false, error: "User ID and Resume ID are required." };
    }
    try {
        if (!db) throw new Error("Firestore is not initialized.");
        await deleteDoc(doc(db, `users/${userId}/resumes`, resumeId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting resume:", error);
        return { success: false, error: "Failed to delete resume." };
    }
}

export async function deletePortfolioAction(userId: string, portfolioId: string) {
    if (!userId || !portfolioId) {
        return { success: false, error: "User ID and Portfolio ID are required." };
    }
    try {
        if (!db) throw new Error("Firestore is not initialized.");
        await deleteDoc(doc(db, `users/${userId}/portfolios`, portfolioId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting portfolio:", error);
        return { success: false, error: "Failed to delete portfolio." };
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

export async function getUsers() {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    const usersList: User[] = [];

    for (const userDoc of usersSnapshot.docs) {
        const profileDocRef = doc(db, 'users', userDoc.id, 'profile', 'data');
        const profileSnap = await getDoc(profileDocRef);

        const portfoliosCollectionRef = collection(db, 'users', userDoc.id, 'portfolios');
        const portfoliosSnapshot = await getDocs(portfoliosCollectionRef);

        const resumesCollectionRef = collection(db, 'users', userDoc.id, 'resumes');
        const resumesSnapshot = await getDocs(resumesCollectionRef);

        usersList.push({
            id: userDoc.id,
            name: profileSnap.exists() ? profileSnap.data().name : 'N/A',
            email: profileSnap.exists() ? profileSnap.data().email : 'N/A',
            portfolios: portfoliosSnapshot.size,
            resumes: resumesSnapshot.size,
        });
    }
    return usersList;
}

export async function deleteUserAction(userId: string) {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }

    try {
        // This is a simplified deletion. A production app would need a Cloud Function
        // to handle this properly, including deleting Firebase Auth user.
        await deleteDoc(doc(db, "users", userId));

        // In a real app, you would also need to delete subcollections recursively.
        // For this prototype, we assume top-level document deletion is sufficient.
        
        return { success: true };
    } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
        return { success: false, error: "Failed to delete user data from Firestore." };
    }
}


"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput, type AnalyzeResumeOutput } from "@/ai/flows/resume-analysis";
import { generateAvatar as generateAvatarFlow, GenerateAvatarInput } from "@/ai/flows/generate-avatar";
import { parseResume as parseResumeFlow, type ParseResumeInput } from "@/ai/flows/parse-resume";
import { editResumeFlow, type EditResumeInput } from "@/ai/flows/edit-resume";
import { generateResumeFromProfile, type GenerateResumeInput } from "@/ai/flows/generate-resume";
import { atsAnalyzerFlow, type AtsAnalyzerInput } from "@/ai/flows/job-match-analyzer";
import { coachChat as coachChatFlow, type CoachChatInput } from "@/ai/flows/coach-chat";
import { generateProjectImage as generateProjectImageFlow, GenerateProjectImageInput } from "@/ai/flows/generate-project-image";
import { analyzeCertificate as analyzeCertificateFlow, type AnalyzeCertificateInput } from "@/ai/flows/analyze-certificate";
import { aiAssistantChat as aiAssistantChatFlow, type AIAssistantChatInput } from "@/ai/flows/ai-assistant-chat";
import { refineSummary as refineSummaryFlow, type RefineSummaryInput } from "@/ai/flows/refine-summary";
import { generateCoverLetter as generateCoverLetterFlow, type GenerateCoverLetterInput } from "@/ai/flows/generate-cover-letter";
import { interviewPrep as interviewPrepFlow, type InterviewPrepInput } from "@/ai/flows/interview-prep";
import { generateAptitudeExam as generateAptitudeExamFlow } from "@/ai/flows/generate-aptitude-exam";
import { generateChatTitle as generateChatTitleFlow, type GenerateChatTitleInput } from "@/ai/flows/generate-chat-title";
import { type PortfolioData, type Project, type PersonalInfo } from "@/types/portfolio";
import { type ParsedResume, type EditedResume, type CoachChatResponse } from "@/types/resume";
import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, getDoc, setDoc, query, orderBy, updateDoc, Timestamp, collectionGroup, where, type FieldValue } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage, deleteImage } from "@/services/image-upload-service";
import { type CoverLetter } from "@/types/cover-letter";
import { validatePortfolioData, isValidUrl } from "@/lib/security";


// This action is now only responsible for AI analysis and does not interact with the database.
export async function analyzeResumeForPortfolioAction(input: AnalyzeResumeInput): Promise<{ success: boolean; data?: AnalyzeResumeOutput; error?: string }> {
  try {
    const analysisResult = await analyzeResumeFlow(input);
    return { success: true, data: analysisResult };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI analysis.";
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in analyzeResumeForPortfolioAction:", errorMessage);
    }
    return { success: false, error: errorMessage };
  }
}

export async function generateAvatarAction(input: GenerateAvatarInput) {
    try {
        const result = await generateAvatarFlow(input);
        return { success: true, data: result };
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate avatar: ${errorMessage}` };
    }
}

export async function generateProjectImageAction(input: GenerateProjectImageInput) {
    try {
        const result = await generateProjectImageFlow(input);
        return { success: true, data: result };
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate project image: ${errorMessage}` };
    }
}


export async function uploadImageAction(dataUri: string): Promise<{ success: boolean; data?: { url: string; deleteUrl: string }; error?: string }> {
    try {
        // Validate data URI format
        if (!dataUri || !dataUri.startsWith('data:image/')) {
            throw new Error('Invalid image data format');
        }
        
        const result = await uploadImage(dataUri);
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (process.env.NODE_ENV === 'development') {
          console.error("Image upload action failed:", errorMessage);
        }
        return { success: false, error: `Failed to upload image: ${errorMessage}` };
    }
}

export async function deleteImageAction(deleteUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate URL format
        if (!deleteUrl || !isValidUrl(deleteUrl)) {
            throw new Error('Invalid delete URL');
        }
        
        await deleteImage(deleteUrl);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (process.env.NODE_ENV === 'development') {
          console.error("Image delete action failed:", errorMessage);
        }
        return { success: false, error: `Failed to delete image: ${errorMessage}` };
    }
}

// This action is for AI analysis ONLY. No database writes.
export async function analyzeResumeForProfileFill(input: AnalyzeResumeInput): Promise<{ success: boolean; data?: AnalyzeResumeOutput['portfolioDraft']; error?: string }> {
  try {
    const analysisResult = await analyzeResumeFlow(input);
    return { success: true, data: analysisResult.portfolioDraft };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during profile analysis.";
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in analyzeResumeForProfileFill:", errorMessage);
    }
    return { success: false, error: errorMessage };
  }
}


export async function parseResumeAction(input: ParseResumeInput): Promise<{ success: boolean; data?: ParsedResume; error?: string }> {
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

export async function generateResumeFromProfileAction(input: GenerateResumeInput): Promise<{ success: boolean; data?: ParsedResume; error?: string }> {
  try {
    const result = await generateResumeFromProfile(input);
    return { success: true, data: { htmlContent: result.htmlContent } };
  } catch (error) {
    console.error("Error generating resume from profile:", error);
    return { success: false, error: "Failed to generate resume. Please try again." };
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
    
    // Handle specific error types with more helpful messages
    if (error.message && error.message.includes('Zod')) {
      return { success: false, error: "The AI's response could not be processed. This can happen with complex requests. Please try rephrasing your instruction to be more specific (e.g., 'Change my name to Jane Doe')." };
    }
    
    if (error.message && (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED'))) {
      return { success: false, error: "The AI service has reached its usage limit. Please try again in a few minutes or contact support if this persists." };
    }
    
    if (error.message && (error.message.includes('timeout') || error.message.includes('TIMEOUT'))) {
      return { success: false, error: "The request took too long to process. Please try again with a shorter or simpler instruction." };
    }
    
    if (error.message && (error.message.includes('network') || error.message.includes('NETWORK_ERROR') || error.message.includes('fetch'))) {
      return { success: false, error: "Network connection issue. Please check your internet connection and try again." };
    }
    
    if (error.message && error.message.includes('API_KEY')) {
      return { success: false, error: "AI service configuration issue. Please contact support." };
    }
    
    if (error.message && (error.message.includes('SAFETY') || error.message.includes('blocked'))) {
      return { success: false, error: "Your request was blocked by safety filters. Please try rephrasing your instruction." };
    }
    
    // Generic fallback with more helpful guidance
    return { success: false, error: "Unable to process your request right now. This could be due to high demand or a temporary service issue. Please try again in a few moments, or try rephrasing your instruction." };
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

        const letterData = {
            title: title,
            content: result.coverLetter,
            jobDescription: aiInput.jobDescription,
            companyName: aiInput.companyName,
            hiringManager: aiInput.hiringManager,
            tone: aiInput.tone,
            lastModified: serverTimestamp(),
        } as Omit<CoverLetter, 'id' | 'createdAt'> & { lastModified: FieldValue, createdAt?: FieldValue };

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
    interviewType: 'HR' | 'Technical';
    userCv: string;
    history: any[];
    prompt: string;
}

export async function interviewPrepAction(userId: string, input: InterviewPrepActionInput): Promise<{ success: boolean; data?: { response: string }; error?: string }> {
    if (!db) {
        return { success: false, error: "Database service is not available." };
    }

    try {
        const result = await interviewPrepFlow({
            jobTitle: input.jobTitle,
            jobDescription: input.jobDescription,
            interviewType: input.interviewType,
            userCv: input.userCv,
            history: input.history,
            prompt: input.prompt,
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

export async function generateChatTitleAction(input: GenerateChatTitleInput) {
    try {
        const result = await generateChatTitleFlow(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error generating chat title:", error);
        return { success: false, error: "Failed to generate chat title." };
    }
}

export async function getPublicPortfolioAction(portfolioId: string): Promise<{ success: boolean; data?: PortfolioData; error?: string }> {
    if (!db) {
        return { success: false, error: "Database service is not available." };
    }
    try {
        const portfoliosRef = collectionGroup(db, 'portfolios');
        const snapshot = await getDocs(portfoliosRef);
        
        const portfolioDoc = snapshot.docs.find(doc => doc.id === portfolioId);

        if (!portfolioDoc) {
            return { success: false, error: "Portfolio not found." };
        }

        const data = portfolioDoc.data();
        
        // Sanitize Firestore Timestamps
        for (const key in data) {
            if (data[key] instanceof Timestamp) {
                data[key] = data[key].toDate().toISOString();
            }
        }
        
        const portfolioData = { id: portfolioDoc.id, ...data } as PortfolioData;
        
        return { success: true, data: portfolioData };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error fetching public portfolio:", errorMessage);
        return { success: false, error: `Failed to fetch portfolio: ${errorMessage}` };
    }
}

    

    

    


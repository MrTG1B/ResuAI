"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput } from "@/ai/flows/resume-analysis";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import { type PortfolioData } from "@/types/portfolio";

export async function analyzeResumeAction(input: AnalyzeResumeInput) {
  try {
    // Step 1: Analyze resume for text content, get an avatar prompt, and color palette
    const analysisResult = await analyzeResumeFlow(input);
    
    // Step 2: Parse the portfolio draft JSON
    const portfolioDraft: Partial<PortfolioData> = JSON.parse(analysisResult.portfolioDraft);

    // Step 3: Add the color palette
    portfolioDraft.colorPalette = analysisResult.colorPalette;

    // Step 4: Generate the avatar image
    const avatarResult = await generateAvatarFlow({ prompt: analysisResult.avatarPrompt });

    // Step 5: Combine the results
    if (portfolioDraft.personalInfo) {
      portfolioDraft.personalInfo.profilePictureDataUri = avatarResult.imageDataUri;
    } else {
        portfolioDraft.personalInfo = {
            name: '', title: '', email: '', phone: '', website: '', location: '', socials: [],
            profilePictureDataUri: avatarResult.imageDataUri,
        }
    }

    return { success: true, data: portfolioDraft };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    // It's good practice to not expose detailed internal errors to the client.
    return { success: false, error: "Failed to analyze resume. Please check the file format and try again." };
  }
}

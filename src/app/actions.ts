"use server";

import { analyzeResume as analyzeResumeFlow, AnalyzeResumeInput } from "@/ai/flows/resume-analysis";

export async function analyzeResumeAction(input: AnalyzeResumeInput) {
  try {
    const result = await analyzeResumeFlow(input);
    // The output from the AI is a string, so we need to parse it into a JSON object.
    const portfolioDraft = JSON.parse(result.portfolioDraft);
    return { success: true, data: portfolioDraft };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    // It's good practice to not expose detailed internal errors to the client.
    return { success: false, error: "Failed to analyze resume. Please check the file format and try again." };
  }
}

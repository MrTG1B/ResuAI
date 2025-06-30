'use server';

/**
 * @fileOverview Analyzes a resume and extracts key information to create a portfolio draft.
 *
 * - analyzeResume - A function that handles the resume analysis process.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  portfolioDraft: z
    .string()
    .describe('A draft of the portfolio, formatted as a JSON string. It should include personal info, summary, experience, education, skills, projects, and certifications.'),
  avatarPrompt: z
    .string()
    .describe('A simple, two-word prompt for generating a professional avatar based on the resume, like "male engineer" or "female designer". The prompt should be generic and avoid specific names or identifying features.')
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;


export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are an AI expert at creating resumes and portfolios.

  You will analyze the resume and extract key information from it such as experience, education, skills, projects, and any certifications.

  Return the portfolio draft as a JSON string. The JSON should conform to a structure with keys: personalInfo, summary, experience, education, skills, projects, certifications.

  Also, based on the resume, generate a simple, two-word, generic prompt for creating a professional avatar image. For example: "male software engineer", "female graphic designer". Do not include any names or specific identifying details in the avatar prompt.

  Here is the resume:
  {{media url=resumeDataUri}}`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchema,
    outputSchema: AnalyzeResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

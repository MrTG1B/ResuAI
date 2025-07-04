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
    .describe('A simple, two-word prompt for generating a professional avatar based on the resume, like "male engineer" or "female designer". The prompt should be generic and avoid specific names or identifying features.'),
  colorPalette: z.object({
      primary: z.string().describe("A hex color code for the primary color. Should have good contrast with the foreground color."),
      secondary: z.string().describe("A hex color code for the secondary color, used for secondary elements like card backgrounds."),
      accent: z.string().describe("A hex color code for the accent color, for buttons and links."),
      background: z.string().describe("A hex color code for the page background."),
      foreground: z.string().describe("A hex color code for the main text color. Should have good contrast with the background color.")
  }).describe("A unique, stylish, and professional color palette for the portfolio. All colors must be valid hex codes. Ensure high contrast between background/foreground and primary/foreground pairs for accessibility.")
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

  You will analyze the resume and extract key information. The extracted information must include:
  - Personal Info: name, professional title, email address, phone number, personal website/portfolio URL, location (city, state), and social media links (e.g., GitHub, LinkedIn).
  - Professional Summary: A brief overview of the candidate's career.
  - Work Experience: A list of jobs including role, company, location, and dates.
  - Education: A list of degrees, schools, and dates.
  - Skills: A list of technical and soft skills.
  - Projects: Any personal or professional projects mentioned.
  - Certifications: Any professional certifications.

  Return the extracted information as a JSON string in the 'portfolioDraft' field. This JSON string must have the following keys: personalInfo, summary, experience, education, skills, projects, certifications. The 'personalInfo' object must contain all the details extracted above (name, title, email, phone, website, location). It should also include a 'socials' field, which is an array of objects. Each object should have a 'platform' and 'url' key (e.g., [{"platform": "GitHub", "url": "..."}]). If no social links are found, return an empty array for 'socials'.

  For each project in the 'projects' array, extract its name, description, technologies, and URL. Also, include a 'previewImage' field for each project and set its value to an empty string.

  Also, generate a simple, two-word, generic prompt for creating a professional avatar image for the 'avatarPrompt' field. For example: "male software engineer", "female graphic designer". Do not include any names or specific identifying details in this prompt.
  
  Finally, generate a unique, stylish, and professional color palette for the portfolio for the 'colorPalette' field. The palette should consist of five hex color codes: primary, secondary, accent, background, and foreground. Ensure the generated palette is aesthetically pleasing and that there is sufficient contrast between background and foreground colors, as well as primary and foreground colors, to meet accessibility standards (WCAG AA).

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

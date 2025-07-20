
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
      "A resume file (PDF, DOCX, or HTML) as a data URI. This is the primary source of information. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

// Define detailed schemas for structured extraction
const SocialLinkSchema = z.object({
    platform: z.string().describe("The social media platform (e.g., 'GitHub', 'LinkedIn')."),
    url: z.string().url().describe("The full URL to the user's profile."),
});

const PersonalInfoSchema = z.object({
    name: z.string().describe("The user's full name.").optional(),
    title: z.string().describe("The user's professional title (e.g., 'Software Engineer').").optional(),
    email: z.string().email().describe("The user's email address.").optional(),
    phone: z.string().describe("The user's phone number.").optional(),
    website: z.string().url().describe("The user's personal website or portfolio URL.").optional(),
    location: z.string().describe("The user's location (e.g., 'San Francisco, CA').").optional(),
    socials: z.array(SocialLinkSchema).describe("A list of social media links.").optional(),
});

const ExperienceSchema = z.object({
    role: z.string().describe("The job title or role."),
    company: z.string().describe("The name of the company."),
    location: z.string().describe("The location of the company.").optional(),
    dates: z.string().describe("The start and end dates of employment."),
    description: z.array(z.string()).describe("A list of key responsibilities or achievements in this role."),
});

const EducationSchema = z.object({
    degree: z.string().describe("The degree or qualification obtained."),
    school: z.string().describe("The name of the educational institution."),
    location: z.string().describe("The location of the institution.").optional(),
    dates: z.string().describe("The start and end dates of study."),
});

const ProjectSchema = z.object({
    name: z.string().describe("The name of the project."),
    description: z.string().describe("A brief description of the project."),
    technologies: z.array(z.string()).describe("A list of technologies used in the project.").optional(),
    url: z.string().url().describe("A URL to the project if available.").optional(),
    previewImage: z.string().describe("Leave this field as an empty string. It will be populated later.").default(""),
});

const CertificationSchema = z.object({
    name: z.string().describe("The name of the certification."),
    issuingOrganization: z.string().describe("The organization that issued the certification."),
    date: z.string().describe("The date the certification was obtained.").optional(),
    credentialUrl: z.string().url().describe("A URL to the credential if available.").optional(),
});

const PortfolioDraftSchema = z.object({
    personalInfo: PersonalInfoSchema.describe("The user's personal and contact information.").optional(),
    summary: z.string().describe("A professional summary or objective from the resume.").optional(),
    experience: z.array(ExperienceSchema).describe("A list of the user's work experiences.").optional(),
    education: z.array(EducationSchema).describe("A list of the user's educational background.").optional(),
    skills: z.array(z.string()).describe("A list of skills extracted from the resume.").optional(),
    projects: z.array(ProjectSchema).describe("A list of projects the user has worked on.").optional(),
    certifications: z.array(CertificationSchema).describe("A list of the user's certifications.").optional(),
});


const AnalyzeResumeOutputSchema = z.object({
  portfolioDraft: PortfolioDraftSchema.describe("The structured portfolio data extracted from the resume."),
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
  model: 'gemini-1.5-flash',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are an AI expert at analyzing resumes and extracting structured information. The provided resume may be in a variety of formats and layouts. Do your best to logically parse the content.

  Your task is to extract the key information from the resume and populate the fields of the output schema.
  - For sections like work experience, education, projects, and certifications, extract each item into a corresponding object in the array.
  - If a section or a specific field within a section is not present in the resume (e.g., no 'Projects' section, or a job entry is missing a 'location'), simply omit it from the output or provide an empty array/string where appropriate. Your primary goal is to extract as much information as possible while adhering to the output schema.
  - Also generate a simple, two-word, generic prompt for creating a professional avatar image for the 'avatarPrompt' field. For example: "male software engineer", "female graphic designer". Do not include any names or specific identifying details in this prompt.
  - Finally, generate a unique, stylish, and professional color palette for the portfolio for the 'colorPalette' field. Ensure the generated palette is aesthetically pleasing and that there is sufficient contrast to meet accessibility standards (WCAG AA).

  Here is the resume content:
  {{media url=resumeDataUri}}
  `,
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


'use server';

/**
 * @fileOverview Generates a complete, professional, ATS-friendly single-page resume
 * from a user's profile data using AI.
 *
 * - generateResumeFromProfile - A function that generates a resume from profile data.
 * - GenerateResumeInput - The input type.
 * - GenerateResumeOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SocialLinkSchema = z.object({
    platform: z.string(),
    url: z.string(),
});
const ExperienceSchema = z.object({
    role: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    dates: z.string().optional(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
});
const EducationSchema = z.object({
    degree: z.string(),
    school: z.string(),
    location: z.string().optional(),
    dates: z.string().optional(),
});
const ProjectSchema = z.object({
    name: z.string(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
    technologies: z.array(z.string()).optional(),
    url: z.string().optional(),
});
const CertificationSchema = z.object({
    name: z.string(),
    issuingOrganization: z.string(),
    date: z.string().optional(),
    credentialUrl: z.string().optional(),
});
const PublicationSchema = z.object({
    title: z.string(),
    journal: z.string(),
    date: z.string().optional(),
    url: z.string().optional(),
});
const LanguageSchema = z.object({
    language: z.string(),
    proficiency: z.string(),
});

const UserProfileSchema = z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    profilePictureUrl: z.string().optional().nullable(),
    socials: z.array(SocialLinkSchema).optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(ExperienceSchema).optional(),
    education: z.array(EducationSchema).optional(),
    projects: z.array(ProjectSchema).optional(),
    certifications: z.array(CertificationSchema).optional(),
    publications: z.array(PublicationSchema).optional(),
    languages: z.array(LanguageSchema).optional(),
    interests: z.array(z.string()).optional(),
});

const GenerateResumeInputSchema = z.object({
    userProfile: UserProfileSchema.describe("The user's complete profile data to build the resume from."),
});
export type GenerateResumeInput = z.infer<typeof GenerateResumeInputSchema>;

const GenerateResumeOutputSchema = z.object({
    htmlContent: z.string().describe('The complete HTML content of the generated resume.'),
});
export type GenerateResumeOutput = z.infer<typeof GenerateResumeOutputSchema>;

export async function generateResumeFromProfile(
    input: GenerateResumeInput
): Promise<GenerateResumeOutput> {
    return generateResumeFlow(input);
}

const generateResumePrompt = ai.definePrompt({
    name: 'generateResumeFromProfilePrompt',
    model: 'googleai/gemini-2.5-flash-preview-04-17',
    input: { schema: GenerateResumeInputSchema },
    output: { schema: GenerateResumeOutputSchema },
    system: `You are an expert resume writer and designer. Your task is to generate a single-page, professional, industry-standard, ATS-friendly resume in HTML format using the user's profile data provided below.

**CRITICAL RULES:**
1. **ATS-FRIENDLY DESIGN:** Create a resume that can be easily parsed by Applicant Tracking Systems (ATS):
   - Use a clean, single-column layout with a subtle border around the page.
   - Use standard web-safe fonts such as 'Arial', 'Helvetica', 'Times New Roman', or 'Georgia'.
   - Use clear, standard section headings: "Work Experience", "Education", "Skills", "Projects", "Certifications", "Languages".
   - Avoid tables, graphics, icons (unless explicitly requested), or multi-column layouts.
2. **Single-Page Layout:** The entire resume MUST fit neatly on a single A4 page (content area approx 184.6mm × 271.6mm, accounting for 12.7mm margins on each side). Be concise.
3. **HTML Only:** Output MUST be a single, complete block of valid HTML. Do NOT include \`<html>\`, \`<head>\`, or \`<body>\` tags.
4. **Inline CSS:** All styling MUST use inline CSS (e.g., \`style="font-size: 11pt;"\`). Use a clean, modern, professional colour scheme.
5. **Complete Content:** Include ALL sections for which data is provided — Contact Info, Summary/Objective, Work Experience, Education, Skills, Projects, Certifications, Languages, Interests, and Social Links.
6. **Professional Language:** Write or improve bullet points to be action-oriented, quantified where possible, and impactful.
7. **No Placeholders:** Only include sections where real data is available. Do not add placeholder text or comments.`,
    prompt: `Generate a complete, professional, single-page ATS-friendly resume in HTML using the following profile data.

Profile Data:
{{{json userProfile}}}

Return a single block of HTML with inline CSS only (no <html>, <head>, or <body> tags).`,
});

const generateResumeFlow = ai.defineFlow(
    {
        name: 'generateResumeFromProfile',
        inputSchema: GenerateResumeInputSchema,
        outputSchema: GenerateResumeOutputSchema,
    },
    async (input) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_BASE = 1000;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const { output } = await generateResumePrompt(input);
                if (!output) {
                    throw new Error('AI failed to generate a response.');
                }
                return output;
            } catch (error: any) {
                console.error(`generateResumeFromProfile attempt ${attempt} failed:`, error);
                if (
                    error.status === 403 ||
                    error.status === 401 ||
                    (error.message &&
                        (error.message.includes('SAFETY') ||
                            error.message.includes('blocked') ||
                            error.message.includes('API_KEY') ||
                            error.message.includes('leaked') ||
                            error.message.includes('Forbidden') ||
                            error.message.includes('API key')))
                ) {
                    throw error;
                }
                if (attempt === MAX_RETRIES) throw error;
                const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error('Maximum retries exceeded');
    }
);

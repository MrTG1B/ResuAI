
'use server';

/**
 * @fileOverview Extracts structured resume data (JSON) from HTML resume content.
 * Used to prepare data for LaTeX-based PDF generation.
 *
 * - extractResumeData - Extracts structured JSON from HTML resume content.
 * - ExtractResumeDataInput - The input type.
 * - ExtractResumeDataOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractResumeDataInputSchema = z.object({
    htmlContent: z.string().describe('The HTML content of the resume to extract data from.'),
});
export type ExtractResumeDataInput = z.infer<typeof ExtractResumeDataInputSchema>;

const SocialLinkSchema = z.object({
    platform: z.string().describe('e.g. LinkedIn, GitHub, Portfolio'),
    url: z.string().describe('The full URL'),
});

const ExperienceSchema = z.object({
    role: z.string().describe('Job title'),
    company: z.string().describe('Company name'),
    location: z.string().optional().describe('City, Country'),
    dates: z.string().optional().describe('e.g. Jan 2020 - Present'),
    bullets: z.array(z.string()).optional().describe('List of bullet points describing responsibilities and achievements'),
});

const EducationSchema = z.object({
    degree: z.string().describe('Degree name, e.g. B.S. Computer Science'),
    school: z.string().describe('Institution name'),
    location: z.string().optional(),
    dates: z.string().optional(),
});

const ProjectSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    url: z.string().optional(),
});

const CertificationSchema = z.object({
    name: z.string(),
    issuingOrganization: z.string(),
    date: z.string().optional(),
});

const LanguageSchema = z.object({
    language: z.string(),
    proficiency: z.string(),
});

const ResumeDataSchema = z.object({
    name: z.string().describe('Full name'),
    title: z.string().optional().describe('Professional title/headline'),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional().describe('Professional summary or objective'),
    socials: z.array(SocialLinkSchema).optional(),
    skills: z.array(z.string()).optional().describe('List of skills'),
    experience: z.array(ExperienceSchema).optional(),
    education: z.array(EducationSchema).optional(),
    projects: z.array(ProjectSchema).optional(),
    certifications: z.array(CertificationSchema).optional(),
    languages: z.array(LanguageSchema).optional(),
    interests: z.array(z.string()).optional(),
});

const ExtractResumeDataOutputSchema = z.object({
    resumeData: ResumeDataSchema.describe('The structured resume data extracted from the HTML.'),
});
export type ExtractResumeDataOutput = z.infer<typeof ExtractResumeDataOutputSchema>;

export async function extractResumeData(
    input: ExtractResumeDataInput
): Promise<ExtractResumeDataOutput> {
    return extractResumeDataFlow(input);
}

const extractResumeDataPrompt = ai.definePrompt({
    name: 'extractResumeDataPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: ExtractResumeDataInputSchema },
    output: { schema: ExtractResumeDataOutputSchema },
    system: `You are a precise data extraction tool. Your task is to extract ALL structured data from the provided HTML resume content and return it as a JSON object.

**CRITICAL RULES:**
1. Extract EVERY piece of information present in the HTML — do not skip anything.
2. For work experience, extract each bullet point as a separate string in the "bullets" array.
3. For skills, extract them as individual strings.
4. If a section does not exist in the HTML, omit the field entirely.
5. Preserve the exact text as it appears in the HTML — do not rewrite or modify content.
6. For social links, identify the platform name (e.g., LinkedIn, GitHub, Portfolio) from the URL or label.
7. Return ONLY the structured JSON data, nothing else.`,
    prompt: `Extract all structured data from this HTML resume:

{{{htmlContent}}}`,
});

const extractResumeDataFlow = ai.defineFlow(
    {
        name: 'extractResumeData',
        inputSchema: ExtractResumeDataInputSchema,
        outputSchema: ExtractResumeDataOutputSchema,
    },
    async (input) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_BASE = 1000;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const { output } = await extractResumeDataPrompt(input);
                if (!output) {
                    throw new Error('AI failed to extract resume data.');
                }
                return output;
            } catch (error: any) {
                console.error(`extractResumeData attempt ${attempt} failed:`, error);
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

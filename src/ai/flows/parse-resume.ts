
'use server';

/**
 * @fileOverview Parses a resume file and extracts its content as HTML.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  htmlContent: z
    .string()
    .describe('The full HTML content extracted from the resume.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(
  input: ParseResumeInput
): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const systemPrompt = `You are an expert resume writer and designer. Your task is to:
1. Extract ALL text content from the provided resume document.
2. Using that extracted content, generate a brand-new, single-page, professional, industry-standard, ATS-friendly HTML resume.

**CRITICAL RULES:**
1.  **ATS-FRIENDLY DESIGN:** Create a clean, modern resume that Applicant Tracking Systems can parse easily:
    - Single-column layout with a subtle border around the page.
    - Standard web-safe fonts: 'Arial', 'Helvetica', 'Times New Roman', or 'Georgia'.
    - Clear standard section headings: "Work Experience", "Education", "Skills", "Projects", "Certifications".
    - No tables, graphics, or multi-column layouts.
2.  **Single-Page Layout:** The final resume MUST fit on a single A4 page.
3.  **New Professional Design:** Do NOT preserve the original document's layout or styling. Generate a fresh, modern, professional design.
4.  **Inline CSS Only:** All styling MUST use inline CSS (e.g., \`style="font-size: 11pt;"\`). No <style> tags.
5.  **No Extra Tags:** Do not include <html>, <head>, or <body> tags. The output MUST be a single block of HTML.
6.  **Complete Content:** Include every piece of information found in the original document — contact details, summary, experience, education, skills, projects, certifications, languages, and any other relevant sections.`;

const prompt = ai.definePrompt({
    name: 'parseResumePrompt',
    model: 'googleai/gemini-2.5-flash',
    system: systemPrompt,
    input: { schema: ParseResumeInputSchema },
    output: { schema: ParseResumeOutputSchema },
    prompt: `{{media url=resumeDataUri}}

Please extract all text content from the provided resume document and generate a brand-new, professional, single-page, ATS-friendly HTML resume using that content. Apply a clean, modern design with inline CSS.
    `
});


const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResume',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_BASE = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { output } = await prompt(input);
        if (!output) {
          throw new Error('AI failed to generate a response.');
        }
        return output;
      } catch (error: any) {
        console.error(`parseResume attempt ${attempt} failed:`, error);
        if (
          error.message &&
          (error.message.includes('SAFETY') ||
            error.message.includes('blocked') ||
            error.message.includes('API_KEY'))
        ) {
          throw error;
        }
        if (attempt === MAX_RETRIES) throw error;
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
);

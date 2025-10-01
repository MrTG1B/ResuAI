
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

const systemPrompt = `You are an AI expert at parsing documents and converting them to high-fidelity, single-page, ATS-FRIENDLY HTML resumes. Your task is to extract the content from the provided document and convert it into a single block of clean, semantic HTML that fits on a standard A4 page.

**CRITICAL RULES:**
1.  **ATS-FRIENDLY FIRST:** Your primary goal is to create a resume that can be easily parsed by Applicant Tracking Systems (ATS). This means a single-column layout, standard fonts, and no tables for layout.
2.  **Single-Page Layout:** The final resume MUST be designed to fit on a single page.
3.  **High-Fidelity Conversion:** Preserve the structure, layout, and all text formatting as accurately as possible within the constraints.
4.  **Styling:** Use inline CSS styles (e.g., <p style="color: #123456; font-size: 12pt;">) to replicate formatting.
5.  **No Extra Tags:** Do not include <html>, <head>, or <body> tags. The output MUST be a single block of HTML.`;

const prompt = ai.definePrompt({
    name: 'parseResumePrompt',
    model: 'googleai/gemini-2.5-flash',
    system: systemPrompt,
    input: { schema: ParseResumeInputSchema },
    output: { schema: ParseResumeOutputSchema },
    prompt: `{{media url=resumeDataUri}}

Please convert the provided document into a single block of ATS-friendly HTML with inline styles.
    `
});


const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResume',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('AI failed to generate a response.');
    }
    return output;
  }
);


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

const systemPrompt = `You are an AI expert at parsing documents and converting them to high-fidelity, single-page, ATS-FRIENDLY HTML resumes.

  Your task is to extract the content from the provided document and convert it into a single block of clean, semantic HTML that fits on a standard A4 page (content area approx 184.6mm x 271.6mm).

  **CRITICAL RULES:**
  1.  **ATS-FRIENDLY FIRST:** Your primary goal is to create a resume that can be easily parsed by Applicant Tracking Systems (ATS). This means:
      *   **Single-Column Layout:** The final resume **MUST** be in a single-column layout. If the original has multiple columns, you must intelligently merge them into a single, logical flow.
      *   **Standard Fonts:** Use common, readable, web-safe fonts like 'Arial', 'Helvetica', 'Times New Roman', 'Georgia'.
      *   **No Tables for Layout:** **NEVER** use HTML tables for layout purposes. Use divs, headings, and paragraphs.
  2.  **Single-Page Layout:** The final resume **MUST** be designed to fit on a single page. If the original document is longer than one page, you must use your design skills to make it fit. Do this by adjusting font sizes (while keeping them readable), using space-efficient layouts, or professionally condensing content.
  3.  **High-Fidelity Conversion:** Preserve the structure, layout, and all text formatting as accurately as possible within the single-page, single-column constraint.
  4.  **Styling:** Use inline CSS styles (e.g., <p style="color: #123456; font-size: 12pt;">) to replicate font sizes, colors, weights (bold), styles (italic), and alignment.
  5.  **No Extra Tags:** Do not include <html>, <head>, or <body> tags. The output MUST be a single block of HTML with inline CSS.`;

/**
 * Strips the "data:<mimetype>;base64," prefix from a data URI.
 */
function stripDataUriPrefix(dataUri: string): {
  mimeType: string;
  base64: string;
} {
  const match = dataUri.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error(
      'Invalid Data URI format. Expected "data:<mimetype>;base64,<data>".'
    );
  }
  return {mimeType: match[1], base64: match[2]};
}

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResume',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {mimeType, base64} = stripDataUriPrefix(input.resumeDataUri);

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: systemPrompt,
      prompt: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64,
          },
        },
        {
          text: 'Please convert the provided document into a single block of ATS-friendly HTML with inline styles.',
        },
      ],
      output: {
        schema: ParseResumeOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('AI failed to generate a response.');
    }
    return output;
  }
);

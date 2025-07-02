'use server';

/**
 * @fileOverview Parses a resume file and extracts its content as HTML.
 *
 * - parseResume - A function that handles parsing the resume.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  htmlContent: z
    .string()
    .describe('The full HTML content extracted from the resume.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;


export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: {schema: ParseResumeInputSchema},
  output: {schema: ParseResumeOutputSchema},
  prompt: `You are an AI expert at parsing documents and converting them to high-fidelity HTML.
  
  Your task is to extract the content from the provided document and convert it into a single block of clean, semantic HTML. It is crucial that you preserve the structure, layout, and all text formatting as accurately as possible.

  Pay meticulous attention to detail. The goal is a pixel-perfect HTML representation of the original document.
  - Use inline CSS styles within the HTML tags (e.g., <p style="color: #123456; font-size: 12pt;">) to ensure the visual representation is a near-perfect match to the original document.
  - Replicate font sizes, font colors, font weights (bold, normal), font styles (italic), and text alignment.
  - Preserve hyperlinks (<a> tags).
  - If the document uses columns, use CSS flexbox or grid layouts to replicate them.
  - Do not include <html>, <head>, or <body> tags. The output MUST be a single block of HTML with inline CSS.

  Here is the document:
  {{media url=resumeDataUri}}`,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

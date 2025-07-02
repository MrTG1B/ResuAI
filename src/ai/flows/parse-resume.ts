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
  prompt: `You are an AI expert at parsing documents.
  
  Extract the content from the following document and convert it into clean, semantic HTML. Preserve the structure, layout, and text formatting (like bold, italics, lists, and headings) as accurately as possible.
  
  Do not include <html>, <head>, or <body> tags. The output should only be the HTML content for the document's body.

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

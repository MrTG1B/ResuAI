
'use server';
/**
 * @fileOverview An AI flow to refine a user's professional summary.
 *
 * - refineSummary - A function that handles the refinement process.
 * - RefineSummaryInput - The input type for the flow.
 * - RefineSummaryOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineSummaryInputSchema = z.object({
  summary: z.string().describe('The user\'s current professional summary or "About Me" text.'),
});
export type RefineSummaryInput = z.infer<typeof RefineSummaryInputSchema>;

const RefineSummaryOutputSchema = z.object({
  refinedSummary: z
    .string()
    .describe('The rewritten, improved professional summary.'),
});
export type RefineSummaryOutput = z.infer<typeof RefineSummaryOutputSchema>;

export async function refineSummary(input: RefineSummaryInput): Promise<RefineSummaryOutput> {
  return refineSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineSummaryPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: RefineSummaryInputSchema},
  output: {schema: RefineSummaryOutputSchema},
  system: `You are an expert career coach and copywriter specializing in personal branding.
Your task is to rewrite the user's professional summary to be more concise, impactful, and professional.
Focus on highlighting strengths and framing their experience in a compelling way. The tone should be confident and professional.
Keep it to a single, powerful paragraph.
`,
  prompt: `Please refine the following professional summary:

"{{{summary}}}"
  `,
});

const refineSummaryFlow = ai.defineFlow(
  {
    name: 'refineSummary',
    inputSchema: RefineSummaryInputSchema,
    outputSchema: RefineSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

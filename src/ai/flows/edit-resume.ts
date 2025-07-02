'use server';

/**
 * @fileOverview Edits resume content based on user prompts using an AI.
 *
 * - editResume - A function that handles the resume editing process.
 * - EditResumeInput - The input type for the editResume function.
 * - EditResumeOutput - The return type for the editResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditResumeInputSchema = z.object({
  htmlContent: z.string().describe('The current HTML content of the resume.'),
  prompt: z.string().describe("The user's instruction for what to change."),
});
export type EditResumeInput = z.infer<typeof EditResumeInputSchema>;

const EditResumeOutputSchema = z.object({
  newHtmlContent: z.string().describe('The updated, complete HTML content of the resume.'),
  response: z.string().describe('A friendly, conversational response to the user explaining the changes made.'),
});
export type EditResumeOutput = z.infer<typeof EditResumeOutputSchema>;

export async function editResume(input: EditResumeInput): Promise<EditResumeOutput> {
  return editResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editResumePrompt',
  input: {schema: EditResumeInputSchema},
  output: {schema: EditResumeOutputSchema},
  prompt: `You are an expert resume editor and career coach AI. Your task is to modify a user's resume based on their instructions.

  You will be given the full current HTML of their resume and a prompt explaining the change they want to make.

  Instructions:
  1. Read the user's prompt carefully to understand their request.
  2. Modify the resume's HTML content according to the prompt. Your output must be the *entire*, updated resume as a single block of clean, semantic HTML. Do not just output the changed section.
  3. Generate a brief, friendly, and conversational response to the user. Confirm that you've made the change and briefly explain what you did. For example: "I've updated your summary to be more action-oriented and impactful. Take a look!" or "I've corrected the typos you pointed out. Let me know what you'd like to do next!".
  
  CURRENT RESUME HTML:
  ---
  {{{htmlContent}}}
  ---

  USER'S INSTRUCTION:
  ---
  {{{prompt}}}
  ---
  `,
});

const editResumeFlow = ai.defineFlow(
  {
    name: 'editResumeFlow',
    inputSchema: EditResumeInputSchema,
    outputSchema: EditResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

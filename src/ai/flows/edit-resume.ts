'use server';

/**
 * @fileOverview Edits resume content based on user prompts using an AI.
 *
 * - editResumeFlow - A function that handles the resume editing process.
 * - EditResumeInput - The input type for the editResumeFlow function.
 * - EditResumeOutput - The return type for the editResumeFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditResumeInputSchema = z.object({
  htmlContent: z.string().describe('The current HTML content of the resume.'),
  prompt: z.string().describe("The user's instruction for what to change."),
  attachmentDataUris: z
    .array(z.string())
    .optional()
    .describe(
      "An optional list of attached files (e.g., certificates or project details) as data URIs. The AI can use these as context for edits. Each string should be a data URI: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EditResumeInput = z.infer<typeof EditResumeInputSchema>;

const EditResumeOutputSchema = z.object({
  newHtmlContent: z.string().describe('The updated, complete HTML content of the resume.'),
  response: z.string().describe('A friendly, conversational response to the user explaining the changes made.'),
});
export type EditResumeOutput = z.infer<typeof EditResumeOutputSchema>;

export async function editResumeFlow(input: EditResumeInput): Promise<EditResumeOutput> {
  return _editResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editResumePrompt',
  input: {schema: EditResumeInputSchema},
  output: {schema: EditResumeOutputSchema},
  prompt: `You are an expert resume editor and career coach AI. Your task is to modify a user's resume based on their instructions.

  You will be given the full current HTML of their resume and a prompt explaining the change they want to make. The current resume HTML contains inline CSS to preserve its visual style.

  Instructions:
  1. Read the user's prompt carefully to understand their request.
  2. Modify the resume's HTML content according to the prompt. Your output must be the *entire*, updated resume as a single block of clean, semantic HTML.
  3. **Crucially, you must preserve all existing inline CSS styles** for elements that are not being changed. When you modify an element, try to maintain a consistent style with the rest of the document.
  4. Generate a brief, friendly, and conversational response to the user. Confirm that you've made the change and briefly explain what you did. Use Markdown for formatting (e.g., **bolding**, lists) to make your response clear and easy to read. For example: "I've updated your summary to be more **action-oriented** and **impactful**. Take a look!" or "I've corrected the typos you pointed out. Let me know what you'd like to do next!".

  CURRENT RESUME HTML:
  ---
  {{{htmlContent}}}
  ---

  USER'S INSTRUCTION:
  ---
  {{{prompt}}}
  ---
  
  {{#if attachmentDataUris}}
  ADDITIONAL CONTEXT FROM ATTACHED FILES:
  ---
  You also have the following files attached for context. Use the information within them to inform your edits.
  {{#each attachmentDataUris}}
  Attachment {{@index}}:
  {{media url=this}}
  {{/each}}
  ---
  {{/if}}
  `,
});

const _editResumeFlow = ai.defineFlow(
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

'use server';

/**
 * @fileOverview Edits or analyzes resume content based on user prompts using an AI.
 *
 * - editResumeFlow - A function that handles the resume editing/analysis process.
 * - EditResumeInput - The input type for the editResumeFlow function.
 * - EditResumeOutput - The return type for the editResumeFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditResumeInputSchema = z.object({
  htmlContent: z.string().describe('The current HTML content of the resume.'),
  prompt: z
    .string()
    .describe("The user's instruction for what to change or question to answer."),
  attachmentDataUris: z
    .array(z.string())
    .optional()
    .describe(
      "An optional list of attached files (e.g., certificates or project details) as data URIs. The AI can use these as context for edits or analysis. Each string should be a data URI: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EditResumeInput = z.infer<typeof EditResumeInputSchema>;

const EditResumeOutputSchema = z.object({
  newHtmlContent: z
    .string()
    .describe(
      'The updated, complete HTML content of the resume. If the user asked a question, this should be the original, unmodified HTML.'
    ),
  response: z
    .string()
    .describe(
      'A friendly, conversational response to the user. This can be a confirmation of an edit or an answer to a question.'
    ),
});
export type EditResumeOutput = z.infer<typeof EditResumeOutputSchema>;

export async function editResumeFlow(
  input: EditResumeInput
): Promise<EditResumeOutput> {
  return _editResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editResumePrompt',
  input: {schema: EditResumeInputSchema},
  output: {schema: EditResumeOutputSchema},
  prompt: `You are an expert resume editor and designer AI. Your task is to edit a user's resume based on their instructions.

  You will be given the full current HTML of their resume and a prompt from the user. You must only perform **edits**.

  **If the user's prompt is a command to change, modify, add, remove, or redesign the resume (e.g., "Change my job title to Senior Developer," "Apply a modern, two-column template," "Fix the typos in my summary"), you must follow these instructions:**
  1.  Modify the resume's HTML content according to the prompt. Your output must be the **entire**, updated resume as a single block of clean, semantic HTML with inline CSS.
  2.  **Template Redesigns:** If the user asks to apply a template, redesign the resume, or change the layout, you should completely redesign the HTML and inline CSS to create a professional, industry-standard resume.
  3.  **Minor Edits:** If the user asks for a minor change (e.g., correcting a typo, updating a job title), you must **preserve all existing inline CSS styles** for elements that are not being changed. When you modify an element, try to maintain a consistent style.
  4.  Generate a brief, friendly response confirming the change. For example: "I've updated your resume with a professional two-column template. Take a look!".
  5.  Return the modified HTML in the \`newHtmlContent\` field and the confirmation in the \`response\` field.

  **If the user asks a question or asks for analysis/feedback (e.g., "Is this resume good?", "How can I improve this?"), DO NOT change the HTML.** Instead, you must respond by politely redirecting them to the dedicated "Resume Analyzer" tool.
  -   Your response should be: "I can only help with direct edits here. For feedback and analysis on how your resume matches a job description, please use our 'Resume Analyzer' tool from the dashboard. It's designed to give you detailed coaching and suggestions!"
  -   Return the **original, unmodified** HTML in the \`newHtmlContent\` field.

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
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

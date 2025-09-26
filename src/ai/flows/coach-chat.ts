
'use server';

/**
 * @fileOverview A conversational AI flow for providing follow-up coaching on a resume analysis.
 *
 * - coachChat - A function that handles the conversational coaching.
 * - CoachChatInput - The input type for the function.
 * - CoachChatOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CoachChatInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume file as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescription: z.string().describe('The job description text.'),
  initialAnalysis: z
    .string()
    .describe('The initial analysis that was provided to the user.'),
  prompt: z
    .string()
    .describe("The user's follow-up question or message."),
  attachmentDataUris: z
    .array(z.string())
    .optional()
    .describe(
      'An optional list of attached files for additional context as data URIs.'
    ),
});
export type CoachChatInput = z.infer<typeof CoachChatInputSchema>;

const CoachChatOutputSchema = z.object({
  response: z
    .string()
    .describe(
      'A friendly, conversational response to the user, formatted in Markdown.'
    ),
});
export type CoachChatOutput = z.infer<typeof CoachChatOutputSchema>;


export async function coachChat(input: CoachChatInput): Promise<CoachChatOutput> {
  return coachChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coachChatPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: CoachChatInputSchema},
  output: {schema: CoachChatOutputSchema},
  system: `You are an expert AI career coach. You have already provided an initial analysis of a user's resume against a job description. The user now has a follow-up question or comment.

Your task is to provide a helpful, encouraging, and conversational response based on the **original resume**, the **job description**, the **initial analysis you provided**, and the user's new message. You can refer back to your original points or provide new insights.

If the user provides new documents, use them as additional context. Always format your response in Markdown for readability.

Remember to be encouraging and conclude by promoting our other tools using Markdown links. For example: "That's a great question! Based on your resume, you could highlight [...]. When you're ready to apply these changes, you can use our [**AI Resume Editor**](/resume-builder/editor) and then create a beautiful [**AI Portfolio**](/build) to impress recruiters!"`,
  prompt: `---
ORIGINAL RESUME:
{{media url=resumeDataUri}}
---
JOB DESCRIPTION:
{{{jobDescription}}}
---
YOUR INITIAL ANALYSIS:
{{{initialAnalysis}}}
---
USER'S NEW MESSAGE:
{{{prompt}}}
---

{{#if attachmentDataUris}}
ADDITIONAL CONTEXT FROM ATTACHED FILES:
---
{{#each attachmentDataUris}}
Attachment {{@index}}:
{{media url=this}}
{{/each}}
---
{{/if}}
`,
});

const coachChatFlow = ai.defineFlow(
  {
    name: 'coachChat',
    inputSchema: CoachChatInputSchema,
    outputSchema: CoachChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

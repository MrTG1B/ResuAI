
'use server';

/**
 * @fileOverview A conversational AI flow for providing general career coaching.
 *
 * - careerCoachChat - A function that handles the conversational coaching.
 * - CareerCoachChatInput - The input type for the function.
 * - CareerCoachChatOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { type ChatMessage } from '@/types/resume';

const CareerCoachChatInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }))
    .describe('The history of the conversation so far.'),
  prompt: z
    .string()
    .describe("The user's latest question or message."),
});
export type CareerCoachChatInput = z.infer<typeof CareerCoachChatInputSchema>;

const CareerCoachChatOutputSchema = z.object({
  response: z
    .string()
    .describe(
      'A friendly, conversational response to the user, formatted in Markdown.'
    ),
});
export type CareerCoachChatOutput = z.infer<typeof CareerCoachChatOutputSchema>;


export async function careerCoachChat(input: CareerCoachChatInput): Promise<CareerCoachChatOutput> {
  return careerCoachChatFlow(input);
}

const prompt = ai.definePrompt({
  model:'googleai/gemini-2.5-flash',
  name: 'careerCoachChatPrompt',
  input: {schema: CareerCoachChatInputSchema},
  output: {schema: CareerCoachChatOutputSchema},
  prompt: `You are an expert AI career coach. Your goal is to provide helpful, encouraging, and actionable advice to users about their careers.

You can answer questions about:
- Resume and cover letter writing
- Interview preparation and practice
- Career path planning and exploration
- Skill development and learning resources
- Job searching strategies
- Salary negotiation

Maintain a friendly, professional, and supportive tone. Format your responses in Markdown for readability.

Here is the conversation history:
---
{{#each history}}
{{this.role}}: {{{this.content}}}
{{/each}}
---

Here is the user's latest message:
---
User: {{{prompt}}}
---
AI:
`,
});

const careerCoachChatFlow = ai.defineFlow(
  {
    name: 'careerCoachChatFlow',
    inputSchema: CareerCoachChatInputSchema,
    outputSchema: CareerCoachChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

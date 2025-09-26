
'use server';
/**
 * @fileOverview An AI flow to generate a short, descriptive title for a chat session.
 *
 * - generateChatTitle - A function that handles the title generation.
 * - GenerateChatTitleInput - The input type for the function.
 * - GenerateChatTitleOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateChatTitleInputSchema = z.object({
  messages: z.array(ChatMessageSchema).describe("The first few messages of the conversation."),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe("A short, descriptive title for the chat session, no longer than 5-6 words."),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateChatTitleInputSchema},
  output: {schema: GenerateChatTitleOutputSchema},
  system: `You are an AI expert at summarizing conversations. Your task is to generate a short, descriptive title (5-6 words max) for a new chat session based on the initial messages. The title should be unique and accurately reflect the main topic of the conversation.

Examples:
- "Resume feedback for SWE"
- "Drafting LinkedIn post about AI"
- "Interview prep for Product Manager"
- "Cover letter for Google"
`,
  prompt: `Please generate a title for a chat containing these messages:
---
{{#each messages}}
**{{role}}:** {{content}}
---
{{/each}}
`,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

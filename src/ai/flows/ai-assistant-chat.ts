
'use server';

/**
 * @fileOverview A conversational AI flow for a general-purpose professional assistant.
 *
 * - aiAssistantChat - A function that handles the conversational AI assistance.
 * - AIAssistantChatInput - The input type for the function.
 * - AIAssistantChatOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAssistantChatInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }))
    .describe('The history of the conversation so far.'),
  prompt: z
    .string()
    .describe("The user's latest question or message."),
  attachments: z
    .array(z.object({
        dataUri: z.string().describe("A file as a data URI: 'data:<mimetype>;base64,<encoded_data>'."),
        mimeType: z.string().describe("The MIME type of the file (e.g., 'image/png').")
    }))
    .optional()
    .describe(
      "An optional list of attached files. The AI can use these as context for its response."
    ),
});
export type AIAssistantChatInput = z.infer<typeof AIAssistantChatInputSchema>;

const AIAssistantChatOutputSchema = z.object({
  response: z
    .string()
    .describe(
      'A friendly, conversational response to the user, formatted in Markdown.'
    ),
});
export type AIAssistantChatOutput = z.infer<typeof AIAssistantChatOutputSchema>;


export async function aiAssistantChat(input: AIAssistantChatInput): Promise<AIAssistantChatOutput> {
  return aiAssistantChatFlow(input);
}

const prompt = ai.definePrompt({
  model:'googleai/gemini-1.5-flash',
  name: 'aiAssistantChatPrompt',
  input: {schema: AIAssistantChatInputSchema},
  output: {schema: AIAssistantChatOutputSchema},
  system: `You are an expert AI Assistant for professionals. Your name is Mentra. Your goal is to provide helpful, encouraging, and actionable assistance to users about their careers and professional tasks.

You can help with a wide range of topics, including:
- Resume and cover letter writing
- Interview preparation and practice
- Career path planning and exploration
- Writing professional content like LinkedIn posts, emails, and bios.
- Skill development and learning resources
- Job searching strategies
- Salary negotiation

If the user provides attachments, use them as context for your response.
Maintain a friendly, professional, and supportive tone. Format your responses in Markdown for readability.`,
  prompt: `User: {{{prompt}}}
AI:
{{#if attachments}}
---
ATTACHED FILES FOR CONTEXT:
{{#each attachments}}
- Attachment {{@index}}: {{media url=this.dataUri contentType=this.mimeType}}
{{/each}}
---
{{/if}}
`,
});

const aiAssistantChatFlow = ai.defineFlow(
  {
    name: 'aiAssistantChat',
    inputSchema: AIAssistantChatInputSchema,
    outputSchema: AIAssistantChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, { history: input.history });
    return output!;
  }
);

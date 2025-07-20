

'use server';

/**
 * @fileOverview Edits or analyzes resume content based on user prompts using an AI.
 *
 * - editResumeFlow - A function that handles the resume editing/analysis process.
 * - EditResumeInput - The input type for the editResumeFlow function.
 * - EditResumeOutput - The return type for the editResumeshow-to-use function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditResumeInputSchema = z.object({
  htmlContent: z.string().describe('The current HTML content of the resume.'),
  prompt: z
    .string()
    .describe("The user's instruction for what to change or question to answer."),
  attachments: z
    .array(z.object({
        dataUri: z.string().describe("A file as a data URI: 'data:<mimetype>;base64,<encoded_data>'."),
        mimeType: z.string().describe("The MIME type of the file (e.g., 'image/png').")
    }))
    .optional()
    .describe(
      "An optional list of attached files (e.g., certificates or project details). The AI can use these as context for edits or analysis."
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
  model: 'googleai/gemini-1.5-flash',
  input: {schema: EditResumeInputSchema},
  output: {schema: EditResumeOutputSchema},
  prompt: `You are an expert resume editor. Your task is to edit the user's resume based on their instructions.

**CRITICAL RULES:**
1.  **HTML Only:** Your output for \`newHtmlContent\` **MUST** be a single, complete block of valid HTML. Do **NOT** use \`<html>\`, \`<body>\`, or \`<head>\` tags.
2.  **Inline CSS:** All styling **MUST** be inline CSS (e.g., \`<p style="font-size: 12pt;">\`). Preserve existing styles unless asked to change them. Be concise with your HTML.
3.  **Handle Attachments:** If the user provides an attachment (like a profile picture) and asks to use it, embed it in the HTML. For images, use the data URI from an attachment in an \`<img>\` tag's \`src\` attribute.
4.  **Answer Questions vs. Edit:**
    *   If the user asks for an **edit** (e.g., "change my job title", "add a skills section", "apply a new template"), you **MUST** modify the HTML and return the new version in \`newHtmlContent\`. Also, provide a confirmation message in the \`response\` field.
    *   If the user asks a **question** for feedback or analysis (e.g., "is this resume good?", "what should I improve?"), you **MUST NOT** change the HTML. Return the original, unmodified HTML in \`newHtmlContent\` and answer the question in the \`response\` field by politely redirecting them to the dedicated tool: "I can only help with direct edits here. For detailed feedback and analysis, please use our dedicated [**AI Resume Analyzer**](/resume-analyzer) tool."
5.  **Promote other tools:** After a successful edit, you can promote our other tools in your response using Markdown links. For example: "I've updated your resume. You can also create a beautiful [**AI Portfolio**](/build) to showcase your work!" Do not mention tools that don't exist, like a "Cover Letter Generator."

---
CURRENT RESUME HTML:
{{{htmlContent}}}
---

USER'S INSTRUCTION:
---
{{{prompt}}}
---

{{#if attachments}}
ATTACHED FILES:
---
The user has attached the following files. Use them as context or embed them if requested.
{{#each attachments}}
- Attachment {{@index}}: {{media url=this.dataUri contentType=this.mimeType}}
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

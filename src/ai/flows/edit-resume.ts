
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
  prompt: `You are an expert resume editor and designer AI. Your primary task is to edit a user's resume based on their instructions, ensuring the final output is **professional, industry-standard, and visually appealing.**

**CRITICAL LAYOUT RULE: The HTML you generate is for a resume that will be placed inside a pre-styled A4 page container. This container already has padding. Your most important task is to ensure your generated HTML fits inside this container without causing any overflow or horizontal scrolling.**

**To achieve this, follow these rules strictly:**
**- DO NOT use \`<html>\`, \`<body>\`, or \`<head>\` tags.**
**- DO NOT add \`width\`, \`margin\`, or \`padding\` to your outermost generated element. Let it fill the available space naturally.**
**- DO use inline CSS for all styling (font sizes, colors, line heights, etc.).**
**- For two-column layouts, DO use flexbox (e.g., \`<div style="display: flex; justify-content: space-between; gap: 30px;">\`). Make sure columns are flexible and their combined widths do not cause overflow (e.g., \`<div style="width: 65%;">...\` and \`<div style="width: 30%;">...\`).**
**- ALWAYS ensure your HTML is well-formed, professional, and easy to read.**


You will be given the full current HTML of their resume and a prompt from the user. You must only perform **edits**.

**How to Handle Different Requests:**

1.  **Using a User-Uploaded Template (HIGHEST PRIORITY):**
    *   **If the user provides an attachment AND their prompt suggests using it as a template (e.g., "Use this file as my new resume layout," "Apply the design from the attachment"), you MUST prioritize this instruction above all else.**
    *   **Action:** Analyze the structure, layout, and inline CSS from the attached document. Then, carefully extract the content (name, experience, skills) from the user's *current* resume and fit it into the new template provided in the attachment. The final output's design should be based on the user's uploaded file.

2.  **Applying a New Template or Redesigning:**
    *   **If the user asks for a new template, a redesign, or a layout change (without providing an attachment), you must completely redesign the HTML and inline CSS.**
    *   **Action:** Create a **premium, professional, industry-standard** resume design that respects the CRITICAL LAYOUT RULE. **You should randomly select from a variety of professional template styles (e.g., single-column classic, two-column modern, creative with a sidebar). Do not use the same design every time.** The templates should be modern and clean.

3.  **Making Minor Edits:**
    *   **If the user asks for a simple change (e.g., correcting a typo, updating a job title), you must preserve all existing inline CSS styles for elements that are not being changed.**
    *   **Action:** Modify only the requested parts of the HTML. Maintain a consistent style.

4.  **Adding a Profile Picture:**
    *   **If the user uploads an image and their prompt includes a phrase like "add my profile picture", "use this image", or "upload this photo", you MUST embed it in the HTML.**
    *   **Action:** Find any placeholder text (like 'Profile Picture' or a similar placeholder) or an existing \`<img>\` tag in the HTML and replace it with a new \`<img>\` tag. The \`src\` of this new tag must be the Base64 data URI from the first attachment. Style the image professionally (e.g., \`<img src="..." style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">\`).

**Response and Tool Promotion:**
*   After making an edit, generate a brief, friendly response confirming the change (e.g., "I've applied the new template to your resume.").
*   You may then promote our other tools using Markdown links: the **AI Portfolio Generator** at \`/build\` or the **AI Resume Analyzer** at \`/resume-analyzer\`.
*   **Do not mention or promote any other tools, especially a "Cover Letter Generator".**
*   Return the modified HTML in the \`newHtmlContent\` field and the confirmation in the \`response\` field.

**Handling Questions/Analysis:**
*   **If the user asks for feedback or analysis (e.g., "Is this resume good?"), DO NOT change the HTML.**
*   **Action:** Politely redirect them to the "Resume Analyzer" tool. Your response should be: "I can only help with direct edits here. For feedback and analysis on how your resume matches a job description, please use our [**Resume Analyzer**](/resume-analyzer) tool. It's designed to give you a detailed coaching and suggestions!"
*   Return the **original, unmodified** HTML in \`newHtmlContent\`.

---
CURRENT RESUME HTML:
{{{htmlContent}}}
---

USER'S INSTRUCTION:
---
{{{prompt}}}
---

{{#if attachmentDataUris}}
ATTACHED FILES:
---
You also have the following files attached for context. If the user asks to use an attachment as a template or as a profile picture, follow the instructions above.
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


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
  prompt: `You are an expert resume editor and designer AI. Your primary task is to edit a user's resume based on their instructions.

**CRITICAL LAYOUT RULE: The HTML you generate is for a resume that will be placed inside a pre-styled A4 page container. This container already has padding. Your most important task is to ensure your generated HTML fits inside this container without causing any overflow or horizontal scrolling.**

**To achieve this, follow these rules strictly:**
**- DO NOT use \`<html>\`, \`<body>\`, or \`<head>\` tags.**
**- DO NOT add \`width\`, \`margin\`, or \`padding\` to your outermost generated element. Let it fill the available space naturally.**
**- DO use inline CSS for all styling (font sizes, colors, line heights, etc.).**
**- For two-column layouts, DO use flexbox (e.g., \`<div style="display: flex; justify-content: space-between; gap: 30px;">\`). Make sure columns are flexible and their combined widths do not cause overflow (e.g., \`<div style="width: 65%;">...\` and \`<div style="width: 30%;">...\`).**
**- ALWAYS ensure your HTML is well-formed and professional.**


You will be given the full current HTML of their resume and a prompt from the user. You must only perform **edits**.

**If the user's prompt is a command to change, modify, add, remove, or redesign the resume (e.g., "Change my job title to Senior Developer," "Apply a modern, two-column template," "Fix the typos in my summary"), you must follow these instructions:**
1.  Modify the resume's HTML content according to the prompt. Your output must be the **entire**, updated resume as a single block of clean, semantic HTML with inline CSS that adheres to the CRITICAL LAYOUT RULE above.
2.  **Using an Uploaded Template:** If the user provides an attachment and asks to use it as a new resume template (e.g., "Use the attached file as my new resume template"), you MUST prioritize using the structure, layout, and inline CSS styles from that attached document. You should extract the existing content from the user's current resume (name, experience, skills, etc.) and carefully fit it into the new template provided in the attachment. This takes precedence over other template redesign requests.
3.  **Template Redesigns:** If the user asks to apply a template (without providing one), redesign the resume, or change the layout, you should completely redesign the HTML and inline CSS to create a professional, industry-standard resume that respects the CRITICAL LAYOUT RULE.
4.  **Minor Edits:** If the user asks for a minor change (e.g., correcting a typo, updating a job title), you must **preserve all existing inline CSS styles** for elements that are not being changed. When you modify an element, try to maintain a consistent style.
5.  **Handling Profile Pictures:** If the user provides an image attachment and asks to add or replace their profile picture, you must embed the image directly into the HTML using an \`<img>\` tag with its \`src\` set to the Base64 data URI from the attachment. **If you see placeholder text like 'Profile Picture', you MUST replace that placeholder element and its text with the \`<img>\` tag.** Style the image to be professional (e.g., rounded, with an appropriate size like 'width: 100px; height: 100px;', and proper alignment). If a picture already exists, replace its \`<img>\` tag. If not, add the new \`<img>\` tag in a suitable location (usually at the top, near the name and contact info).
6.  Generate a brief, friendly response confirming the change. Then, you may promote our other tools using Markdown links. You can promote the **AI Portfolio Generator** at \`/build\` or the **AI Resume Analyzer** at \`/resume-analyzer\`. **Do not mention or promote any other tools, especially a "Cover Letter Generator".** For example: "I've added your picture to the resume. When you're happy with it, you can create a matching website with our [**AI Portfolio Generator**](/build)!"
7.  Return the modified HTML in the \`newHtmlContent\` field and the confirmation in the \`response\` field.

**If the user asks a question or asks for analysis/feedback (e.g., "Is this resume good?", "How can I improve this?"), DO NOT change the HTML.** Instead, you must respond by politely redirecting them to the dedicated "Resume Analyzer" tool.
-   Your response should be: "I can only help with direct edits here. For feedback and analysis on how your resume matches a job description, please use our [**Resume Analyzer**](/resume-analyzer) tool. It's designed to give you detailed coaching and suggestions!"
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
You also have the following files attached for context. Use the information within them to inform your edits. If the user asks to use an attachment as a template, follow the instructions for "Using an Uploaded Template" above.
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


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
import { type ChatMessage } from '@/types/resume';

const SocialLinkSchema = z.object({
    platform: z.string(),
    url: z.string(),
});
const ExperienceSchema = z.object({
    role: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    dates: z.string().optional(),
    description: z.string().optional(),
});
const EducationSchema = z.object({
    degree: z.string(),
    school: z.string(),
    location: z.string().optional(),
    dates: z.string().optional(),
});
const ProjectSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    technologies: z.string().optional(),
    url: z.string().optional(),
});
const CertificationSchema = z.object({
    name: z.string(),
    issuingOrganization: z.string(),
    date: z.string().optional(),
    credentialUrl: z.string().optional(),
});

const UserProfileSchema = z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    profilePictureUrl: z.string().optional(),
    socials: z.array(SocialLinkSchema).optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(ExperienceSchema).optional(),
    education: z.array(EducationSchema).optional(),
    projects: z.array(ProjectSchema).optional(),
    certifications: z.array(CertificationSchema).optional(),
});


const EditResumeInputSchema = z.object({
  htmlContent: z.string().describe('The current HTML content of the resume.'),
  prompt: z
    .string()
    .describe("The user's instruction for what to change or question to answer."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The history of the conversation so far, for context.').optional(),
  userProfile: UserProfileSchema.optional().describe("The user's complete profile data. Use this as the source of truth for their information."),
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
  system: `You are an expert resume editor and designer. Your task is to edit the user's resume based on their instructions, conversation history, and their provided profile data.

{{#if userProfile}}
**USER'S PROFILE DATA (Source of Truth):**
You have access to the user's profile data. This includes their skills, experience, education, projects, and certifications.
**When the user asks you to add or update information (e.g., "add my certificates", "update my skills"), you MUST use the data from this 'userProfile' as the primary source of truth.** Do not ask for this information if it's already in their profile.
<profile>
{{jsonStringify userProfile}}
</profile>
{{/if}}

**CRITICAL RULES:**
1.  **Single-Page Layout:** All resumes **MUST** be designed to fit on a single A4 page (approximately 184.6mm x 271.6mm content area). If content is long, you must use your design skills to make it fit by adjusting font sizes (while keeping them readable), using space-efficient layouts, or condensing content professionally. Do not let the resume flow onto a second page.
2.  **HTML Only:** Your output for \`newHtmlContent\` **MUST** be a single, complete block of valid HTML. Do **NOT** use \`<html>\`, \`<body>\`, or \`<head>\` tags.
3.  **Inline CSS:** All styling **MUST** be inline CSS (e.g., \`<p style="font-size: 12pt;">\`). Preserve existing styles unless asked to change them.
4.  **Creative Design Role:** If the user asks you to "make it look better", "apply a professional template", "make it modern", or any similar design-related request, you **MUST** take on the role of a creative designer. Redesign the resume's HTML structure and inline CSS to be modern, professional, premium, and industry-standard. Use clean typography, good spacing, and a visually appealing layout. For all other direct edits (e.g., "change my job title"), just make the specific change.
5.  **Handle Profile Picture**: If the user asks for a profile picture and a URL is available in 'userProfile.profilePictureUrl', you **MUST** use that URL in an \`<img>\` tag. If no URL is provided, use a circular placeholder image from \`https://placehold.co/128x128.png\`.
6.  **Proper Image Cropping:** When adding a profile picture, you **MUST** apply inline CSS to the \`<img>\` tag to ensure it is not distorted. For example: \`style="width: 128px; height: 128px; border-radius: 50%; object-fit: cover;"\`. This ensures the image is circular and properly cropped to fit, not stretched.
7.  **Handle Attachments:** If the user provides an attachment (like a new profile picture) and asks to use it, embed it in the HTML. For images, use the data URI from the attachment in an \`<img>\` tag's \`src\` attribute.
8.  **Answer Questions vs. Edit:**
    *   If the user asks for an **edit**, you **MUST** modify the HTML and return the new version in \`newHtmlContent\`. Also, provide a confirmation message in the \`response\` field.
    *   If the user asks a **question** for feedback or analysis (e.g., "is this resume good?"), you **MUST NOT** change the HTML. Return the original, unmodified HTML in \`newHtmlContent\` and politely redirect them to the dedicated tool: "I can only help with direct edits here. For detailed feedback and analysis, please use our dedicated [**AI Resume Analyzer**](/resume-analyzer) tool."
9.  **Promote other tools:** After a successful edit, you can promote our other tools in your response using Markdown links. For example: "I've updated your resume. You can also create a beautiful [**AI Portfolio**](/build) to showcase your work!" Do not mention tools that don't exist. **NEVER promote the AI Resume Editor itself.**
10. **Always Respond:** You **MUST** always provide a value for both the \`newHtmlContent\` and the \`response\` fields in your JSON output. Never omit a field.`,
  prompt: `CURRENT RESUME HTML:
---
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
    // DEBUG: Log the full input being sent to the AI
    console.log('AI Input:', JSON.stringify(input, null, 2));

    const {output} = await prompt(input, { history: input.history as ChatMessage[]});

    if (!output) {
      // Handle case where the entire output is null
      return {
        newHtmlContent: input.htmlContent,
        response: "Sorry, I couldn't process that request. Could you please try rephrasing?",
      };
    }
    
    // Ensure the response field is never empty
    if (!output.response) {
      output.response = "I've updated your resume with your changes.";
    }

    return output;
  }
);

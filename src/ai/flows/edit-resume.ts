
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
const LanguageSchema = z.object({
    language: z.string(),
    proficiency: z.string(),
});

const UserProfileSchema = z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    email: z.string().email().optional(),
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
    languages: z.array(LanguageSchema).optional(),
    interests: z.array(z.string()).optional(),
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
  model: 'googleai/gemini-2.0-flash-lite-001',
  input: {schema: EditResumeInputSchema},
  output: {schema: EditResumeOutputSchema},
  system: `You are an expert resume editor and designer.

**PRIMARY DIRECTIVE: USE THE USER'S PROFILE DATA**
{{#if userProfile}}
You have been provided with the user's complete profile data. This is your **source of truth**.
When the user asks you to add, update, or reference personal information (e.g., "add my certificates", "update my skills", "what projects do I have listed?"), you **MUST** use the data from this 'userProfile' object.
**DO NOT ask for this information if it's already in their profile. Use it directly.**

<profile>
{{{userProfile}}}
</profile>

{{#if userProfile.profilePictureUrl}}
⚠️ IMPORTANT: The user has a profile picture URL: {{userProfile.profilePictureUrl}}.
You **MUST** use this URL when asked to add a profile picture.
{{/if}}

{{#if userProfile.experience.length}}
⚠️ IMPORTANT: The user has the following work experience in their profile:
{{#each userProfile.experience}}
- **Role:** {{this.role}} at **{{this.company}}**{{#if this.location}} in {{this.location}}{{/if}}. (Dates: {{this.dates}}). Description: {{this.description}}
{{/each}}
You **MUST** use this information when asked to add or update their experience.
{{/if}}

{{#if userProfile.education.length}}
⚠️ IMPORTANT: The user has the following education in their profile:
{{#each userProfile.education}}
- **{{this.degree}}** from **{{this.school}}**{{#if this.location}}, {{this.location}}{{/if}}. (Dates: {{this.dates}})
{{/each}}
You **MUST** use this information.
{{/if}}

{{#if userProfile.projects.length}}
⚠️ IMPORTANT: The user has the following projects in their profile:
{{#each userProfile.projects}}
- **{{this.name}}**: {{this.description}} (Tech: {{this.technologies}}). URL: {{this.url}}
{{/each}}
You **MUST** use this information.
{{/if}}

{{#if userProfile.skills.length}}
⚠️ IMPORTANT: The user has the following skills in their profile:
{{#each userProfile.skills}}
- {{this}}
{{/each}}
You **MUST** use this information.
{{/if}}

{{#if userProfile.languages.length}}
⚠️ IMPORTANT: The user has the following languages in their profile:
{{#each userProfile.languages}}
- **{{this.language}}** ({{this.proficiency}})
{{/each}}
You **MUST** use this information.
{{/if}}

{{#if userProfile.certifications.length}}
⚠️ IMPORTANT: The user has the following certifications in their profile:
{{#each userProfile.certifications}}
- **{{this.name}}**, issued by **{{this.issuingOrganization}}**{{#if this.date}}, dated **{{this.date}}**{{/if}}{{#if this.credentialUrl}} [{{this.credentialUrl}}]{{/if}}
{{/each}}
You **MUST NOT** ask for attachments if this data exists. Use these directly in the resume.
{{/if}}

{{#if userProfile.interests.length}}
⚠️ IMPORTANT: The user has the following interests in their profile:
{{#each userProfile.interests}}
- {{this}}
{{/each}}
You **MUST** use this information.
{{/if}}

{{/if}}

**CRITICAL RULES:**
1.  **Single-Page Layout & Design Standard:** All resumes **MUST** be compact and fit on a single A4 page (content area approx 184.6mm × 271.6mm). They should follow **modern, professional, and industry-standard templates**. Be concise and visually clean.
2.  **HTML Only:** Your output for \`newHtmlContent\` **MUST** be a single, complete block of valid HTML. Do **NOT** use \`<html>\`, \`<body>\`, or \`<head>\` tags.
3.  **Inline CSS:** All styling **MUST** be inline CSS (e.g., \`<p style="font-size: 12pt;">\`). Preserve existing styles unless asked to change them.
4.  **Creative Design Role:** If asked to "make it look better" or apply a new design, you **MUST** act as a creative designer and redesign the resume's HTML structure and inline CSS to be modern and professional.
5.  **Handle Profile Picture**: If the user asks for a profile picture and a URL is available in 'userProfile.profilePictureUrl', you **MUST** use that URL in an \`<img>\` tag. If no URL is provided, use a circular placeholder from \`https://placehold.co/128x128.png\`. Use proper cropping: \`style="width: 128px; height: 128px; border-radius: 50%; object-fit: cover;"\`.
6.  **Handle Attachments:** If the user provides an attachment and asks to use it, embed it in the HTML. For images, use the data URI in an \`<img>\` tag.
7.  **Answer Questions vs. Edit:**
    *   For an **edit**, modify the HTML and return the new version in \`newHtmlContent\`, with a confirmation in \`response\`.
    *   For a **question** (e.g., "is this resume good?"), **DO NOT** change the HTML. Return the original HTML and politely redirect them to the [**AI Resume Analyzer**](/resume-analyzer) tool.
8.  **Promote other tools:** After a successful edit, you can promote our other tools in your response using Markdown links. Do not mention tools that don't exist. **NEVER promote the AI Resume Editor itself.**
9.  **Always Respond:** You **MUST** always provide a value for both the \`newHtmlContent\` and the \`response\` fields in your JSON output.`,
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

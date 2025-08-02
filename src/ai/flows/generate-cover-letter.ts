
'use server';
/**
 * @fileOverview An AI flow to generate a professional cover letter.
 *
 * - generateCoverLetter - A function that handles the generation process.
 * - GenerateCoverLetterInput - The input type for the flow.
 * - GenerateCoverLetterOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialLinkSchema = z.object({ platform: z.string(), url: z.string() });
const ExperienceSchema = z.object({ role: z.string().optional(), company: z.string().optional(), location: z.string().optional(), dates: z.string().optional(), description: z.string().optional() });
const EducationSchema = z.object({ degree: z.string(), school: z.string(), location: z.string().optional(), dates: z.string().optional() });
const ProjectSchema = z.object({ name: z.string(), description: z.string().optional(), technologies: z.string().optional(), url: z.string().optional() });
const CertificationSchema = z.object({ name: z.string(), issuingOrganization: z.string(), date: z.string().optional(), credentialUrl: z.string().optional() });
const PublicationSchema = z.object({ title: z.string(), journal: z.string(), date: z.string().optional(), url: z.string().url().optional() });
const LanguageSchema = z.object({ language: z.string(), proficiency: z.string() });

const UserProfileSchema = z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    socials: z.array(SocialLinkSchema).optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(ExperienceSchema).optional(),
    education: z.array(EducationSchema).optional(),
    projects: z.array(ProjectSchema).optional(),
    certifications: z.array(CertificationSchema).optional(),
    publications: z.array(PublicationSchema).optional(),
    languages: z.array(LanguageSchema).optional(),
    interests: z.array(z.string()).optional(),
});


const GenerateCoverLetterInputSchema = z.object({
  userProfile: UserProfileSchema.describe("The user's complete professional profile data. This is the primary source of truth for the user's skills and experience."),
  jobDescription: z.string().describe('The full job description for the role they are applying for.'),
  companyName: z.string().describe('The name of the company.'),
  hiringManager: z.string().optional().describe("The hiring manager's name, if known."),
  tone: z.enum(['Professional', 'Enthusiastic', 'Formal', 'Creative']).default('Professional').describe('The desired tone of the cover letter.'),
});
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The fully generated cover letter text, formatted in Markdown.'),
});
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateCoverLetterInputSchema},
  output: {schema: GenerateCoverLetterOutputSchema},
  system: `You are an expert career coach and professional writer specializing in crafting compelling cover letters that get results.

Your task is to write a personalized, professional cover letter for a user based on their profile and a specific job description.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze and Synthesize:** Do not just list the user's skills. Analyze the user's profile (experience, projects, skills) and the job description. Synthesize this information to show how the user is a perfect fit for the role.
2.  **Structure:** The cover letter must follow a standard professional structure:
    *   **Contact Information:** Start with the user's name and contact details (email, phone, location).
    *   **Date and Recipient:** Add the current date and the recipient's details (Hiring Manager name if provided, Company Name).
    *   **Salutation:** Address the hiring manager by name if provided (e.g., "Dear [Hiring Manager Name],"). If not, use a professional greeting like "Dear Hiring Team,".
    *   **Introduction (Paragraph 1):** State the position being applied for and where it was seen. Express enthusiasm for the role and the company.
    *   **Body (Paragraphs 2-3):** This is the most important part. Connect the user's specific experiences, skills, and projects from their profile to the key requirements in the job description. Use 2-3 concrete examples. Quantify achievements where possible.
    *   **Conclusion (Paragraph 4):** Reiterate enthusiasm for the role, express confidence in their ability to contribute to the company, and state a clear call to action (e.g., "I am eager to discuss how my skills in [Key Skill] can benefit your team and am available for an interview at your earliest convenience.").
    *   **Closing:** Use a professional closing like "Sincerely," or "Best regards," followed by the user's name.
3.  **Tone:** Adapt the letter to the requested tone ({{tone}}), but always maintain a high level of professionalism.
4.  **Keywords:** Naturally weave in keywords from the job description throughout the letter.
5.  **Output:** The final output must be a single string of Markdown text.`,
  prompt: `
**User Profile:**
<profile>
{{{json userProfile}}}
</profile>

---

**Job Description:**
<job_description>
{{{jobDescription}}}
</job_description>

---

**Company Name:** {{{companyName}}}

{{#if hiringManager}}
**Hiring Manager:** {{{hiringManager}}}
{{/if}}

---

Please generate the cover letter now.
`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

    
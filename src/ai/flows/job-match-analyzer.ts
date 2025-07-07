'use server';

/**
 * @fileOverview An AI flow to analyze a resume against a job description.
 *
 * - jobMatchAnalyzerFlow - A function that handles the analysis process.
 * - JobMatchAnalyzerInput - The input type for the flow.
 * - JobMatchAnalyzerOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobMatchAnalyzerInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume file as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescription: z.string().describe('The job description text to compare the resume against.'),
});
export type JobMatchAnalyzerInput = z.infer<typeof JobMatchAnalyzerInputSchema>;

const JobMatchAnalyzerOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A detailed analysis of the resume against the job description, formatted in Markdown.'
    ),
});
export type JobMatchAnalyzerOutput = z.infer<typeof JobMatchAnalyzerOutputSchema>;

export async function jobMatchAnalyzerFlow(
  input: JobMatchAnalyzerInput
): Promise<JobMatchAnalyzerOutput> {
  return _jobMatchAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jobMatchAnalyzerPrompt',
  input: {schema: JobMatchAnalyzerInputSchema},
  output: {schema: JobMatchAnalyzerOutputSchema},
  prompt: `You are an expert AI career coach. Your task is to analyze a user's resume against a provided job description and give them actionable advice to improve their chances of getting an interview.

  **Analysis Steps:**
  1.  **Resume vs. Job Description:** Thoroughly compare the resume content with the keywords, skills, and qualifications listed in the job description.
  2.  **Identify Strengths:** Point out the key strengths of the resume that align well with the job requirements. Be specific (e.g., "Your experience with 'React' and 'Node.js' in the XYZ project is a strong match for their tech stack.").
  3.  **Identify Gaps & Weaknesses:** Clearly identify any missing skills or experience. Suggest what the user could add or rephrase.
  4.  **Provide Actionable Suggestions:** Give concrete, step-by-step recommendations for what the user should change on their resume. For example, "Consider adding a 'Project' section to showcase your work on the ABC app," or "Rephrase your summary to highlight your experience in 'agile methodologies,' which is mentioned multiple times in the job description."
  5.  **Format your response using Markdown** for readability (use headings, bold text, and lists).

  **Promote Other Features:**
  Conclude your analysis by seamlessly advertising our other tools using Markdown links. Include a sentence like this:
  "Once you're ready to make these improvements, use our [**AI Resume Editor**](/resume-builder/editor) to apply the changes effortlessly. After your resume is perfected, you can instantly create a stunning website with our [**AI Portfolio Generator**](/build) to showcase your work to recruiters!"

  Here is the resume:
  {{media url=resumeDataUri}}

  ---

  Here is the job description:
  {{{jobDescription}}}
  `,
});

const _jobMatchAnalyzerFlow = ai.defineFlow(
  {
    name: 'jobMatchAnalyzerFlow',
    inputSchema: JobMatchAnalyzerInputSchema,
    outputSchema: JobMatchAnalyzerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

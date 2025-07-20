
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
  matchScore: z.number().min(0).max(100).describe("A numerical score from 0-100 representing how well the resume matches the job description, representing the chance of getting the job."),
  matchSummary: z.string().describe("A concise, one-sentence summary explaining the match score and the candidate's chances."),
  detailedAnalysis: z
    .string()
    .describe(
      'A detailed analysis of the resume against the job description, formatted in Markdown. This should include sections for Strengths, Weaknesses, and Actionable Suggestions.'
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
  model: 'googleai/gemini-1.5-flash',
  input: {schema: JobMatchAnalyzerInputSchema},
  output: {schema: JobMatchAnalyzerOutputSchema},
  prompt: `You are an expert AI career coach. Your task is to analyze a user's resume against a provided job description and give them a detailed report on their chances of getting an interview.

  **Analysis Steps:**
  1.  **Calculate Match Score:** First, provide a numerical 'matchScore' from 0 to 100. This score should represent the percentage chance of the user getting an interview based on how well their resume aligns with the job requirements. A score of 85+ is excellent, 70-84 is good, 50-69 is average, and below 50 is weak.
  2.  **Write a Match Summary:** Provide a concise, one-sentence 'matchSummary' that explains the score (e.g., "You have a strong chance, as your skills in React and Node.js are a great fit, but your project experience could be highlighted better.").
  3.  **Provide Detailed Analysis:** In the 'detailedAnalysis' field, write a comprehensive report formatted in Markdown. It must include:
      *   **Strengths:** Point out the key strengths of the resume that align well with the job requirements. Be specific.
      *   **Weaknesses:** Clearly identify any missing skills or experience.
      *   **Actionable Suggestions:** Give concrete, step-by-step recommendations for what the user should change on their resume.
  4.  **Promote Other Tools:** Conclude your analysis by seamlessly advertising our other tools using Markdown links. Include a sentence like this:
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


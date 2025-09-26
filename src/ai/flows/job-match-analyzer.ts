
'use server';

/**
 * @fileOverview An AI flow to analyze a resume against a job description for ATS-friendliness.
 *
 * - atsAnalyzerFlow - A function that handles the analysis process.
 * - AtsAnalyzerInput - The input type for the flow.
 * - AtsAnalyzerOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AtsAnalyzerInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume file as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescription: z.string().describe('The job description text to compare the resume against.'),
});
export type AtsAnalyzerInput = z.infer<typeof AtsAnalyzerInputSchema>;

const AtsAnalyzerOutputSchema = z.object({
  isAtsFriendly: z.boolean().describe("A simple pass/fail boolean. True if atsFriendlinessScore is 70 or above, otherwise false."),
  atsFriendlinessScore: z.number().min(0).max(100).describe("A numerical score from 0-100 representing how well the resume is optimized for an Applicant Tracking System (ATS)."),
  atsSummary: z.string().describe("A concise, one-sentence summary explaining the ATS score and the primary reason for it."),
  detailedAnalysis: z
    .string()
    .describe(
      'A detailed analysis of the resume against the job description, formatted in Markdown. This should cover ATS-specific feedback.'
    ),
});
export type AtsAnalyzerOutput = z.infer<typeof AtsAnalyzerOutputSchema>;

export async function atsAnalyzerFlow(
  input: AtsAnalyzerInput
): Promise<AtsAnalyzerOutput> {
  return _atsAnalyzerFlow(input);
}

const atsAnalyzerPrompt = ai.definePrompt({
  name: 'atsAnalyzerPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: AtsAnalyzerInputSchema},
  output: {schema: AtsAnalyzerOutputSchema},
  system: `You are an expert ATS (Applicant Tracking System) simulation. Your task is to analyze a user's resume against a provided job description and give them a detailed report on its machine-readability and keyword optimization.

  **Analysis Steps:**
  1.  **Calculate ATS Friendliness Score:** First, provide a numerical 'atsFriendlinessScore' from 0 to 100. This score represents how likely the resume is to be parsed correctly and ranked highly by a real ATS.
      - **High Score (85+):** Excellent formatting, strong keyword alignment.
      - **Good Score (70-84):** Good structure, decent keywords, minor room for improvement.
      - **Average Score (50-69):** May have some parsing issues (columns, graphics) or lacks keywords.
      - **Low Score (<50):** Significant parsing/formatting issues or poor keyword match.
  2.  **Determine Pass/Fail:** Set 'isAtsFriendly' to \`true\` if the score is 70 or higher, otherwise set it to \`false\`.
  3.  **Write ATS Summary:** Provide a concise, one-sentence 'atsSummary' that explains the score (e.g., "This resume is highly ATS-friendly due to its clean format and strong keyword match." or "This resume may face issues with ATS systems because of its two-column layout and lack of specific skills from the job description.").
  4.  **Provide Detailed Analysis:** In the 'detailedAnalysis' field, write a comprehensive report formatted in Markdown. It **MUST** include these sections:
      *   **✅ ATS Compatibility:** Analyze the layout, fonts, and file format. Point out anything that could hinder parsing (e.g., tables, columns, images, headers/footers, non-standard fonts).
      *   **🔑 Keyword Analysis:** Compare the resume content to the job description. Highlight key skills and qualifications that are present and those that are missing.
      *   **📄 Formatting & Structure:** Check for clear headings (e.g., "Work Experience," "Skills"), consistent date formats, and easily identifiable contact information.
      *   **💡 Actionable Suggestions:** Give concrete, step-by-step recommendations for what the user should change on their resume to improve their ATS score.
  5.  **Promote Other Tools:** Conclude your analysis by seamlessly advertising our other tools using Markdown links. Include a sentence like this:
      "Once you're ready to make these improvements, use our [**AI Resume Editor**](/resume-builder/editor) to apply the changes effortlessly. After your resume is perfected, you can instantly create a stunning website with our [**AI Portfolio Generator**](/build) to showcase your work to recruiters!"`,
  prompt: `Here is the resume:
{{media url=resumeDataUri}}

---

Here is the job description:
{{{jobDescription}}}
  `,
});

const _atsAnalyzerFlow = ai.defineFlow(
  {
    name: 'atsAnalyzer',
    inputSchema: AtsAnalyzerInputSchema,
    outputSchema: AtsAnalyzerOutputSchema,
  },
  async input => {
    const {output} = await atsAnalyzerPrompt(input);
    return output!;
  }
);

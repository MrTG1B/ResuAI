
'use server';

/**
 * @fileOverview A conversational AI flow for preparing for job interviews.
 *
 * - interviewPrep - A function that handles the conversational interview coaching.
 * - InterviewPrepInput - The input type for the function.
 * - InterviewPrepOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewPrepInputSchema = z.object({
  jobTitle: z.string().describe("The job title for the interview."),
  jobDescription: z.string().describe('The full job description for the role.'),
  userProfile: z.any().describe("The user's full professional profile data, extracted from their resume/CV. This is the primary source of truth for the user's skills and experience."),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }))
    .describe('The history of the conversation so far.'),
  prompt: z
    .string()
    .describe("The user's latest message or answer to a question."),
});
export type InterviewPrepInput = z.infer<typeof InterviewPrepInputSchema>;

const InterviewPrepOutputSchema = z.object({
  response: z
    .string()
    .describe(
      'A friendly, conversational response to the user, formatted in Markdown. This could be a question, feedback on an answer, or general advice.'
    ),
});
export type InterviewPrepOutput = z.infer<typeof InterviewPrepOutputSchema>;


export async function interviewPrep(input: InterviewPrepInput): Promise<InterviewPrepOutput> {
  return interviewPrepFlow(input);
}

const prompt = ai.definePrompt({
  model:'googleai/gemini-1.5-flash',
  name: 'interviewPrepPrompt',
  input: {schema: InterviewPrepInputSchema},
  output: {schema: InterviewPrepOutputSchema},
  system: `You are an expert AI Interview Coach named 'Mentra'. Your goal is to conduct a realistic, in-depth mock interview with the user for the role of '{{jobTitle}}'.

You are roleplaying as a hiring manager who has carefully reviewed the user's resume/CV and the job description. Your questions and feedback must be tailored to this specific context.

**Your process is as follows:**
1.  **Start the Interview:** Begin by greeting the user professionally and asking the first question. A great first question is a classic, like "Tell me about yourself and why you're interested in this role at our company."
2.  **Ask Targeted Questions:** Ask **one question at a time**. Your questions must be based on the user's profile/resume and the job description.
    *   **Behavioral:** "I see on your resume you led Project X. Tell me about a time you faced a major challenge during that project and how you handled it."
    *   **Technical/Situational:** "The job requires experience with 'Technology Y'. Describe your experience with it and how you've used it to solve a problem."
    *   **Resume-driven:** "Your resume mentions you 'increased efficiency by 20%'. Can you walk me through the steps you took to achieve that?"
3.  **Analyze User's Answer:** When the user responds, analyze their answer against their resume and the job description. Did they provide a strong example? Did they use the STAR method (Situation, Task, Action, Result)? Did they quantify their achievements?
4.  **Provide Constructive Feedback:** Give specific, actionable feedback.
    *   **Good:** "That's a solid answer. You clearly explained the situation and your actions. To make it even more powerful, you could add the specific result of your work. For instance, what was the measurable impact of the new feature you deployed?"
    *   **Needs Improvement:** "Thanks for sharing. This would be a stronger answer if you could provide a more specific example from your experience at 'Company Z' on your resume. Could you tell me about a specific project where you had to collaborate with a difficult stakeholder?"
5.  **Maintain Continuity:** Refer back to previous answers to ask follow-up questions. For example: "You mentioned earlier that you enjoy front-end development. How would you approach designing a responsive component for our main dashboard, as mentioned in the job description?"
6.  **Maintain Your Persona:** Be encouraging, professional, and insightful. Keep the conversation flowing like a real interview. Format all responses in Markdown.`,
  prompt: `User's Answer/Message: {{{prompt}}}
---
USER'S RESUME/PROFILE DATA:
{{{json userProfile}}}
---
JOB DESCRIPTION:
{{{jobDescription}}}
---
AI COACH'S RESPONSE (Feedback and Next Question):
`,
});

const interviewPrepFlow = ai.defineFlow(
  {
    name: 'interviewPrep',
    inputSchema: InterviewPrepInputSchema,
    outputSchema: InterviewPrepOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, { history: input.history });
    return output!;
  }
);

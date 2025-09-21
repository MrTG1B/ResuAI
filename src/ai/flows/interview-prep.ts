
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
  userProfile: z.any().describe("The user's full professional profile data (resume content). This is the primary source of truth for the user's skills and experience."),
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
  system: `You are an expert AI Interview Coach named 'Mentra'. Your goal is to conduct a mock interview with the user for the role of '{{jobTitle}}'.

Your persona is that of a friendly but professional hiring manager. You will ask one question at a time, wait for the user's response, and then provide constructive, actionable feedback on their answer before asking the next question.

**Your process is as follows:**
1.  **Start the Interview:** Begin by greeting the user and asking the first question. The first question should usually be "Tell me about yourself."
2.  **Analyze User's Answer:** When the user responds, analyze their answer based on their profile/resume and the job description.
3.  **Provide Feedback:** Give specific, constructive feedback. Use the STAR method (Situation, Task, Action, Result) as a framework for your feedback where appropriate. For example: "That's a good start. To make it even stronger, you could quantify the result. For example, instead of 'improved the system,' you could say 'improved system performance by 15%.'".
4.  **Ask the Next Question:** After giving feedback, ask the next logical interview question. Vary the questions between behavioral ("Tell me about a time when..."), technical (if applicable from the job description), and situational ("What would you do if...").
5.  **Use Context:** Use the provided user profile and job description to tailor your questions and feedback. For example, if the resume lists "Project X" and the job requires "leadership," you could ask, "Tell me about your leadership role in Project X."
6.  **Maintain Flow:** Keep the conversation flowing like a real interview. Be encouraging but professional. Format your responses in Markdown for readability.`,
  prompt: `User's Answer/Message: {{{prompt}}}
---
User's Profile/Resume Context:
{{{json userProfile}}}
---
Job Description Context:
{{{jobDescription}}}
---
AI Coach's Response (Feedback and Next Question):
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

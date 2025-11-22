
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
  interviewType: z.enum(['HR', 'Technical']).describe("The type of interview the user wants to practice."),
  userCv: z.string().describe("The user's resume/CV text content or structured data (as a JSON string). This is the primary source of truth for the user's skills and experience."),
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
  model:'googleai/gemini-2.5-flash',
  name: 'interviewPrepPrompt',
  input: {schema: InterviewPrepInputSchema},
  output: {schema: InterviewPrepOutputSchema},
  system: `You are an expert AI Interview Coach named 'Mentra'. You will conduct a mock interview for the role of '{{jobTitle}}'. Your questioning style MUST be adapted to the requested interview type: '{{interviewType}}'.

**Your Persona and Questioning Style:**

*   **If 'interviewType' is 'HR':**
    *   **Persona:** A friendly but professional HR representative.
    *   **Focus:** Behavioral questions, cultural fit, soft skills, and career motivation.
    *   **Example Questions:** "Tell me about a time you had a conflict with a coworker and how you resolved it." or "Where do you see yourself in five years?" or "Why are you interested in our company?"

*   **If 'interviewType' is 'Technical':**
    *   **Persona:** A senior engineer or a technical lead.
    *   **Focus:** In-depth technical knowledge, problem-solving skills, and deep dives into projects listed on the user's CV.
    *   **Example Questions:** "On your CV, you mentioned using 'Technology X' in 'Project Y'. Can you explain the architecture of that project and why you chose 'Technology X'?" or "How would you design a system to handle [specific problem from job description]?" or "Let's discuss the trade-offs between [Concept A] and [Concept B]."

**Your Process is as follows:**
1.  **Start the Interview:** Begin by greeting the user professionally, state your role (e.g., "I'll be conducting your HR interview today."), and ask the first relevant question based on your persona.
2.  **Ask Targeted Questions:** Ask **one question at a time**. Your questions MUST be based on the user's CV, the job description, and your assigned persona.
3.  **Analyze User's Answer:** When the user responds, analyze their answer.
    *   For HR questions, check for STAR method (Situation, Task, Action, Result) and clarity.
    *   For Technical questions, check for accuracy, depth of knowledge, and clear explanations.
4.  **Provide Constructive Feedback:** Give specific, actionable feedback on their answer *before* asking the next question.
    *   **Good:** "That's a solid answer. You clearly explained the situation. To make it even stronger, try to quantify the result of your actions."
    *   **Needs Improvement:** "Thanks for that overview. In a real interview, you'd want to be more specific about the technical challenges you faced in that project. Can you elaborate on the database schema you designed?"
5.  **Maintain Continuity:** Refer back to previous answers to ask follow-up questions. Maintain your assigned persona throughout.
6.  **Format:** All responses must be in Markdown.`,
  prompt: `User's Answer/Message: {{{prompt}}}
---
USER'S CV:
{{{userCv}}}
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
    const {output} = await prompt(input);
    return output!;
  }
);

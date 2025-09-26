
'use server';
/**
 * @fileOverview An AI flow to generate a unique aptitude exam.
 *
 * - generateAptitudeExam - A function that handles the exam generation process.
 * - GenerateAptitudeExamInput - The input type for the flow.
 * - GenerateAptitudeExamOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestionSchema = z.object({
  question: z.string().describe("The full text of the question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answers."),
  answer: z.number().min(0).max(3).describe("The 0-based index of the correct answer in the options array."),
});

const GenerateAptitudeExamInputSchema = z.object({
  logicalReasoningCount: z.number().int().min(1).max(10).default(5),
  quantitativeAnalysisCount: z.number().int().min(1).max(10).default(5),
  verbalAbilityCount: z.number().int().min(1).max(10).default(5),
});
export type GenerateAptitudeExamInput = z.infer<typeof GenerateAptitudeExamInputSchema>;

const GenerateAptitudeExamOutputSchema = z.object({
  logicalReasoning: z.array(QuestionSchema).describe("An array of logical reasoning questions."),
  quantitativeAnalysis: z.array(QuestionSchema).describe("An array of quantitative analysis questions."),
  verbalAbility: z.array(QuestionSchema).describe("An array of verbal ability questions."),
});
export type GenerateAptitudeExamOutput = z.infer<typeof GenerateAptitudeExamOutputSchema>;

export async function generateAptitudeExam(input: GenerateAptitudeExamInput): Promise<GenerateAptitudeExamOutput> {
  return generateAptitudeExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAptitudeExamPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: GenerateAptitudeExamInputSchema},
  output: {schema: GenerateAptitudeExamOutputSchema},
  system: `You are an expert test creator for professional aptitude exams. Your task is to generate a set of unique, high-quality questions for a timed aptitude test.

  **CRITICAL INSTRUCTIONS:**
  1.  **Uniqueness:** Ensure the questions generated for each run are unique and not simple variations of previous ones.
  2.  **Question Types:**
      *   **Logical Reasoning:** Include questions on series completion, analogies, coding-decoding, and pattern recognition.
      *   **Quantitative Analysis:** Include questions on arithmetic, algebra, geometry, and data interpretation. Problems should require calculation.
      *   **Verbal Ability:** Include questions on synonyms, antonyms, sentence completion, and reading comprehension passages (keep passages short, 1-2 paragraphs).
  3.  **Structure:** For each question, provide the question text, four distinct options, and the 0-based index of the correct answer.
  4.  **Complexity:** The questions should be of medium difficulty, suitable for a general corporate or tech job screening.
  5.  **Adherence to Counts:** Strictly adhere to the number of questions requested for each category.`,
  prompt: `
  Generate an aptitude exam with the following structure:
  - Logical Reasoning Questions: {{{logicalReasoningCount}}}
  - Quantitative Analysis Questions: {{{quantitativeAnalysisCount}}}
  - Verbal Ability Questions: {{{verbalAbilityCount}}}

  Please generate the exam now.
`,
});

const generateAptitudeExamFlow = ai.defineFlow(
  {
    name: 'generateAptitudeExam',
    inputSchema: GenerateAptitudeExamInputSchema,
    outputSchema: GenerateAptitudeExamOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

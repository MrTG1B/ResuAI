
'use server';

/**
 * @fileOverview Parses a resume file and extracts its content as HTML.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  htmlContent: z
    .string()
    .describe('The full HTML content extracted from the resume.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(
  input: ParseResumeInput
): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const systemPrompt = `You are an expert resume writer and designer. Your task is to:
1. Extract ALL text content from the provided resume document.
2. Using that extracted content, generate a brand-new, single-page, professional, industry-standard, ATS-friendly HTML resume.

**CRITICAL RULES:**
1.  **ATS-FRIENDLY DESIGN:** Create a clean, modern resume that Applicant Tracking Systems can parse easily:
    - Single-column layout with a subtle border around the page.
    - Standard web-safe fonts: 'Arial', 'Helvetica', 'Times New Roman', or 'Georgia'.
    - Clear standard section headings: "Work Experience", "Education", "Skills", "Projects", "Certifications".
    - No tables, graphics, or multi-column layouts.
2.  **UNIFORM FONT SIZES — NEVER vary font sizes to squeeze content:**
    - Body / paragraph text: **exactly 10pt** everywhere — no exceptions, no mixing sizes.
    - Name heading: **exactly 18pt**.
    - Section headings: **exactly 12pt**.
    - Sub-labels (company, dates, title): **exactly 10pt**, differentiated by bold or colour only.
    - Line-height: **1.3** throughout — never change it per element.
    - **NEVER shrink any individual element to a smaller size just to fit. Consistent typography is mandatory.**
3.  **STRICT Single-Page Layout — fit via CONTENT CURATION, not font juggling:**
    The outermost wrapper div MUST include \`style="width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;max-height:271.6mm;"\`. Fit everything on one page by curating intelligently:
    - **Projects:** Include only the **2–3 most impressive/relevant projects**. If the original has more, add a short line at the end of the section: *"For additional projects, visit [GitHub Profile URL or 'my GitHub profile']"*.
    - **Work Experience:** Max **3 concise, rewritten, action-oriented bullet points per role**.
    - **Summary:** Max **2–3 tightly written sentences**.
    - **Skills:** Display as comma-separated inline text or a compact wrapped list — not one per line.
    - **Certifications / Languages / Interests:** Include only if space allows; omit if the page is full.
    - **Section spacing:** 6px top/bottom margin between sections only.
    - **DO NOT** use fixed pixel or mm widths (e.g. \`width:210mm\`, \`width:794px\`) on any element — use \`width:100%\` or percentage-based widths only.
4.  **New Professional Design:** Do NOT preserve the original document's layout or styling. Generate a fresh, modern, professional design.
5.  **Inline CSS Only:** All styling MUST use inline CSS (e.g., \`style="font-size: 10pt;"\`). No <style> tags.
6.  **No Extra Tags:** Do not include <html>, <head>, or <body> tags. The output MUST be a single block of HTML.
7.  **Complete Content:** Include every piece of information found in the original document — contact details, summary, experience, education, skills, projects, certifications, languages, and any other relevant sections.`;

const prompt = ai.definePrompt({
    name: 'parseResumePrompt',
    model: 'googleai/gemini-2.5-flash',
    system: systemPrompt,
    input: { schema: ParseResumeInputSchema },
    output: { schema: ParseResumeOutputSchema },
    prompt: `{{media url=resumeDataUri}}

Please extract all text content from the provided resume document and generate a brand-new, professional, single-page, ATS-friendly HTML resume. Apply a clean, modern design with inline CSS. The outermost wrapper div MUST include \`style="width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;max-height:271.6mm;"\`. Use UNIFORM font sizes throughout (body 10pt, section headings 12pt, name 18pt, line-height 1.3 — never deviate). Fit the content on one A4 page by curating it: show only the 2–3 best projects (add a GitHub line for the rest), write concise bullets (max 3 per role), keep skills inline — do NOT shrink font sizes to squeeze content. Do NOT use fixed pixel or mm widths on any element.
    `
});


const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResume',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_BASE = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { output } = await prompt(input);
        if (!output) {
          throw new Error('AI failed to generate a response.');
        }
        return output;
      } catch (error: any) {
        console.error(`parseResume attempt ${attempt} failed:`, error);
        if (
          error.status === 403 ||
          error.status === 401 ||
          (error.message &&
            (error.message.includes('SAFETY') ||
              error.message.includes('blocked') ||
              error.message.includes('API_KEY') ||
              error.message.includes('leaked') ||
              error.message.includes('Forbidden') ||
              error.message.includes('API key')))
        ) {
          throw error;
        }
        if (attempt === MAX_RETRIES) throw error;
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Maximum retries exceeded');
  }
);

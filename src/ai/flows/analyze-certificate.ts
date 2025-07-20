'use server';
/**
 * @fileOverview Analyzes a certificate file and extracts key details.
 *
 * - analyzeCertificate - A function that handles parsing the certificate.
 * - AnalyzeCertificateInput - The input type for the function.
 * - AnalyzeCertificateOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCertificateInputSchema = z.object({
  certificateDataUri: z
    .string()
    .describe(
      "The certificate file (e.g., PDF, JPG, PNG) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCertificateInput = z.infer<typeof AnalyzeCertificateInputSchema>;

const AnalyzeCertificateOutputSchema = z.object({
  name: z.string().describe("The full name or title of the certification."),
  issuingOrganization: z.string().describe("The name of the organization that issued the certificate."),
  date: z.string().describe("The date the certificate was issued or obtained (e.g., 'May 2023' or '2023-05-15')."),
  credentialUrl: z.string().url().optional().describe("A URL to the credential if one is found on the certificate."),
});
export type AnalyzeCertificateOutput = z.infer<typeof AnalyzeCertificateOutputSchema>;


export async function analyzeCertificate(input: AnalyzeCertificateInput): Promise<AnalyzeCertificateOutput> {
  return analyzeCertificateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCertificatePrompt',
  model: 'gemini-1.5-flash',
  input: {schema: AnalyzeCertificateInputSchema},
  output: {schema: AnalyzeCertificateOutputSchema},
  prompt: `You are an AI expert at analyzing official documents, licenses, and certificates.
  
  Your task is to extract key details from the provided certificate file.
  - Extract the full name of the certification.
  - Extract the name of the issuing organization.
  - Extract the date of issuance or completion.
  - If a URL for verifying the credential is present, extract it.

  Here is the document:
  {{media url=certificateDataUri}}`,
});

const analyzeCertificateFlow = ai.defineFlow(
  {
    name: 'analyzeCertificateFlow',
    inputSchema: AnalyzeCertificateInputSchema,
    outputSchema: AnalyzeCertificateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
